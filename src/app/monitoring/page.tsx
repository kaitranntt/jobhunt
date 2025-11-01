/**
 * Monitoring Dashboard Page
 *
 * Comprehensive monitoring dashboard with real-time metrics,
 * performance charts, and system health indicators.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { MetricsGrid } from '@/components/monitoring/MetricsGrid'
import { RealTimeChart, ChartSeries } from '@/components/monitoring/RealTimeChart'
import { useRealTimeMetrics } from '@/lib/monitoring/hooks'
import { logger } from '@/lib/monitoring/logger'
import type { LogEntry } from '@/types/monitoring'
import { PerformanceAlert } from '@/lib/performance/monitor'
import {
  Activity,
  Database,
  Cpu,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
} from 'lucide-react'

export default function MonitoringDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, _setRefreshInterval] = useState(5000)
  const [selectedTimeRange, _setSelectedTimeRange] = useState(60)
  const { metrics, refresh } = useRealTimeMetrics(refreshInterval)

  const [chartData, setChartData] = useState<ChartSeries[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])

  // Initialize chart data
  useEffect(() => {
    const series: ChartSeries[] = [
      {
        id: 'response-time',
        name: 'Response Time',
        data: [],
        color: '#3b82f6',
        unit: 'ms',
        type: 'line',
      },
      {
        id: 'error-rate',
        name: 'Error Rate',
        data: [],
        color: '#ef4444',
        unit: '%',
        type: 'line',
      },
      {
        id: 'cache-hit-rate',
        name: 'Cache Hit Rate',
        data: [],
        color: '#10b981',
        unit: '%',
        type: 'area',
      },
      {
        id: 'memory-usage',
        name: 'Memory Usage',
        data: [],
        color: '#f59e0b',
        unit: '%',
        type: 'area',
      },
    ]

    setChartData(series)
  }, [])

  // Update chart data when metrics change
  useEffect(() => {
    if (!metrics.performance) return

    const timestamp = Date.now()

    setChartData(prev =>
      prev.map(series => {
        let value = 0

        switch (series.id) {
          case 'response-time':
            value = metrics.performance?.api.averageResponseTime || 0
            break
          case 'error-rate':
            value = (metrics.performance?.api.errorRate || 0) * 100
            break
          case 'cache-hit-rate':
            value = (metrics.cache?.hitRate || 0) * 100
            break
          case 'memory-usage':
            value = (metrics.performance?.memory.usagePercentage || 0) * 100
            break
        }

        const newData = [...series.data, { timestamp, value }]
        // Keep only last 100 data points
        return {
          ...series,
          data: newData.slice(-100),
        }
      })
    )
  }, [metrics])

  // Update alerts
  useEffect(() => {
    if (metrics.alerts) {
      setAlerts(metrics.alerts)
    }
  }, [metrics.alerts])

  const handleRefresh = async () => {
    await refresh()
    logger.userAction('dashboard_refresh', { timeRange: selectedTimeRange })
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/metrics?format=${format}&timeRange=${selectedTimeRange}`)
      const data = await response.json()

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `metrics-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `metrics-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }

      logger.userAction('metrics_export', { format, timeRange: selectedTimeRange })
    } catch (error) {
      logger.error(
        'Failed to export metrics',
        error instanceof Error ? error : new Error('Unknown error')
      )
    }
  }

  const getOverallHealth = () => {
    const alertCount = alerts.length

    if (alertCount > 5) return 'critical'
    if (alertCount > 0) return 'warning'
    return 'healthy'
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const overallHealth = getOverallHealth()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time performance and health monitoring</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Auto Refresh</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>

          <Button variant="outline" onClick={handleRefresh} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Health Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getHealthIcon(overallHealth)}
                <div className={`h-3 w-3 rounded-full ${getHealthColor(overallHealth)}`} />
                <span className="font-semibold capitalize">{overallHealth}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(metrics.timestamp).toLocaleString()}
              </div>

              {alerts.length > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{alerts.length} Active Alerts</span>
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Database className="h-4 w-4" />
                <span>
                  DB: {metrics.performance?.database?.averageQueryTime?.toFixed(1) || 0}ms
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Cpu className="h-4 w-4" />
                <span>
                  CPU:{' '}
                  {metrics.performance?.memory?.usagePercentage
                    ? (metrics.performance.memory.usagePercentage * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Wifi className="h-4 w-4" />
                <span>API: {metrics.performance?.api?.averageResponseTime?.toFixed(1) || 0}ms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <MetricsGrid
            metrics={{
              performance: metrics.performance || undefined,
              cache: metrics.cache
                ? {
                    totalEntries: metrics.cache.totalEntries || 0,
                    expiredEntries: metrics.cache.expiredEntries || 0,
                    activeEntries: metrics.cache.activeEntries || 0,
                    hitRate: metrics.cache.hitRate,
                    memoryUsage: metrics.cache.memoryUsage,
                    evictions: metrics.cache.evictions,
                  }
                : undefined,
              connections: undefined, // Skip connections for now to avoid type conflicts
              alerts:
                metrics.alerts?.map(alert => ({
                  type: alert.type === 'warning' ? ('warning' as const) : ('critical' as const),
                  message: alert.message || 'Unknown alert',
                  timestamp: alert.timestamp,
                })) || [],
            }}
            loading={!metrics.performance}
            onRefresh={handleRefresh}
          />

          {/* Real-time Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RealTimeChart
              title="API Response Time"
              series={chartData.filter(s => s.id === 'response-time')}
              timeRange={selectedTimeRange}
              refreshInterval={refreshInterval}
              height={250}
              autoRefresh={autoRefresh}
            />

            <RealTimeChart
              title="Memory Usage"
              series={chartData.filter(s => s.id === 'memory-usage')}
              timeRange={selectedTimeRange}
              refreshInterval={refreshInterval}
              height={250}
              autoRefresh={autoRefresh}
            />

            <RealTimeChart
              title="Cache Hit Rate"
              series={chartData.filter(s => s.id === 'cache-hit-rate')}
              timeRange={selectedTimeRange}
              refreshInterval={refreshInterval}
              height={250}
              autoRefresh={autoRefresh}
            />

            <RealTimeChart
              title="Error Rate"
              series={chartData.filter(s => s.id === 'error-rate')}
              timeRange={selectedTimeRange}
              refreshInterval={refreshInterval}
              height={250}
              autoRefresh={autoRefresh}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Alerts</span>
                    <Badge variant={alerts.length > 0 ? 'destructive' : 'default'}>
                      {alerts.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>System Health</span>
                    <Badge variant={getOverallHealth() === 'healthy' ? 'default' : 'destructive'}>
                      {getOverallHealth()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Database Status</span>
                    <Badge variant={metrics.performance?.database ? 'default' : 'destructive'}>
                      {metrics.performance?.database ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Status</span>
                    <Badge variant={metrics.cache ? 'default' : 'destructive'}>
                      {metrics.cache ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>API Status</span>
                    <Badge variant={metrics.performance?.api ? 'default' : 'destructive'}>
                      {metrics.performance?.api ? 'Running' : 'Down'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <RealTimeChart
            title="Performance Overview"
            series={chartData}
            timeRange={selectedTimeRange}
            refreshInterval={refreshInterval}
            height={400}
            autoRefresh={autoRefresh}
            showLegend={true}
          />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <MetricsGrid
            metrics={{
              performance: metrics.performance || undefined,
            }}
            loading={!metrics.performance}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <MetricsGrid
            metrics={{
              cache: metrics.cache
                ? {
                    totalEntries: metrics.cache.totalEntries || 0,
                    expiredEntries: metrics.cache.expiredEntries || 0,
                    activeEntries: metrics.cache.activeEntries || 0,
                    hitRate: metrics.cache.hitRate,
                    memoryUsage: metrics.cache.memoryUsage,
                    evictions: metrics.cache.evictions,
                  }
                : undefined,
            }}
            loading={!metrics.cache}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.logs?.recent && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {metrics.logs.recent.slice(0, 50).map((log: LogEntry, index: number) => (
                    <div
                      key={log.id || index}
                      className="flex items-start space-x-2 text-sm p-2 border rounded"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1 ${
                          log.level === 'error'
                            ? 'bg-red-500'
                            : log.level === 'warn'
                              ? 'bg-yellow-500'
                              : log.level === 'info'
                                ? 'bg-blue-500'
                                : 'bg-gray-500'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.message}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.component || 'system'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
