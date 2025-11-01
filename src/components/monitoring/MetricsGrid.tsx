/**
 * Metrics Grid Component
 *
 * Grid layout for displaying multiple metrics with responsive design
 * and organized categorization.
 */

'use client'

import React from 'react'
import { MetricCard } from './MetricCard'
import { PerformanceMetrics } from '@/lib/performance/monitor'
import { ConnectionMetrics } from '@/lib/performance/connection-pool'

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

export interface MetricsGridProps {
  metrics?: {
    performance?: PerformanceMetrics | null
    cache?: {
      totalEntries: number
      expiredEntries: number
      activeEntries: number
      hitRate?: number
      memoryUsage?: number
      evictions?: number
    } | null
    connections?: Record<string, ConnectionMetrics> | null
    logger?: {
      totalLogs: number
      errorCount: number
      warnCount: number
      bufferSize: number
      uptime: number
      logsByLevel: Record<string, number>
      logsByComponent: Record<string, number>
    } | null
    system?: {
      uptime: number
      platform: string
      arch: string
      nodeVersion: string
      pid: number
      memory: MemoryUsage
      cpu: CpuUsage
      environment: string
    } | null
    alerts?: Array<{
      type: 'warning' | 'critical'
      message: string
      timestamp: number
    }> | null
  }
  loading?: boolean
  onRefresh?: () => Promise<void>
  className?: string
}

export function MetricsGrid({
  metrics,
  loading = false,
  onRefresh,
  className = '',
}: MetricsGridProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%'
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return ms.toFixed(0) + 'ms'
    return (ms / 1000).toFixed(2) + 's'
  }

  const getMemoryStatus = (usage: number): 'healthy' | 'warning' | 'critical' => {
    if (usage > 0.9) return 'critical'
    if (usage > 0.8) return 'warning'
    return 'healthy'
  }

  const getResponseTimeStatus = (ms: number): 'healthy' | 'warning' | 'critical' => {
    if (ms > 5000) return 'critical'
    if (ms > 2000) return 'warning'
    return 'healthy'
  }

  const getHitRateStatus = (rate: number): 'healthy' | 'warning' | 'critical' => {
    if (rate < 0.5) return 'critical'
    if (rate < 0.7) return 'warning'
    return 'healthy'
  }

  const getErrorRateStatus = (rate: number): 'healthy' | 'warning' | 'critical' => {
    if (rate > 0.1) return 'critical'
    if (rate > 0.05) return 'warning'
    return 'healthy'
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {/* Database Metrics */}
      {metrics?.performance && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Database Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Query Time"
              value={metrics.performance.database.averageQueryTime.toFixed(1)}
              unit="ms"
              description="Average database query response time"
              status={getResponseTimeStatus(metrics.performance.database.averageQueryTime)}
              threshold={{ warning: 1000, critical: 2000 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />

            <MetricCard
              title="Total Queries"
              value={metrics.performance.database.queryCount}
              description="Number of database queries executed"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />

            <MetricCard
              title="Slow Queries"
              value={metrics.performance.database.slowQueries}
              description="Queries exceeding performance threshold"
              status={metrics.performance.database.slowQueries > 10 ? 'warning' : 'healthy'}
              threshold={{ warning: 10, critical: 50 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />

            <MetricCard
              title="Connection Pool"
              value={metrics.performance.database.activeConnections}
              description="Active database connections"
              status={
                metrics.performance.database.connectionPoolUtilization > 0.8 ? 'warning' : 'healthy'
              }
              threshold={{ warning: 40, critical: 50 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />
          </div>
        </div>
      )}

      {/* Cache Metrics */}
      {metrics?.cache && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cache Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Hit Rate"
              value={formatPercentage(metrics.cache.hitRate || 0)}
              description="Cache hit rate percentage"
              status={getHitRateStatus(metrics.cache.hitRate || 0)}
              threshold={{ warning: 70, critical: 50 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Total Entries"
              value={metrics.cache.totalEntries || 0}
              description="Number of items in cache"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Memory Usage"
              value={formatBytes(metrics.cache.memoryUsage || 0)}
              description="Cache memory consumption"
              status={(metrics.cache.memoryUsage || 0) > 100 * 1024 * 1024 ? 'warning' : 'healthy'}
              threshold={{ warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Evictions"
              value={metrics.cache.evictions || 0}
              description="Number of items evicted from cache"
              status={(metrics.cache.evictions || 0) > 100 ? 'warning' : 'healthy'}
              threshold={{ warning: 100, critical: 500 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* API Performance */}
      {metrics?.performance && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">API Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Response Time"
              value={metrics.performance.api.averageResponseTime.toFixed(1)}
              unit="ms"
              description="Average API response time"
              status={getResponseTimeStatus(metrics.performance.api.averageResponseTime)}
              threshold={{ warning: 2000, critical: 5000 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />

            <MetricCard
              title="Total Requests"
              value={metrics.performance.api.requestCount}
              description="Total API requests processed"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />

            <MetricCard
              title="Error Rate"
              value={formatPercentage(metrics.performance.api.errorRate)}
              description="API error rate percentage"
              status={getErrorRateStatus(metrics.performance.api.errorRate)}
              threshold={{ warning: 5, critical: 10 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />

            <MetricCard
              title="Slow Requests"
              value={metrics.performance.api.slowRequests}
              description="Requests exceeding performance threshold"
              status={metrics.performance.api.slowRequests > 20 ? 'warning' : 'healthy'}
              threshold={{ warning: 20, critical: 50 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
              timestamp={metrics.performance.timestamp}
            />
          </div>
        </div>
      )}

      {/* System Metrics */}
      {metrics?.system && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">System Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Memory Usage"
              value={formatPercentage(
                metrics.system.memory.heapUsed / metrics.system.memory.heapTotal
              )}
              description="Node.js heap memory usage"
              status={getMemoryStatus(
                metrics.system.memory.heapUsed / metrics.system.memory.heapTotal
              )}
              threshold={{ warning: 80, critical: 90 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            >
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Heap Used:</span>
                  <span>{formatBytes(metrics.system.memory.heapUsed)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Heap Total:</span>
                  <span>{formatBytes(metrics.system.memory.heapTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>RSS:</span>
                  <span>{formatBytes(metrics.system.memory.rss)}</span>
                </div>
              </div>
            </MetricCard>

            <MetricCard
              title="Uptime"
              value={formatDuration(metrics.system.uptime * 1000)}
              description="System uptime"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Process ID"
              value={metrics.system.pid}
              description="Node.js process identifier"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Environment"
              value={metrics.system.environment}
              description="Running environment"
              status={metrics.system.environment === 'production' ? 'healthy' : 'warning'}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Connection Pool Metrics */}
      {metrics?.connections && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connection Pools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.connections).map(
              ([poolType, poolMetrics]: [string, ConnectionMetrics]) => (
                <MetricCard
                  key={poolType}
                  title={`${poolType} Connections`}
                  value={poolMetrics.activeConnections}
                  description={`Active ${poolType} connections`}
                  status={poolMetrics.activeConnections > 40 ? 'warning' : 'healthy'}
                  threshold={{ warning: 40, critical: 50 }}
                  refreshable={!!onRefresh}
                  onRefresh={onRefresh}
                  loading={loading}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Total:</span>
                      <span>{poolMetrics.totalConnections}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Pooled:</span>
                      <span>{poolMetrics.pooledConnections}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Avg Response:</span>
                      <span>{poolMetrics.averageResponseTime.toFixed(1)}ms</span>
                    </div>
                  </div>
                </MetricCard>
              )
            )}
          </div>
        </div>
      )}

      {/* Logger Metrics */}
      {metrics?.logger && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Logging Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Logs"
              value={metrics.logger.totalLogs}
              description="Total log entries"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Error Count"
              value={metrics.logger.errorCount}
              description="Number of error logs"
              status={metrics.logger.errorCount > 50 ? 'warning' : 'healthy'}
              threshold={{ warning: 50, critical: 100 }}
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Buffer Size"
              value={metrics.logger.bufferSize}
              description="Log buffer size"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />

            <MetricCard
              title="Uptime"
              value={formatDuration(metrics.logger.uptime)}
              description="Logger uptime"
              status="healthy"
              refreshable={!!onRefresh}
              onRefresh={onRefresh}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Alerts Summary */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          <MetricCard
            title="Active Alerts"
            value={metrics.alerts.length}
            description="Number of active system alerts"
            status={metrics.alerts.some(a => a.type === 'critical') ? 'critical' : 'warning'}
            refreshable={!!onRefresh}
            onRefresh={onRefresh}
            loading={loading}
          >
            <div className="space-y-2">
              {metrics.alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      alert.type === 'critical'
                        ? 'bg-red-500'
                        : alert.type === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  />
                  <span className="truncate">{alert.message}</span>
                  <span className="text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {metrics.alerts.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  ... and {metrics.alerts.length - 5} more
                </p>
              )}
            </div>
          </MetricCard>
        </div>
      )}
    </div>
  )
}
