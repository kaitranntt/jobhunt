/**
 * Monitoring System Types
 *
 * Comprehensive type definitions for the monitoring system including
 * real-time metrics, performance data, alerts, and health indicators.
 */

export interface PerformanceMetrics {
  api: {
    averageResponseTime: number
    errorRate: number
    requestCount: number
    uptime: number
  }
  memory: {
    usagePercentage: number
    usedHeapSize: number
    totalHeapSize: number
    heapSizeLimit: number
  }
  cpu: {
    usagePercentage: number
  }
  database: {
    connectionCount: number
    averageQueryTime: number
    errorCount: number
  }
  alerts?: Alert[]
  health: {
    status: 'healthy' | 'warning' | 'critical'
    score: number
    issues: string[]
  }
  trends?: {
    responseTime: number[]
    errorRate: number[]
    throughput: number[]
  }
  recommendations?: string[]
}

export interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  acknowledged: boolean
  resolved: boolean
}

export interface CacheMetrics {
  hitRate: number
  missRate: number
  size: number
  maxSize: number
  evictions: number
  totalHits: number
  totalMisses: number
  memoryUsage: number
}

export interface ConnectionMetrics {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  maxConnections: number
  averageLifetime: number
  errors: number
  // Additional fields for compatibility with connection pool metrics
  poolSize?: number
  active?: number
  idle?: number
  total?: number
  connectionReuseRate?: number
  averageConnectionTime?: number
  connectionErrors?: number
}

export interface LogMetrics {
  stats: Record<string, unknown>
  recent: LogEntry[]
  levelCounts: {
    error: number
    warn: number
    info: number
    debug: number
  }
}

export interface LogEntry {
  timestamp: number
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  category?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  // Additional fields for compatibility with logger.LogEntry
  id?: string
  context?: Record<string, unknown>
  userId?: string
  sessionId?: string
  requestId?: string
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
  component?: string
  action?: string
  metrics?: Record<string, number>
}

export interface RealTimeMetrics {
  performance: PerformanceMetrics | null
  cache: CacheMetrics | null
  connections: ConnectionMetrics | null
  logs: LogMetrics | null
  system: SystemMetrics | null
  alerts?: Alert[]
  timestamp: number
}

export interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    loadAverage: number[]
  }
  memory: {
    total: number
    used: number
    free: number
    usage: number
  }
  disk: {
    total: number
    used: number
    free: number
    usage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
  }
  uptime: number
  loadTime: number
}

export interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical'
  score: number
  checks: {
    database: HealthCheckResult
    cache: HealthCheckResult
    api: HealthCheckResult
    memory: HealthCheckResult
    disk: HealthCheckResult
  }
  timestamp: number
}

export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn'
  responseTime: number
  message: string
  details?: Record<string, unknown>
}

export interface MonitoringConfig {
  refreshInterval: number
  alertThresholds: {
    responseTime: number
    errorRate: number
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }
  retention: {
    metrics: number // days
    logs: number // days
    alerts: number // days
  }
  notifications: {
    email: boolean
    slack: boolean
    webhook?: string
  }
}

export interface MetricChart {
  id: string
  name: string
  data: ChartDataPoint[]
  color: string
  unit: string
  type: 'line' | 'bar' | 'area'
  aggregation?: 'sum' | 'average' | 'min' | 'max'
}

export interface ChartDataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface MonitoringDashboard {
  metrics: RealTimeMetrics
  charts: MetricChart[]
  alerts: Alert[]
  health: HealthCheck
  config: MonitoringConfig
}

export interface PerformanceReport {
  timestamp: number
  period: string
  summary: {
    averageResponseTime: number
    totalRequests: number
    errorRate: number
    uptime: number
  }
  breakdown: {
    endpoints: EndpointPerformance[]
    errors: ErrorBreakdown[]
    trends: TrendData[]
  }
  recommendations: string[]
}

export interface EndpointPerformance {
  path: string
  method: string
  requestCount: number
  averageResponseTime: number
  errorRate: number
  statusCodes: Record<number, number>
}

export interface ErrorBreakdown {
  type: string
  count: number
  percentage: number
  examples: string[]
}

export interface TrendData {
  metric: string
  period: string
  data: ChartDataPoint[]
  trend: 'up' | 'down' | 'stable'
  change: number
}

// Performance Monitor Test Types
export interface TestPerformanceThresholds {
  maxQueryTime: number
  minCacheHitRate: number
  maxConnectionPoolUsage: number
  maxMemoryGrowth: number
}

export interface TestPerformanceMetrics {
  queryTime: number
  cacheHitRate: number
  connectionPoolUsage: number
  memoryUsage: number
  timestamp: number
}

export interface TestPerformanceAlert {
  type:
    | 'query_time'
    | 'cache_hit_rate'
    | 'connection_pool'
    | 'memory_usage'
    | 'memory'
    | 'error_rate'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  value: number
  threshold: number
  timestamp: number
  actual?: number // Add actual property for compatibility
}

export interface GlobalPerformanceUtils {
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<{ result: T; duration: number }>
  measureSync: <T>(name: string, fn: () => T) => { result: T; duration: number }
  getPerformanceReport: () => TestPerformanceReport
  assertPerformanceThresholds: () => boolean
  assertPerformanceThreshold: (name: string, maxDuration: number) => boolean
  takeMemorySnapshot: () => { memory: number; timestamp: number }
  assertMemoryThreshold: (threshold: number) => boolean
  [key: string]: unknown
}

export interface TestPerformanceReport {
  summary: {
    totalMetrics: number
    totalAlerts: number
    monitoringDuration: number
    averageQueryTime: number
    averageCacheHitRate: number
    averageConnectionPoolUsage: number
    memoryGrowth: number
  }
  metrics: TestPerformanceMetrics[]
  alerts: TestPerformanceAlert[]
  thresholds: TestPerformanceThresholds
  integrationTest?: {
    status: string
    duration: number
  }
}

// Health Check Test Types
export interface HealthCheckDetails {
  type: string
  [key: string]: unknown
}

export interface HealthCheckStatus {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  lastCheck: number
  responseTime: number
  details?: HealthCheckDetails
  error?: string
}

export interface HealthCheckMetrics {
  totalChecks: number
  healthyChecks: number
  degradedChecks: number
  unhealthyChecks: number
  averageResponseTime: number
  uptime: number
}

export interface HealthCheckConfig {
  interval: number
  timeout: number
  retries: number
  alertThreshold: number
}

export interface HealthCheckAlert {
  service: string
  status: string
  error?: string
  timestamp: number
  consecutiveFailures: number
}

// Mock Logger Types
export interface MockLogMetadata {
  [key: string]: unknown
}

export interface MockLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
  metadata?: MockLogMetadata
}

export interface MockLoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableConsole: boolean
  enableFile: boolean
  maxLogSize: number
  logRetention: number
}

export interface MockConsoleOutput {
  level: string
  message: string
  metadata?: MockLogMetadata
}

export interface AggregatedLogData {
  count: number
  firstSeen: number
  lastSeen: number
  samples: unknown[]
  metadata: {
    level: string
    message: string
  }
}

export interface LogPattern {
  name: string
  pattern: RegExp
  action: (match: RegExpMatchArray, log: unknown) => void
}

export interface LogAlert {
  type: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  data: unknown
}

// Mock Health Endpoints Types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: HealthCheckStatus[]
}

export interface ReadinessCheckResponse {
  ready: boolean
  checks: string[]
  timestamp: string
}

export interface LivenessCheckResponse {
  alive: boolean
  timestamp: string
}

export interface DetailedHealthReport {
  summary: {
    overall: string
    totalChecks: number
    healthyChecks: number
    degradedChecks: number
    unhealthyChecks: number
  }
  checks: HealthCheckStatus[]
  metrics: HealthCheckMetrics
  alerts: HealthCheckAlert[]
  timestamp: string
}

// Additional types needed for monitoring
export interface CorePerformanceMetrics {
  renderCount: number
  renderTime: number
  lastRenderTime: number
  averageRenderTime: number
  interactionCount: number
  errorCount: number
  mountTime: number
  isHealthy: boolean
}

export interface PerformanceTrends {
  renderTime: number[]
  errorRate: number[]
  interactionCount: number[]
}

export interface PerformanceAlert {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  value: number
  threshold: number
  timestamp: number
}

// Performance Monitor Hook Types
export interface ExtendedRealTimeMetrics {
  performance?: CorePerformanceMetrics | null
  cache: {
    totalEntries?: number
    expiredEntries?: number
    activeEntries?: number
    hitRate?: number
    memoryUsage?: number
    evictions?: number
    stats?: Record<string, unknown>
  } | null
  connections?: Record<string, ConnectionMetrics> | ConnectionMetrics | null
  logs: {
    stats?: Record<string, unknown>
    recent?: LogEntry[]
  } | null
  system?: {
    uptime: number
    platform: string
    arch: string
    nodeVersion: string
    pid: number
    memory: SystemMemoryMetrics
    cpu: SystemCpuMetrics
    environment: string
  } | null
  timestamp: number
  alerts?: PerformanceAlert[]
  logger?: unknown
}

export interface SystemMemoryMetrics {
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  arrayBuffers: number
}

export interface SystemCpuMetrics {
  user: number
  system: number
}

// Performance Measurement Types
export interface AsyncPerformanceMeasurement<T> {
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  results: T[]
}

export interface SyncPerformanceMeasurement<T> {
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  results: T[]
}

// Performance Monitor Types
export interface PerformanceMonitorInstance {
  isMonitoring: boolean
  measureQueryTime: () => number
  getCacheHitRate: () => number
  getConnectionPoolUsage: () => number
  getMemoryUsage: () => number
  addAlert: (alert: TestPerformanceAlert) => void
  getReport: () => TestPerformanceReport
  getMetrics: () => TestPerformanceMetrics[]
  getAlerts: () => TestPerformanceAlert[]
  startMonitoring: (intervalMs: number) => void
  stopMonitoring: () => void
  reset: () => void
}

export interface ConnectionPoolMetrics {
  totalConnections: number
  activeConnections: number
  pooledConnections: number
  connectionReuses: number
  connectionCreations: number
  averageResponseTime: number
}

export interface LogStats {
  stats: Record<string, unknown>
  recent: LogEntry[]
}
