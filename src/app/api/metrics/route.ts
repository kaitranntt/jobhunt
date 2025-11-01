/**
 * Metrics API Endpoint
 *
 * API endpoint for retrieving performance metrics,
 * monitoring data, and system statistics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor, PerformanceMetrics, PerformanceAlert } from '@/lib/performance/monitor'
import { cache } from '@/lib/cache/cache-manager'
import { connectionPool, ConnectionMetrics } from '@/lib/performance/connection-pool'
import { logger, LogEntry } from '@/lib/monitoring/logger'
import { ConnectionMonitor } from '@/lib/performance/connection-pool'

// Custom type definitions to replace NodeJS namespace
type MemoryUsage = {
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  arrayBuffers: number
}

type CpuUsage = {
  user: number
  system: number
}

export interface MetricsResponse {
  timestamp: number
  performance: Awaited<ReturnType<typeof performanceMonitor.getPerformanceReport>> | null
  cache: {
    totalEntries: number
    expiredEntries: number
    activeEntries: number
    hitRate?: number
  } | null
  connections: Record<string, ConnectionMetrics> | null
  logger: {
    totalLogs: number
    errorCount: number
    warnCount: number
    bufferSize: number
    uptime: number
    logsByLevel: Record<string, number>
    logsByComponent: Record<string, number>
  } | null
  system: {
    uptime: number
    platform: string
    arch: string
    nodeVersion: string
    pid: number
    memory: MemoryUsage
    cpu: CpuUsage
    environment: string
  } | null
  alerts: PerformanceAlert[]
  recentLogs?: LogEntry[]
  connectionReport?: ReturnType<typeof ConnectionMonitor.getPerformanceReport>
}

/**
 * GET /api/metrics - Get current system metrics
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `metrics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')?.split(',') || []
    const timeRange = parseInt(searchParams.get('timeRange') || '60') // minutes
    const format = searchParams.get('format') || 'json'

    logger.info(
      'Metrics request started',
      {
        requestId,
        include,
        timeRange,
        format,
      },
      ['metrics', 'api', 'start']
    )

    const metrics = await collectMetrics(include, timeRange)
    const duration = Date.now() - startTime

    logger.info(
      'Metrics request completed',
      {
        requestId,
        duration,
        categoriesIncluded: Object.keys(metrics).length,
      },
      ['metrics', 'api', 'success']
    )

    // Format response based on requested format
    if (format === 'csv') {
      return new Response(formatMetricsAsCSV(metrics), {
        headers: {
          'Content-Type': 'text/csv',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Request-ID': requestId,
          'X-Response-Time': duration.toString(),
        },
      })
    }

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Response-Time': duration.toString(),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      'Metrics request failed',
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestId,
        duration,
        errorMessage,
      },
      ['metrics', 'api', 'error']
    )

    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: errorMessage,
        timestamp: Date.now(),
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': duration.toString(),
        },
      }
    )
  }
}

/**
 * POST /api/metrics - Get specific metrics or export data
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `metrics_post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const body = await request.json()
    const {
      include = [],
      timeRange = 60,
      format = 'json',
      filters = {},
      exportType = 'current',
    } = body

    logger.info(
      'Metrics POST request started',
      {
        requestId,
        include,
        timeRange,
        format,
        filters,
        exportType,
      },
      ['metrics', 'api', 'post', 'start']
    )

    let metrics:
      | MetricsResponse
      | {
          timestamp: number
          timeRange: number
          dataPoints: number
          history: PerformanceMetrics[]
          trends: ReturnType<typeof calculateTrends>
          filters: Record<string, unknown>
        }
      | {
          timestamp: number
          timeRange: number
          summary?: string
          database?: {
            averageQueryTime: number
            totalQueries: number
            slowQueries: number
          }
          cache?: {
            averageHitRate: number
            averageMemoryUsage: number
            totalEvictions: number
          }
          api?: {
            averageResponseTime: number
            totalRequests: number
            errorRate: number
          }
          memory?: {
            averageUsage: number
            peakUsage: number
            averageHeapUsed: number
          }
          filters: Record<string, unknown>
        }
      | {
          timestamp: number
          timeRange: number
          totalAlerts: number
          filteredAlerts: number
          alerts: PerformanceAlert[]
          summary: {
            byType: Record<string, number>
            byCategory: Record<string, number>
          }
          filters: Record<string, unknown>
        }
      | {
          timestamp: number
          timeRange: number
          stats: {
            totalLogs: number
            errorCount: number
            warnCount: number
            bufferSize: number
            uptime: number
            logsByLevel: Record<string, number>
            logsByComponent: Record<string, number>
          }
          logs: LogEntry[]
          summary: {
            totalLogs: number
            byLevel: Record<string, number>
            byComponent: Record<string, number>
            topErrors: Array<{
              message: string
              timestamp: number
              component?: string
            }>
          }
          filters: Record<string, unknown>
        }

    switch (exportType) {
      case 'history':
        metrics = await collectHistoricalMetrics(timeRange, filters)
        break
      case 'summary':
        metrics = await collectSummaryMetrics(timeRange, filters)
        break
      case 'alerts':
        metrics = await collectAlerts(timeRange, filters)
        break
      case 'logs':
        metrics = await collectLogMetrics(timeRange, filters)
        break
      default:
        metrics = await collectMetrics(include, timeRange)
    }

    const duration = Date.now() - startTime

    logger.info(
      'Metrics POST request completed',
      {
        requestId,
        duration,
        exportType,
        recordsCount: Array.isArray(metrics) ? metrics.length : Object.keys(metrics).length,
      },
      ['metrics', 'api', 'post', 'success']
    )

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Response-Time': duration.toString(),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      'Metrics POST request failed',
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestId,
        duration,
        errorMessage,
      },
      ['metrics', 'api', 'post', 'error']
    )

    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: errorMessage,
        timestamp: Date.now(),
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': duration.toString(),
        },
      }
    )
  }
}

/**
 * Collect current metrics
 */
async function collectMetrics(include: string[], _timeRange: number): Promise<MetricsResponse> {
  const includePerformance = include.length === 0 || include.includes('performance')
  const includeCache = include.length === 0 || include.includes('cache')
  const includeConnections = include.length === 0 || include.includes('connections')
  const includeLogger = include.length === 0 || include.includes('logger')
  const includeSystem = include.length === 0 || include.includes('system')
  const includeAlerts = include.length === 0 || include.includes('alerts')

  const metrics: Partial<MetricsResponse> = {
    timestamp: Date.now(),
  }

  const promises: Promise<Record<string, unknown>>[] = []

  if (includePerformance) {
    promises.push(
      performanceMonitor.getPerformanceReport().then(report => ({ performance: report }))
    )
  }

  if (includeCache) {
    promises.push(Promise.resolve().then(() => ({ cache: cache.getStats() })))
  }

  if (includeConnections) {
    promises.push(
      Promise.resolve().then(() => {
        const connectionsRaw = connectionPool.getMetrics()
        const connections =
          typeof connectionsRaw === 'object' && 'activeConnections' in connectionsRaw
            ? (connectionsRaw as Record<string, ConnectionMetrics>)
            : (connectionsRaw as Record<string, ConnectionMetrics>)
        return {
          connections,
          connectionReport: ConnectionMonitor.getPerformanceReport(),
        }
      })
    )
  }

  if (includeLogger) {
    promises.push(
      Promise.resolve().then(() => {
        const loggerStats = logger.getStats()
        return {
          logger: {
            totalLogs: loggerStats.totalLogs,
            errorCount: loggerStats.errorCount,
            warnCount: loggerStats.warnCount,
            bufferSize: loggerStats.bufferSize,
            uptime: loggerStats.uptime,
            logsByLevel: loggerStats.logsByLevel as Record<string, number>,
            logsByComponent: loggerStats.logsByComponent,
          },
          recentLogs: logger.getLogs({ limit: 100 }),
        }
      })
    )
  }

  if (includeSystem) {
    promises.push(Promise.resolve().then(() => ({ system: collectSystemMetrics() })))
  }

  if (includeAlerts) {
    promises.push(Promise.resolve().then(() => ({ alerts: performanceMonitor.getActiveAlerts() })))
  }

  const results = await Promise.all(promises)

  // Merge results
  for (const result of results) {
    Object.assign(metrics, result)
  }

  return metrics as MetricsResponse
}

/**
 * Collect historical metrics
 */
async function collectHistoricalMetrics(
  _timeRange: number,
  filters: Record<string, unknown>
): Promise<{
  timestamp: number
  timeRange: number
  dataPoints: number
  history: PerformanceMetrics[]
  trends: ReturnType<typeof calculateTrends>
  filters: Record<string, unknown>
}> {
  const history = performanceMonitor.getMetricsHistory(_timeRange)

  return {
    timestamp: Date.now(),
    timeRange: _timeRange,
    dataPoints: history.length,
    history: history.map(point => ({
      timestamp: point.timestamp,
      database: point.database,
      cache: point.cache,
      connections: point.connections,
      api: point.api,
      memory: point.memory,
    })),
    trends: calculateTrends(history),
    filters,
  }
}

/**
 * Collect summary metrics
 */
async function collectSummaryMetrics(
  _timeRange: number,
  filters: Record<string, unknown>
): Promise<{
  timestamp: number
  timeRange: number
  summary?: string
  database?: {
    averageQueryTime: number
    totalQueries: number
    slowQueries: number
  }
  cache?: {
    averageHitRate: number
    averageMemoryUsage: number
    totalEvictions: number
  }
  api?: {
    averageResponseTime: number
    totalRequests: number
    errorRate: number
  }
  memory?: {
    averageUsage: number
    peakUsage: number
    averageHeapUsed: number
  }
  filters: Record<string, unknown>
}> {
  const history = performanceMonitor.getMetricsHistory(_timeRange)

  if (history.length === 0) {
    return {
      timestamp: Date.now(),
      timeRange: _timeRange,
      summary: 'No data available',
      filters,
    }
  }

  const summary = {
    timestamp: Date.now(),
    timeRange: _timeRange,
    dataPoints: history.length,
    database: {
      averageQueryTime: calculateAverage(history.map(h => h.database.averageQueryTime)),
      totalQueries: history.reduce((sum, h) => sum + h.database.queryCount, 0),
      slowQueries: history.reduce((sum, h) => sum + h.database.slowQueries, 0),
    },
    cache: {
      averageHitRate: calculateAverage(history.map(h => h.cache.hitRate)),
      averageMemoryUsage: calculateAverage(history.map(h => h.cache.memoryUsage)),
      totalEvictions: history.reduce((sum, h) => sum + h.cache.evictions, 0),
    },
    api: {
      averageResponseTime: calculateAverage(history.map(h => h.api.averageResponseTime)),
      totalRequests: history.reduce((sum, h) => sum + h.api.requestCount, 0),
      errorRate: calculateAverage(history.map(h => h.api.errorRate)),
    },
    memory: {
      averageUsage: calculateAverage(history.map(h => h.memory.usagePercentage)),
      peakUsage: Math.max(...history.map(h => h.memory.usagePercentage)),
      averageHeapUsed: calculateAverage(history.map(h => h.memory.heapUsed)),
    },
    filters,
  }

  return summary
}

/**
 * Collect alerts
 */
async function collectAlerts(
  _timeRange: number,
  filters: Record<string, unknown>
): Promise<{
  timestamp: number
  timeRange: number
  totalAlerts: number
  filteredAlerts: number
  alerts: PerformanceAlert[]
  summary: {
    byType: Record<string, number>
    byCategory: Record<string, number>
  }
  filters: Record<string, unknown>
}> {
  const allAlerts = performanceMonitor.getActiveAlerts()

  // Filter by time range if specified
  const cutoff = Date.now() - _timeRange * 60 * 1000
  const filteredAlerts = allAlerts.filter(alert => alert.timestamp > cutoff)

  // Apply additional filters
  let finalAlerts = filteredAlerts
  if (filters.type) {
    finalAlerts = finalAlerts.filter(alert => alert.type === filters.type)
  }
  if (filters.category) {
    finalAlerts = finalAlerts.filter(alert => alert.category === filters.category)
  }

  return {
    timestamp: Date.now(),
    timeRange: _timeRange,
    totalAlerts: filteredAlerts.length,
    filteredAlerts: finalAlerts.length,
    alerts: finalAlerts.sort((a, b) => b.timestamp - a.timestamp),
    summary: {
      byType: {
        warning: finalAlerts.filter(a => a.type === 'warning').length,
        critical: finalAlerts.filter(a => a.type === 'critical').length,
      },
      byCategory: groupByCategory(finalAlerts),
    },
    filters,
  }
}

/**
 * Collect log metrics
 */
async function collectLogMetrics(
  timeRange: number,
  filters: Record<string, unknown>
): Promise<{
  timestamp: number
  timeRange: number
  stats: {
    totalLogs: number
    errorCount: number
    warnCount: number
    bufferSize: number
    uptime: number
    logsByLevel: Record<string, number>
    logsByComponent: Record<string, number>
  }
  logs: LogEntry[]
  summary: {
    totalLogs: number
    byLevel: Record<string, number>
    byComponent: Record<string, number>
    topErrors: Array<{
      message: string
      timestamp: number
      component?: string
    }>
  }
  filters: Record<string, unknown>
}> {
  const logStats = logger.getStats()
  const recentLogs = logger.getLogs({
    startTime: Date.now() - timeRange * 60 * 1000,
    ...filters,
  })

  return {
    timestamp: Date.now(),
    timeRange,
    stats: logStats,
    logs: recentLogs,
    summary: {
      totalLogs: recentLogs.length,
      byLevel: groupByLevel(recentLogs),
      byComponent: groupByComponent(recentLogs),
      topErrors: recentLogs
        .filter(log => log.level >= 3)
        .slice(0, 10)
        .map(log => ({
          message: log.message,
          timestamp: log.timestamp,
          component: log.component,
        })),
    },
    filters,
  }
}

/**
 * Collect system metrics
 */
function collectSystemMetrics(): {
  uptime: number
  platform: string
  arch: string
  nodeVersion: string
  pid: number
  memory: MemoryUsage
  cpu: CpuUsage
  environment: string
} {
  const memUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()

  return {
    uptime: process.uptime(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    environment: process.env.NODE_ENV || 'development',
  }
}

/**
 * Format metrics as CSV
 */
function formatMetricsAsCSV(metrics: MetricsResponse): string {
  const headers = ['timestamp', 'category', 'metric', 'value', 'unit']

  const rows: string[][] = [headers]

  // Performance metrics
  if (metrics.performance) {
    const perf = metrics.performance.current
    rows.push([
      metrics.timestamp.toString(),
      'performance',
      'database_query_time',
      perf.database.averageQueryTime.toString(),
      'ms',
    ])
    rows.push([
      metrics.timestamp.toString(),
      'performance',
      'cache_hit_rate',
      perf.cache.hitRate.toString(),
      'percentage',
    ])
    rows.push([
      metrics.timestamp.toString(),
      'performance',
      'api_response_time',
      perf.api.averageResponseTime.toString(),
      'ms',
    ])
    rows.push([
      metrics.timestamp.toString(),
      'performance',
      'memory_usage',
      perf.memory.usagePercentage.toString(),
      'percentage',
    ])
  }

  // Cache metrics
  if (metrics.cache) {
    rows.push([
      metrics.timestamp.toString(),
      'cache',
      'hit_rate',
      (metrics.cache.hitRate || 0).toString(),
      'percentage',
    ])
    rows.push([
      metrics.timestamp.toString(),
      'cache',
      'total_entries',
      metrics.cache.totalEntries.toString(),
      'count',
    ])
    rows.push([
      metrics.timestamp.toString(),
      'cache',
      'active_entries',
      metrics.cache.activeEntries.toString(),
      'count',
    ])
  }

  // System metrics
  if (metrics.system) {
    rows.push([
      metrics.timestamp.toString(),
      'system',
      'uptime',
      metrics.system.uptime.toString(),
      'seconds',
    ])
    rows.push([
      metrics.timestamp.toString(),
      'system',
      'memory_heap_used',
      metrics.system.memory.heapUsed.toString(),
      'bytes',
    ])
    rows.push([
      metrics.timestamp.toString(),
      'system',
      'memory_heap_total',
      metrics.system.memory.heapTotal.toString(),
      'bytes',
    ])
  }

  return rows.map(row => row.join(',')).join('\n')
}

/**
 * Calculate average of array values
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * Calculate trends from history
 */
function calculateTrends(history: PerformanceMetrics[]): {
  databaseQueryTime: 'improving' | 'stable' | 'degrading'
  cacheHitRate: 'improving' | 'stable' | 'degrading'
  apiResponseTime: 'improving' | 'stable' | 'degrading'
  memoryUsage: 'improving' | 'stable' | 'degrading'
} {
  if (history.length < 2) {
    return {
      databaseQueryTime: 'stable' as const,
      cacheHitRate: 'stable' as const,
      apiResponseTime: 'stable' as const,
      memoryUsage: 'stable' as const,
    }
  }

  const oldest = history[0]
  const newest = history[history.length - 1]

  return {
    databaseQueryTime: calculateTrend(
      oldest.database.averageQueryTime,
      newest.database.averageQueryTime
    ),
    cacheHitRate: calculateTrend(oldest.cache.hitRate, newest.cache.hitRate),
    apiResponseTime: calculateTrend(oldest.api.averageResponseTime, newest.api.averageResponseTime),
    memoryUsage: calculateTrend(oldest.memory.usagePercentage, newest.memory.usagePercentage),
  }
}

/**
 * Calculate trend direction
 */
function calculateTrend(oldValue: number, newValue: number): 'improving' | 'stable' | 'degrading' {
  const change = (newValue - oldValue) / oldValue
  if (Math.abs(change) < 0.05) return 'stable'
  return change > 0 ? 'degrading' : 'improving'
}

/**
 * Group alerts by category
 */
function groupByCategory(alerts: PerformanceAlert[]): Record<string, number> {
  const groups: Record<string, number> = {}
  for (const alert of alerts) {
    groups[alert.category] = (groups[alert.category] || 0) + 1
  }
  return groups
}

/**
 * Group logs by level
 */
function groupByLevel(logs: LogEntry[]): Record<string, number> {
  const groups: Record<string, number> = {}
  for (const log of logs) {
    const levelName = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'][log.level] || 'UNKNOWN'
    groups[levelName] = (groups[levelName] || 0) + 1
  }
  return groups
}

/**
 * Group logs by component
 */
function groupByComponent(logs: LogEntry[]): Record<string, number> {
  const groups: Record<string, number> = {}
  for (const log of logs) {
    const component = log.component || 'unknown'
    groups[component] = (groups[component] || 0) + 1
  }
  return groups
}
