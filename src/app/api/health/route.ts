/**
 * Health Check API Endpoint
 *
 * Comprehensive health check endpoint for monitoring system status,
 * performance metrics, and component health.
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor, PerformanceMetrics } from '@/lib/performance/monitor'
import { cache } from '@/lib/cache/cache-manager'
import { connectionPool, ConnectionMetrics } from '@/lib/performance/connection-pool'
import { logger } from '@/lib/monitoring/logger'
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

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical'
  timestamp: number
  uptime: number
  version: string
  environment: string
  checks: {
    database: HealthCheckItem
    cache: HealthCheckItem
    connections: HealthCheckItem
    memory: HealthCheckItem
    performance: HealthCheckItem
    logger: HealthCheckItem
  }
  metrics: {
    performance: PerformanceMetrics | null
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
  }
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    warnings: number
  }
}

export interface HealthCheckItem {
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  responseTime: number
  message?: string
  details?: Record<string, any>
  lastCheck: number
}

/**
 * Main health check endpoint
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now()
  const requestId = `health_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    logger.info('Health check started', { requestId }, ['health-check', 'start'])

    const healthCheck = await performHealthCheck()
    const duration = Date.now() - startTime

    logger.info(
      'Health check completed',
      {
        requestId,
        status: healthCheck.status,
        duration,
        passedChecks: healthCheck.summary.passedChecks,
        failedChecks: healthCheck.summary.failedChecks,
      },
      ['health-check', 'complete']
    )

    // Return appropriate HTTP status based on health
    const statusCode =
      healthCheck.status === 'critical' ? 503 : healthCheck.status === 'warning' ? 200 : 200

    return NextResponse.json(healthCheck, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Request-ID': requestId,
        'X-Response-Time': duration.toString(),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      'Health check failed',
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestId,
        duration,
        errorMessage,
      },
      ['health-check', 'error']
    )

    const criticalResponse: HealthCheckResult = {
      status: 'critical',
      timestamp: Date.now(),
      uptime: process.uptime() * 1000,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: 'critical',
          responseTime: duration,
          message: 'Health check system failure',
          lastCheck: Date.now(),
        },
        cache: {
          status: 'critical',
          responseTime: duration,
          message: 'Health check system failure',
          lastCheck: Date.now(),
        },
        connections: {
          status: 'critical',
          responseTime: duration,
          message: 'Health check system failure',
          lastCheck: Date.now(),
        },
        memory: {
          status: 'critical',
          responseTime: duration,
          message: 'Health check system failure',
          lastCheck: Date.now(),
        },
        performance: {
          status: 'critical',
          responseTime: duration,
          message: 'Health check system failure',
          lastCheck: Date.now(),
        },
        logger: {
          status: 'critical',
          responseTime: duration,
          message: 'Health check system failure',
          lastCheck: Date.now(),
        },
      },
      metrics: {
        performance: null,
        cache: null,
        connections: null,
        logger: null,
      },
      summary: {
        totalChecks: 6,
        passedChecks: 0,
        failedChecks: 6,
        warnings: 0,
      },
    }

    return NextResponse.json(criticalResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Response-Time': duration.toString(),
      },
    })
  }
}

/**
 * Detailed health check endpoint
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `health_detailed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const body = await request.json().catch(() => ({}))
    const { includeLogs = false, includeMetrics = true, includeDetails = true } = body

    logger.info(
      'Detailed health check started',
      {
        requestId,
        includeLogs,
        includeMetrics,
        includeDetails,
      },
      ['health-check', 'detailed', 'start']
    )

    const healthCheck = await performDetailedHealthCheck(
      includeLogs,
      includeMetrics,
      includeDetails
    )
    const duration = Date.now() - startTime

    logger.info(
      'Detailed health check completed',
      {
        requestId,
        status: healthCheck.status,
        duration,
        checksCount: Object.keys(healthCheck.checks).length,
      },
      ['health-check', 'detailed', 'complete']
    )

    const statusCode = healthCheck.status === 'critical' ? 503 : 200

    return NextResponse.json(healthCheck, {
      status: statusCode,
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
      'Detailed health check failed',
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestId,
        duration,
        errorMessage,
      },
      ['health-check', 'detailed', 'error']
    )

    return NextResponse.json(
      {
        status: 'critical',
        error: errorMessage,
        timestamp: Date.now(),
        duration,
      },
      {
        status: 503,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': duration.toString(),
        },
      }
    )
  }
}

/**
 * Perform basic health check
 */
async function performHealthCheck(): Promise<HealthCheckResult> {
  const _startTime = Date.now()
  const checks = {
    database: await checkDatabaseHealth(),
    cache: await checkCacheHealth(),
    connections: await checkConnectionsHealth(),
    memory: await checkMemoryHealth(),
    performance: await checkPerformanceHealth(),
    logger: await checkLoggerHealth(),
  }

  const results = Object.values(checks)
  const passedChecks = results.filter(check => check.status === 'healthy').length
  const failedChecks = results.filter(check => check.status === 'critical').length
  const warnings = results.filter(check => check.status === 'warning').length

  const overallStatus =
    failedChecks > 0 ? 'critical' : warnings > 2 ? 'warning' : warnings > 0 ? 'warning' : 'healthy'

  // Get current metrics
  const [performanceMetrics, cacheMetrics, connectionMetricsRaw] = await Promise.all([
    performanceMonitor.getCurrentMetrics(),
    Promise.resolve(cache.getStats()),
    Promise.resolve(connectionPool.getMetrics()),
  ])

  const connectionMetrics =
    typeof connectionMetricsRaw === 'object' && 'activeConnections' in connectionMetricsRaw
      ? (connectionMetricsRaw as Record<string, ConnectionMetrics>)
      : (connectionMetricsRaw as Record<string, ConnectionMetrics>)

  const loggerStats = logger.getStats()

  return {
    status: overallStatus,
    timestamp: Date.now(),
    uptime: process.uptime() * 1000,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    metrics: {
      performance: performanceMetrics,
      cache: cacheMetrics,
      connections: connectionMetrics,
      logger: loggerStats,
    },
    summary: {
      totalChecks: results.length,
      passedChecks,
      failedChecks,
      warnings,
    },
  }
}

/**
 * Perform detailed health check with additional information
 */
async function performDetailedHealthCheck(
  includeLogs: boolean,
  includeMetrics: boolean,
  includeDetails: boolean
): Promise<
  HealthCheckResult & {
    details?: {
      system: {
        platform: string
        arch: string
        nodeVersion: string
        pid: number
        memoryUsage: MemoryUsage
        cpuUsage: CpuUsage
      }
      performance: Awaited<ReturnType<typeof performanceMonitor.getPerformanceReport>>
      cache: {
        totalEntries: number
        expiredEntries: number
        activeEntries: number
        hitRate?: number
        sampleKeys: string[]
      }
      connections: ReturnType<typeof ConnectionMonitor.getPerformanceReport>
    }
    recentLogs?: {
      stats: {
        totalLogs: number
        errorCount: number
        warnCount: number
        bufferSize: number
        uptime: number
        logsByLevel: Record<string, number>
        logsByComponent: Record<string, number>
      }
      errors: unknown[]
      warnings: unknown[]
      recent: unknown[]
    }
  }
> {
  const basicHealth = await performHealthCheck()

  const enhancedHealth: HealthCheckResult & {
    details?: {
      system: {
        platform: string
        arch: string
        nodeVersion: string
        pid: number
        memoryUsage: MemoryUsage
        cpuUsage: CpuUsage
      }
      performance: Awaited<ReturnType<typeof performanceMonitor.getPerformanceReport>>
      cache: {
        totalEntries: number
        expiredEntries: number
        activeEntries: number
        hitRate?: number
        sampleKeys: string[]
      }
      connections: ReturnType<typeof ConnectionMonitor.getPerformanceReport>
    }
    recentLogs?: {
      stats: {
        totalLogs: number
        errorCount: number
        warnCount: number
        bufferSize: number
        uptime: number
        logsByLevel: Record<string, number>
        logsByComponent: Record<string, number>
      }
      errors: unknown[]
      warnings: unknown[]
      recent: unknown[]
    }
  } = { ...basicHealth }

  if (includeDetails) {
    enhancedHealth.details = {
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      performance: await performanceMonitor.getPerformanceReport(),
      cache: {
        ...cache.getStats(),
        sampleKeys: getCacheSampleKeys(),
      },
      connections: ConnectionMonitor.getPerformanceReport(),
    }
  }

  if (includeLogs) {
    enhancedHealth.recentLogs = {
      stats: logger.getStats(),
      errors: logger.getLogs({ level: 3, limit: 10 }),
      warnings: logger.getLogs({ level: 2, limit: 10 }),
      recent: logger.getLogs({ limit: 50 }),
    }
  }

  return enhancedHealth
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<HealthCheckItem> {
  const startTime = Date.now()

  try {
    // Simple health check - this would be expanded based on actual database setup
    const metrics = performanceMonitor.getCurrentMetrics()

    if (!metrics) {
      return {
        status: 'warning',
        responseTime: Date.now() - startTime,
        message: 'Performance metrics not available',
        lastCheck: Date.now(),
      }
    }

    const dbMetrics = metrics.database
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    let message = ''

    if (dbMetrics.averageQueryTime > 2000) {
      status = 'critical'
      message = 'Database queries are very slow'
    } else if (dbMetrics.averageQueryTime > 1000) {
      status = 'warning'
      message = 'Database queries are slow'
    }

    if (dbMetrics.connectionPoolUtilization > 0.9) {
      status = 'critical'
      message = 'Database connection pool is exhausted'
    } else if (dbMetrics.connectionPoolUtilization > 0.8) {
      status = status === 'healthy' ? 'warning' : status
      message = message || 'Database connection pool is under stress'
    }

    return {
      status,
      responseTime: Date.now() - startTime,
      message: message || 'Database is healthy',
      details: {
        averageQueryTime: dbMetrics.averageQueryTime,
        connectionPoolUtilization: dbMetrics.connectionPoolUtilization,
        activeConnections: dbMetrics.activeConnections,
        totalConnections: dbMetrics.totalConnections,
      },
      lastCheck: Date.now(),
    }
  } catch (error) {
    return {
      status: 'critical',
      responseTime: Date.now() - startTime,
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: Date.now(),
    }
  }
}

/**
 * Check cache health
 */
async function checkCacheHealth(): Promise<HealthCheckItem> {
  const startTime = Date.now()

  try {
    const stats = cache.getStats()
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    let message = ''

    if (stats.hitRate !== undefined && stats.hitRate < 0.5) {
      status = 'warning'
      message = 'Cache hit rate is low'
    }

    if (stats.totalEntries === 0) {
      status = 'warning'
      message = 'Cache is empty'
    }

    const memoryUsage = process.memoryUsage()
    const memoryUtilization = memoryUsage.heapUsed / memoryUsage.heapTotal

    if (memoryUtilization > 0.9) {
      status = 'critical'
      message = 'High memory usage may affect cache performance'
    }

    return {
      status,
      responseTime: Date.now() - startTime,
      message: message || 'Cache is healthy',
      details: {
        hitRate: stats.hitRate,
        totalEntries: stats.totalEntries,
        activeEntries: stats.activeEntries,
        memoryUtilization: memoryUtilization,
      },
      lastCheck: Date.now(),
    }
  } catch (error) {
    return {
      status: 'critical',
      responseTime: Date.now() - startTime,
      message: `Cache health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: Date.now(),
    }
  }
}

/**
 * Check connection pool health
 */
async function checkConnectionsHealth(): Promise<HealthCheckItem> {
  const startTime = Date.now()

  try {
    const isHealthy = ConnectionMonitor.isHealthy()
    const metrics = connectionPool.getMetrics()
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    let message = ''

    // Check connection metrics for all pool types
    for (const [poolType, poolMetrics] of Object.entries(metrics)) {
      if (poolMetrics.activeConnections > 50) {
        status = 'critical'
        message = `Too many active connections in ${poolType} pool`
        break
      }

      if (poolMetrics.averageResponseTime > 5000) {
        status = 'warning'
        message = `Slow response times in ${poolType} pool`
      }
    }

    if (!isHealthy) {
      status = 'critical'
      message = 'Connection pool is unhealthy'
    }

    return {
      status: isHealthy && status === 'healthy' ? 'healthy' : status,
      responseTime: Date.now() - startTime,
      message: message || 'Connection pool is healthy',
      details: {
        isHealthy,
        pools: metrics,
      },
      lastCheck: Date.now(),
    }
  } catch (error) {
    return {
      status: 'critical',
      responseTime: Date.now() - startTime,
      message: `Connection pool health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: Date.now(),
    }
  }
}

/**
 * Check memory health
 */
async function checkMemoryHealth(): Promise<HealthCheckItem> {
  const startTime = Date.now()

  try {
    const memoryUsage = process.memoryUsage()
    const heapUsed = memoryUsage.heapUsed
    const heapTotal = memoryUsage.heapTotal
    const usagePercentage = heapUsed / heapTotal

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    let message = ''

    if (usagePercentage > 0.95) {
      status = 'critical'
      message = 'Memory usage is critically high'
    } else if (usagePercentage > 0.85) {
      status = 'warning'
      message = 'Memory usage is high'
    }

    // Check for memory leaks (heap growing continuously)
    const metrics = performanceMonitor.getCurrentMetrics()
    if (metrics && metrics.memory.usagePercentage > 0.9) {
      status = 'critical'
      message = 'Memory usage indicates potential memory leak'
    }

    return {
      status,
      responseTime: Date.now() - startTime,
      message: message || 'Memory usage is healthy',
      details: {
        heapUsed,
        heapTotal,
        usagePercentage: usagePercentage * 100,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      lastCheck: Date.now(),
    }
  } catch (error) {
    return {
      status: 'critical',
      responseTime: Date.now() - startTime,
      message: `Memory health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: Date.now(),
    }
  }
}

/**
 * Check performance health
 */
async function checkPerformanceHealth(): Promise<HealthCheckItem> {
  const startTime = Date.now()

  try {
    const report = await performanceMonitor.getPerformanceReport()
    let status: 'healthy' | 'warning' | 'critical' = report.health
    let message = ''

    if (report.health === 'critical') {
      message = 'System performance is critical'
    } else if (report.health === 'warning') {
      message = 'System performance shows warnings'
    } else {
      message = 'System performance is healthy'
    }

    return {
      status,
      responseTime: Date.now() - startTime,
      message,
      details: {
        health: report.health,
        alerts: report.alerts.length,
        recommendations: report.recommendations.length,
        trends: report.trends,
      },
      lastCheck: Date.now(),
    }
  } catch (error) {
    return {
      status: 'critical',
      responseTime: Date.now() - startTime,
      message: `Performance health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: Date.now(),
    }
  }
}

/**
 * Check logger health
 */
async function checkLoggerHealth(): Promise<HealthCheckItem> {
  const _startTime = Date.now()

  try {
    const stats = logger.getStats()
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    let message = ''

    // Check error rate
    const errorRate = stats.totalLogs > 0 ? stats.errorCount / stats.totalLogs : 0
    if (errorRate > 0.2) {
      // More than 20% errors
      status = 'critical'
      message = 'High error rate in logs'
    } else if (errorRate > 0.1) {
      // More than 10% errors
      status = 'warning'
      message = 'Elevated error rate in logs'
    }

    // Check if buffer is getting full
    if (stats.bufferSize > stats.totalLogs * 0.9) {
      status = status === 'healthy' ? 'warning' : status
      message = message || 'Log buffer is nearly full'
    }

    return {
      status,
      responseTime: Date.now() - _startTime,
      message: message || 'Logger is healthy',
      details: {
        totalLogs: stats.totalLogs,
        errorCount: stats.errorCount,
        warnCount: stats.warnCount,
        bufferSize: stats.bufferSize,
        errorRate: errorRate * 100,
      },
      lastCheck: Date.now(),
    }
  } catch (error) {
    return {
      status: 'critical',
      responseTime: Date.now() - _startTime,
      message: `Logger health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: Date.now(),
    }
  }
}

/**
 * Get sample cache keys for debugging
 */
function getCacheSampleKeys(): string[] {
  // This would need to be implemented based on cache implementation
  // For now, return empty array
  return []
}
