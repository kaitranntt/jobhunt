export interface PerformanceMetrics {
  queryTime: number
  cacheHitRate: number
  connectionPoolUsage: number
  memoryUsage: number
  timestamp: number
}

export interface PerformanceThresholds {
  maxQueryTime: number
  minCacheHitRate: number
  maxConnectionPoolUsage: number
  maxMemoryGrowth: number
}

export interface PerformanceAlert {
  type: 'query_time' | 'memory_usage' | 'connection_pool' | 'cache_hit_rate' | 'error_rate'
  message: string
  threshold: number
  actual: number
  timestamp: number
  // Add value property for compatibility with TestPerformanceAlert
  value: number
  // Add severity property for compatibility with TestPerformanceAlert
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private thresholds: PerformanceThresholds
  private alerts: PerformanceAlert[] = []
  public isMonitoring = false
  private monitoringInterval: ReturnType<typeof setTimeout> | null = null
  private startTime = 0
  private memoryBaseline = 0

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      maxQueryTime: 1000, // 1 second
      minCacheHitRate: 80, // 80%
      maxConnectionPoolUsage: 80, // 80%
      maxMemoryGrowth: 100 * 1024 * 1024, // 100MB
      ...thresholds,
    }
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      // Don't warn in test environments - this might happen in test setups
      if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
        console.warn('Performance monitoring is already active')
      }
      return
    }

    // Only log in non-test environments
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
      console.log('📊 Starting performance monitoring...')
    }
    this.isMonitoring = true
    this.startTime = Date.now()
    this.memoryBaseline = this.getMemoryUsage()

    this.monitoringInterval = setInterval(() => {
      try {
        this.collectMetrics()
        this.checkThresholds()
      } catch (error) {
        // Still log errors in tests for debugging, but make it clear it's expected
        if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
          console.warn('Performance monitoring interval error:', error)
        } else {
          console.warn('Performance monitoring interval error (expected in tests):', error)
        }
      }
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      // Don't warn in test environments - this is normal behavior in cleanup
      if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
        console.warn('Performance monitoring is not active')
      }
      return
    }

    // Only log in non-test environments
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
      console.log('⏹️ Stopping performance monitoring...')
    }
    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  collectMetrics(): void {
    try {
      const metrics: PerformanceMetrics = {
        queryTime: this.measureQueryTime(),
        cacheHitRate: this.getCacheHitRate(),
        connectionPoolUsage: this.getConnectionPoolUsage(),
        memoryUsage: this.getMemoryUsage(),
        timestamp: Date.now(),
      }

      this.metrics.push(metrics)

      // Keep only last 1000 metrics to prevent memory issues
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }
    } catch (error) {
      // Only log collection errors in non-test environments or if they're unexpected
      if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
        console.warn('Failed to collect performance metrics:', error)
      }
    }
  }

  checkThresholds(): void {
    try {
      if (this.metrics.length === 0) return

      const latestMetrics = this.metrics[this.metrics.length - 1]

      // Check query time
      if (latestMetrics.queryTime > this.thresholds.maxQueryTime) {
        this.addAlert({
          type: 'query_time',
          message: `Query time exceeded threshold: ${latestMetrics.queryTime}ms > ${this.thresholds.maxQueryTime}ms`,
          threshold: this.thresholds.maxQueryTime,
          actual: latestMetrics.queryTime,
          value: latestMetrics.queryTime,
          severity:
            latestMetrics.queryTime > this.thresholds.maxQueryTime * 2 ? 'critical' : 'high',
          timestamp: latestMetrics.timestamp,
        })
      }

      // Check cache hit rate
      if (latestMetrics.cacheHitRate < this.thresholds.minCacheHitRate) {
        this.addAlert({
          type: 'cache_hit_rate',
          message: `Cache hit rate below threshold: ${latestMetrics.cacheHitRate}% < ${this.thresholds.minCacheHitRate}%`,
          threshold: this.thresholds.minCacheHitRate,
          actual: latestMetrics.cacheHitRate,
          value: latestMetrics.cacheHitRate,
          severity:
            latestMetrics.cacheHitRate < this.thresholds.minCacheHitRate / 2
              ? 'critical'
              : 'medium',
          timestamp: latestMetrics.timestamp,
        })
      }

      // Check connection pool usage
      if (latestMetrics.connectionPoolUsage > this.thresholds.maxConnectionPoolUsage) {
        this.addAlert({
          type: 'connection_pool',
          message: `Connection pool usage high: ${latestMetrics.connectionPoolUsage}% > ${this.thresholds.maxConnectionPoolUsage}%`,
          threshold: this.thresholds.maxConnectionPoolUsage,
          actual: latestMetrics.connectionPoolUsage,
          value: latestMetrics.connectionPoolUsage,
          severity:
            latestMetrics.connectionPoolUsage > this.thresholds.maxConnectionPoolUsage * 1.5
              ? 'critical'
              : 'high',
          timestamp: latestMetrics.timestamp,
        })
      }

      // Check memory growth
      const memoryGrowth = latestMetrics.memoryUsage - this.memoryBaseline
      if (memoryGrowth > this.thresholds.maxMemoryGrowth) {
        this.addAlert({
          type: 'memory_usage',
          message: `Memory growth high: ${this.formatBytes(memoryGrowth)} > ${this.formatBytes(this.thresholds.maxMemoryGrowth)}`,
          threshold: this.thresholds.maxMemoryGrowth,
          actual: memoryGrowth,
          value: memoryGrowth,
          severity: memoryGrowth > this.thresholds.maxMemoryGrowth * 2 ? 'critical' : 'high',
          timestamp: latestMetrics.timestamp,
        })
      }
    } catch (error) {
      // Only log threshold errors in non-test environments or if they're unexpected
      if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
        console.warn('Failed to check performance thresholds:', error)
      }
    }
  }

  addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert)

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Only log alerts in non-test environments
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test') {
      console.log(`⚠️ ${alert.message}`)
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  getReport(): {
    summary: {
      totalMetrics: number
      totalAlerts: number
      monitoringDuration: number
      averageQueryTime: number
      averageCacheHitRate: number
      averageConnectionPoolUsage: number
      memoryGrowth: number
    }
    metrics: PerformanceMetrics[]
    alerts: PerformanceAlert[]
    thresholds: PerformanceThresholds
  } {
    if (this.metrics.length === 0) {
      return {
        summary: {
          totalMetrics: 0,
          totalAlerts: this.alerts.length,
          monitoringDuration: 0,
          averageQueryTime: 0,
          averageCacheHitRate: 0,
          averageConnectionPoolUsage: 0,
          memoryGrowth: 0,
        },
        metrics: [],
        alerts: this.alerts,
        thresholds: this.thresholds,
      }
    }

    const queryTimes = this.metrics.map(m => m.queryTime)
    const cacheHitRates = this.metrics.map(m => m.cacheHitRate)
    const connectionPoolUsages = this.metrics.map(m => m.connectionPoolUsage)
    const totalMetrics = this.metrics.length
    const totalAlerts = this.alerts.length
    const monitoringDuration = this.startTime > 0 ? Date.now() - this.startTime : 0
    const averageQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / totalMetrics
    const averageCacheHitRate = cacheHitRates.reduce((sum, rate) => sum + rate, 0) / totalMetrics
    const averageConnectionPoolUsage =
      connectionPoolUsages.reduce((sum, usage) => sum + usage, 0) / totalMetrics
    const memoryGrowth =
      this.metrics.length > 0 && this.memoryBaseline > 0
        ? this.metrics[this.metrics.length - 1].memoryUsage - this.memoryBaseline
        : 0

    return {
      summary: {
        totalMetrics,
        totalAlerts,
        monitoringDuration,
        averageQueryTime,
        averageCacheHitRate,
        averageConnectionPoolUsage,
        memoryGrowth,
      },
      metrics: this.metrics,
      alerts: this.alerts,
      thresholds: this.thresholds,
    }
  }

  reset(): void {
    this.stopMonitoring()
    this.metrics = []
    this.alerts = []
    this.startTime = 0
    this.memoryBaseline = 0
  }

  cleanup(): void {
    this.stopMonitoring()
    this.metrics = []
    this.alerts = []
    this.startTime = 0
    this.memoryBaseline = 0
  }

  // Add methods to match PerformanceMonitorInstance interface
  measureQueryTime(): number {
    // Simulate measuring database query time
    // In real implementation, this would hook into actual database queries
    return Math.random() * 500 + 50 // 50-550ms
  }

  getCacheHitRate(): number {
    // Simulate cache hit rate measurement
    // In real implementation, this would query actual cache metrics
    return Math.random() * 40 + 60 // 60-100%
  }

  getConnectionPoolUsage(): number {
    // Simulate connection pool usage
    // In real implementation, this would query actual pool metrics
    return Math.random() * 30 + 10 // 10-40%
  }

  getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return Math.random() * 50 * 1024 * 1024 // Random memory usage
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }
}

export function createPerformanceMonitor(
  thresholds?: Partial<PerformanceThresholds>
): PerformanceMonitor {
  return new PerformanceMonitor(thresholds)
}

// Performance testing utilities
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  iterations: number = 1
): Promise<{
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  results: T[]
}> {
  const results: T[] = []
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()

    results.push(result)
    times.push(end - start)
  }

  return {
    name,
    iterations,
    totalTime: times.reduce((sum, time) => sum + time, 0),
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    results,
  }
}

export function measureSyncPerformance<T>(
  name: string,
  fn: () => T,
  iterations: number = 1
): {
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  results: T[]
} {
  const results: T[] = []
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    const result = fn()
    const end = performance.now()

    results.push(result)
    times.push(end - start)
  }

  return {
    name,
    iterations,
    totalTime: times.reduce((sum, time) => sum + time, 0),
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    results,
  }
}

// Performance test suite for global performance testing
export interface PerformanceMeasurement {
  start: number
  end?: number
}

export interface PerformanceReport {
  [name: string]: {
    duration: number
    start: number
    end: number
  }
}

export function createPerformanceTestSuite(): {
  startMeasurement: (name: string) => void
  endMeasurement: (name: string) => void
  getReport: () => PerformanceReport
  reset: () => void
  cleanup: () => void
} {
  const measurements = new Map<string, PerformanceMeasurement>()

  return {
    startMeasurement(name: string) {
      measurements.set(name, { start: performance.now() })
    },

    endMeasurement(name: string) {
      const measurement = measurements.get(name)
      if (measurement && !measurement.end) {
        measurement.end = performance.now()
      }
    },

    getReport(): PerformanceReport {
      const report: PerformanceReport = {}
      for (const [name, measurement] of Array.from(measurements)) {
        if (measurement.end) {
          report[name] = {
            duration: measurement.end - measurement.start,
            start: measurement.start,
            end: measurement.end,
          }
        }
      }
      return report
    },

    reset() {
      measurements.clear()
    },

    cleanup() {
      measurements.clear()
    },
  }
}
