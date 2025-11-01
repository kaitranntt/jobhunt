/**
 * Performance Monitor
 *
 * Comprehensive performance monitoring for the application
 * with metrics collection, analysis, and alerting.
 */

export interface PerformanceMetrics {
  database: DatabaseMetrics
  cache: CacheMetrics
  connections: ConnectionMetrics
  api: APIMetrics
  memory: MemoryMetrics
  timestamp: number
}

export interface PerformanceTrends {
  database: {
    queryTime: 'improving' | 'stable' | 'degrading'
    responseTime: number
    trend: number
  }
  cache: {
    hitRate: 'improving' | 'stable' | 'degrading'
    trend: number
  }
  api: {
    responseTime: 'improving' | 'stable' | 'degrading'
    errorRate: number
    trend: number
  }
  memory: {
    usage: 'increasing' | 'stable' | 'decreasing'
    trend: number
  }
}

export interface MiddlewareRequest {
  url?: string
  method?: string
  headers?: Record<string, string>
  [key: string]: unknown
}

export interface MiddlewareResponse {
  status?: number
  headers?: Record<string, string>
  statusCode?: number
  getHeader?: (name: string) => string | string[] | undefined
  on?: (event: string, callback: () => void) => void
  [key: string]: unknown
}

export type NextFunction = (err?: Error | unknown) => void

export interface DatabaseMetrics {
  queryCount: number
  averageQueryTime: number
  slowQueries: number
  connectionPoolUtilization: number
  activeConnections: number
  totalConnections: number
}

export interface CacheMetrics {
  hitRate: number
  missRate: number
  totalEntries: number
  memoryUsage: number
  evictions: number
  averageResponseTime: number
}

export interface ConnectionMetrics {
  poolSize: number
  activeConnections: number
  idleConnections: number
  connectionReuseRate: number
  averageConnectionTime: number
  connectionErrors: number
}

export interface APIMetrics {
  requestCount: number
  averageResponseTime: number
  errorRate: number
  slowRequests: number
  requestsPerSecond: number
}

export interface MemoryMetrics {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  usagePercentage: number
}

export interface PerformanceAlert {
  type: 'warning' | 'critical'
  category: 'database' | 'cache' | 'connections' | 'api' | 'memory'
  message: string
  value: number
  threshold: number
  timestamp: number
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, any> = new Map()
  private alerts: PerformanceAlert[] = []
  private thresholds: Record<string, number> = {
    // Database thresholds
    slowQueryTime: 1000, // 1 second
    maxConnectionPoolUtilization: 0.8, // 80%
    maxActiveConnections: 50,

    // Cache thresholds
    minCacheHitRate: 0.7, // 70%
    maxCacheMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxEvictionsPerMinute: 100,

    // API thresholds
    maxApiResponseTime: 2000, // 2 seconds
    maxErrorRate: 0.05, // 5%

    // Memory thresholds
    maxMemoryUsage: 500 * 1024 * 1024, // 500MB
    maxMemoryGrowthRate: 10 * 1024 * 1024, // 10MB per minute
  }

  private history: PerformanceMetrics[] = []
  private maxHistorySize = 1000
  public isMonitoring = false
  private monitoringInterval: ReturnType<typeof setInterval> | null = null
  private interval: ReturnType<typeof setInterval>

  private constructor() {
    this.interval = setInterval(() => {
      this.collectMetrics()
      this.checkThresholds()
      this.cleanupOldAlerts()
    }, 30000) // Collect metrics every 30 seconds
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = Date.now()

    const metrics: PerformanceMetrics = {
      database: await this.collectDatabaseMetrics(),
      cache: this.collectCacheMetrics(),
      connections: this.collectConnectionMetrics(),
      api: this.collectAPIMetrics(),
      memory: this.collectMemoryMetrics(),
      timestamp,
    }

    // Store in history
    this.history.push(metrics)
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }

    return metrics
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(minutes: number = 60): PerformanceMetrics[] {
    const cutoff = Date.now() - minutes * 60 * 1000
    return this.history.filter(m => m.timestamp > cutoff)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    const cutoff = Date.now() - 5 * 60 * 1000 // Last 5 minutes
    return this.alerts.filter(alert => alert.timestamp > cutoff)
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(): Promise<{
    current: PerformanceMetrics
    trends: PerformanceTrends
    alerts: PerformanceAlert[]
    recommendations: string[]
    health: 'healthy' | 'warning' | 'critical'
  }> {
    const current = await this.collectMetrics()
    const history = this.getMetricsHistory(60) // Last hour
    const alerts = this.getActiveAlerts()

    const trends = this.calculateTrends(history)
    const recommendations = this.generateRecommendations(current, trends)
    const health = this.calculateHealthStatus(current, alerts)

    return {
      current,
      trends,
      alerts,
      recommendations,
      health,
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const key = tags ? `${name}:${JSON.stringify(tags)}` : name
    this.metrics.set(key, {
      value,
      timestamp: Date.now(),
      tags: tags || {},
    })
  }

  /**
   * Measure execution time of an async function
   */
  async measure<T>(
    fn: () => Promise<T>,
    operationName?: string
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now()
    const result = await fn()
    const duration = Date.now() - start

    if (operationName) {
      this.recordMetric(operationName, duration)
    }

    return { result, duration }
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(queryTime: number, success: boolean): void {
    const key = success ? 'db_query_success' : 'db_query_error'
    const current = this.metrics.get(key) || { count: 0, totalTime: 0 }

    this.metrics.set(key, {
      count: current.count + 1,
      totalTime: current.totalTime + queryTime,
      averageTime: (current.totalTime + queryTime) / (current.count + 1),
    })

    if (queryTime > this.thresholds.slowQueryTime) {
      const slowQueries = this.metrics.get('slow_queries') || { count: 0 }
      this.metrics.set('slow_queries', { count: slowQueries.count + 1 })
    }
  }

  /**
   * Record API request
   */
  recordAPIRequest(responseTime: number, statusCode: number): void {
    const key = `api_request_${Math.floor(statusCode / 100)}xx`
    const current = this.metrics.get(key) || { count: 0, totalTime: 0 }

    this.metrics.set(key, {
      count: current.count + 1,
      totalTime: current.totalTime + responseTime,
      averageTime: (current.totalTime + responseTime) / (current.count + 1),
    })

    if (responseTime > this.thresholds.maxApiResponseTime) {
      const slowRequests = this.metrics.get('slow_requests') || { count: 0 }
      this.metrics.set('slow_requests', { count: slowRequests.count + 1 })
    }
  }

  /**
   * Destroy monitor
   */
  destroy(): void {
    if (this.interval) {
      clearInterval(this.interval)
    }
    this.metrics.clear()
    this.alerts = []
    this.history = []
  }

  // Private methods

  private async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    const queries = this.metrics.get('db_query_success') || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
    }
    const slowQueries = this.metrics.get('slow_queries') || { count: 0 }

    return {
      queryCount: queries.count,
      averageQueryTime: queries.averageTime || 0,
      slowQueries: slowQueries.count,
      connectionPoolUtilization: 0.5, // Would get from actual pool
      activeConnections: 5, // Would get from actual pool
      totalConnections: 10, // Would get from actual pool
    }
  }

  private collectCacheMetrics(): CacheMetrics {
    // Would get from actual cache implementation
    return {
      hitRate: 0.85,
      missRate: 0.15,
      totalEntries: 1000,
      memoryUsage: 50 * 1024 * 1024, // 50MB
      evictions: 10,
      averageResponseTime: 5, // 5ms
    }
  }

  private collectConnectionMetrics(): ConnectionMetrics {
    // Would get from actual connection pool
    return {
      poolSize: 10,
      activeConnections: 3,
      idleConnections: 7,
      connectionReuseRate: 0.8,
      averageConnectionTime: 50, // 50ms
      connectionErrors: 0,
    }
  }

  private collectAPIMetrics(): APIMetrics {
    const successRequests = this.metrics.get('api_request_2xx') || { count: 0, totalTime: 0 }
    const errorRequests = this.metrics.get('api_request_4xx') || { count: 0 }
    const serverErrors = this.metrics.get('api_request_5xx') || { count: 0 }
    const slowRequests = this.metrics.get('slow_requests') || { count: 0 }

    const totalRequests = successRequests.count + errorRequests.count + serverErrors.count
    const totalResponseTime =
      (successRequests.totalTime || 0) +
      (errorRequests.totalTime || 0) +
      (serverErrors.totalTime || 0)

    return {
      requestCount: totalRequests,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? (errorRequests.count + serverErrors.count) / totalRequests : 0,
      slowRequests: slowRequests.count,
      requestsPerSecond: totalRequests / 60, // Rough estimate
    }
  }

  private collectMemoryMetrics(): MemoryMetrics {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      const heapUsed = usage.heapUsed
      const heapTotal = usage.heapTotal

      return {
        heapUsed,
        heapTotal,
        external: usage.external,
        rss: usage.rss,
        usagePercentage: heapUsed / heapTotal,
      }
    }

    // Fallback for browser environment
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      usagePercentage: 0,
    }
  }

  private checkThresholds(): void {
    const current = this.getCurrentMetrics()
    if (!current) return

    // Check database metrics
    if (current.database.averageQueryTime > this.thresholds.slowQueryTime) {
      this.addAlert(
        'warning',
        'database',
        `Average query time (${current.database.averageQueryTime}ms) exceeds threshold`,
        current.database.averageQueryTime,
        this.thresholds.slowQueryTime
      )
    }

    // Check cache metrics
    if (current.cache.hitRate < this.thresholds.minCacheHitRate) {
      this.addAlert(
        'warning',
        'cache',
        `Cache hit rate (${(current.cache.hitRate * 100).toFixed(1)}%) below threshold`,
        current.cache.hitRate,
        this.thresholds.minCacheHitRate
      )
    }

    // Check API metrics
    if (current.api.errorRate > this.thresholds.maxErrorRate) {
      this.addAlert(
        'critical',
        'api',
        `API error rate (${(current.api.errorRate * 100).toFixed(1)}%) exceeds threshold`,
        current.api.errorRate,
        this.thresholds.maxErrorRate
      )
    }

    // Check memory metrics
    if (current.memory.usagePercentage > this.thresholds.maxMemoryUsage) {
      this.addAlert(
        'critical',
        'memory',
        `Memory usage (${(current.memory.usagePercentage * 100).toFixed(1)}%) exceeds threshold`,
        current.memory.usagePercentage,
        this.thresholds.maxMemoryUsage
      )
    }
  }

  private addAlert(
    type: 'warning' | 'critical',
    category: PerformanceAlert['category'],
    message: string,
    value: number,
    threshold: number
  ): void {
    this.alerts.push({
      type,
      category,
      message,
      value,
      threshold,
      timestamp: Date.now(),
    })

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - 10 * 60 * 1000 // 10 minutes
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff)
  }

  private calculateTrends(history: PerformanceMetrics[]): PerformanceTrends {
    if (history.length < 2) {
      return {
        database: { queryTime: 'stable', responseTime: 0, trend: 0 },
        cache: { hitRate: 'stable', trend: 0 },
        api: { responseTime: 'stable', errorRate: 0, trend: 0 },
        memory: { usage: 'stable', trend: 0 },
      }
    }

    const oldest = history[0]
    const newest = history[history.length - 1]

    return {
      database: {
        queryTime: this.calculateTrend(
          oldest.database.averageQueryTime,
          newest.database.averageQueryTime
        ),
        responseTime: newest.database.averageQueryTime,
        trend:
          (newest.database.averageQueryTime - oldest.database.averageQueryTime) /
          oldest.database.averageQueryTime,
      },
      cache: {
        hitRate: this.calculateTrend(oldest.cache.hitRate, newest.cache.hitRate),
        trend: (newest.cache.hitRate - oldest.cache.hitRate) / oldest.cache.hitRate,
      },
      api: {
        responseTime: this.calculateTrend(
          oldest.api.averageResponseTime,
          newest.api.averageResponseTime
        ),
        errorRate: newest.api.errorRate || 0,
        trend:
          (newest.api.averageResponseTime - oldest.api.averageResponseTime) /
          oldest.api.averageResponseTime,
      },
      memory: {
        usage:
          newest.memory.usagePercentage > oldest.memory.usagePercentage
            ? 'increasing'
            : newest.memory.usagePercentage < oldest.memory.usagePercentage
              ? 'decreasing'
              : 'stable',
        trend: (newest.memory.usagePercentage - oldest.memory.usagePercentage) / 100,
      },
    }
  }

  private calculateTrend(oldValue: number, newValue: number): 'improving' | 'stable' | 'degrading' {
    const change = (newValue - oldValue) / oldValue

    if (Math.abs(change) < 0.05) return 'stable'
    return change > 0 ? 'degrading' : 'improving'
  }

  private generateRecommendations(
    current: PerformanceMetrics,
    trends: PerformanceTrends
  ): string[] {
    const recommendations: string[] = []

    if (current.database.averageQueryTime > this.thresholds.slowQueryTime) {
      recommendations.push('Consider optimizing slow database queries or adding indexes')
    }

    if (current.cache.hitRate < this.thresholds.minCacheHitRate) {
      recommendations.push(
        'Review caching strategy - consider increasing TTL or caching more queries'
      )
    }

    if (current.api.errorRate > this.thresholds.maxErrorRate) {
      recommendations.push('Investigate API errors - check logs for common failure patterns')
    }

    if (current.memory.usagePercentage > this.thresholds.maxMemoryUsage) {
      recommendations.push('High memory usage detected - consider memory optimization or scaling')
    }

    if (trends.database.queryTime === 'degrading') {
      recommendations.push('Database query performance is degrading over time')
    }

    return recommendations
  }

  private calculateHealthStatus(
    current: PerformanceMetrics,
    alerts: PerformanceAlert[]
  ): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = alerts.filter(a => a.type === 'critical')
    const warningAlerts = alerts.filter(a => a.type === 'warning')

    if (criticalAlerts.length > 0) return 'critical'
    if (warningAlerts.length > 3) return 'warning'
    if (warningAlerts.length > 0) return 'warning'
    return 'healthy'
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): boolean {
    return this.isMonitoring
  }

  /**
   * Public getter for isMonitoring property (for testing)
   */
  get isMonitoringActive(): boolean {
    return this.isMonitoring
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('Performance monitoring is already active')
      return
    }

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, intervalMs)

    console.log('Performance monitoring started')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('Performance monitoring is not active')
      return
    }

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log('Performance monitoring stopped')
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

/**
 * Performance monitoring utilities
 */
export const PerformanceUtils = {
  /**
   * Measure execution time of async function
   */
  async measure<T>(
    fn: () => Promise<T>,
    metricName?: string
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now()
    const result = await fn()
    const duration = Date.now() - start

    if (metricName) {
      performanceMonitor.recordMetric(metricName, duration)
    }

    return { result, duration }
  },

  /**
   * Create performance monitoring middleware
   */
  createMonitoringMiddleware() {
    return async (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => {
      const start = Date.now()

      if (res.on) {
        res.on('finish', () => {
          const duration: number = Date.now() - start
          const statusCode = res.statusCode || res.status || 200
          performanceMonitor.recordAPIRequest(duration, statusCode)
        })
      }

      next()
    }
  },
}
