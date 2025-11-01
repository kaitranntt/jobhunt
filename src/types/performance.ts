/**
 * Performance Metrics Types
 *
 * Comprehensive type definitions for performance monitoring,
 * component metrics, rendering performance, and system resources.
 */

export interface PerformanceReport {
  timestamp: number
  metrics: {
    navigation: NavigationTiming
    resources: ResourceTiming[]
    paint: PaintTiming
    memory: MemoryInfo
    vitals: WebVitals
  }
  components: ComponentPerformance[]
  network: NetworkPerformance
  user: UserPerformance
  summary: PerformanceSummary
}

export interface NavigationTiming {
  // Navigation start and end times
  navigationStart: number
  navigationEnd: number
  unloadEventStart: number
  unloadEventEnd: number

  // Redirect timing
  redirectStart: number
  redirectEnd: number

  // DNS timing
  domainLookupStart: number
  domainLookupEnd: number

  // Connection timing
  connectStart: number
  connectEnd: number
  secureConnectionStart: number

  // Request timing
  requestStart: number
  responseStart: number
  responseEnd: number

  // DOM processing timing
  domLoading: number
  domInteractive: number
  domContentLoadedEventStart: number
  domContentLoadedEventEnd: number
  domComplete: number

  // Load event timing
  loadEventStart: number
  loadEventEnd: number

  // Calculated durations
  dnsLookup: number
  tcpConnect: number
  sslConnect: number
  timeToFirstByte: number
  domProcessing: number
  pageLoad: number
  totalLoadTime: number
}

export interface ResourceTiming {
  name: string
  startTime: number
  duration: number
  initiatorType: string
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  responseStart: number
  responseEnd: number

  // Phases
  redirect: number
  dns: number
  connect: number
  ssl: number
  request: number
  response: number

  // Performance indicators
  cached: boolean
  crossOrigin: boolean
  httpVersion: string
  status?: number
}

export interface PaintTiming {
  firstPaint: number
  firstContentfulPaint: number
  firstMeaningfulPaint?: number
  largestContentfulPaint?: number
}

export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  usedMemoryPercentage: number

  // Memory allocation tracking
  allocations: MemoryAllocation[]
  deallocations: MemoryDeallocation[]
  leaks: MemoryLeak[]
}

export interface MemoryAllocation {
  timestamp: number
  size: number
  type: string
  stack?: string
  component?: string
}

export interface MemoryDeallocation {
  timestamp: number
  size: number
  type: string
  age: number
}

export interface MemoryLeak {
  type: string
  size: number
  objects: string[]
  stack?: string
  detected: number
}

export interface WebVitals {
  // Core Web Vitals
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte

  // Additional metrics
  inp: number // Interaction to Next Paint
  tbt: number // Total Blocking Time
  si: number // Speed Index

  // Scoring
  lcpScore: 'good' | 'needs-improvement' | 'poor'
  fidScore: 'good' | 'needs-improvement' | 'poor'
  clsScore: 'good' | 'needs-improvement' | 'poor'
  overallScore: number
}

export interface ComponentPerformance {
  name: string
  renders: RenderMetrics[]
  current: RenderState
  summary: ComponentSummary
  props: ComponentPropsInfo
  state: ComponentStateInfo
  hooks: ComponentHooksInfo
}

export interface RenderMetrics {
  timestamp: number
  duration: number
  props: Record<string, unknown>
  state: Record<string, unknown>
  cause: RenderCause
  mount: boolean
  unmount: boolean
  update: boolean
  propsChanged: string[]
  stateChanged: string[]
}

export interface RenderCause {
  type: 'mount' | 'props' | 'state' | 'force' | 'context' | 'parent'
  details: string[]
  component?: string
}

export interface RenderState {
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  maxRenderTime: number
  minRenderTime: number
  isHealthy: boolean
  trend: 'improving' | 'stable' | 'degrading'
}

export interface ComponentSummary {
  totalRenders: number
  averageRenderTime: number
  maxRenderTime: number
  errorCount: number
  warningCount: number
  reRenderCount: number
  unnecessaryRenders: number
  performanceScore: number
}

export interface ComponentPropsInfo {
  count: number
  size: number
  complexity: number
  changeFrequency: number
  unstableProps: string[]
  largeProps: string[]
}

export interface ComponentStateInfo {
  count: number
  size: number
  complexity: number
  updateFrequency: number
  volatileState: string[]
  largeState: string[]
}

export interface ComponentHooksInfo {
  used: string[]
  performance: HookPerformance[]
  issues: HookIssue[]
}

export interface HookPerformance {
  name: string
  calls: number
  averageTime: number
  dependencies: string[]
  dependencyChanges: number
}

export interface HookIssue {
  hook: string
  type: 'missing-dependency' | 'extra-dependency' | 'stale-closure' | 'infinite-loop'
  severity: 'error' | 'warning' | 'info'
  description: string
}

export interface NetworkPerformance {
  requests: NetworkRequest[]
  summary: NetworkSummary
  issues: NetworkIssue[]
}

export interface NetworkRequest {
  url: string
  method: string
  status: number
  startTime: number
  endTime: number
  duration: number
  size: number
  type: string
  cached: boolean
  success: boolean
  error?: string
  retryCount: number
}

export interface NetworkSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  totalDataTransferred: number
  cacheHitRate: number
  errorsByType: Record<string, number>
}

export interface NetworkIssue {
  type: 'slow-request' | 'failed-request' | 'large-payload' | 'too-many-requests'
  url: string
  severity: 'error' | 'warning'
  description: string
  suggestion: string
}

export interface UserPerformance {
  interactions: UserInteraction[]
  metrics: UserMetrics
  frustration: FrustrationMetrics
}

export interface UserInteraction {
  type: string
  target: string
  timestamp: number
  duration: number
  success: boolean
  coordinates?: { x: number; y: number }
  element?: string
  context?: Record<string, unknown>
}

export interface UserMetrics {
  totalInteractions: number
  averageInteractionTime: number
  interactionRate: number
  conversionRate: number
  errorRate: number
  rageClicks: number
  deadClicks: number
}

export interface FrustrationMetrics {
  rageClicks: number
  deadClicks: number
  thrashClicks: number
  excessiveScrolling: number
  quickBacks: number
  formErrors: number
  frustrationScore: number
}

export interface PerformanceSummary {
  overall: OverallPerformance
  scores: PerformanceScores
  recommendations: Recommendation[]
  trends: PerformanceTrend[]
}

export interface OverallPerformance {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  issues: number
  recommendations: number
}

export interface PerformanceScores {
  speed: number
  stability: number
  responsiveness: number
  efficiency: number
  accessibility: number
  bestPractices: number
}

export interface Recommendation {
  type: 'critical' | 'warning' | 'info'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  priority: number
  action: string
  resources?: string[]
}

export interface PerformanceTrend {
  metric: string
  period: string
  data: TrendDataPoint[]
  direction: 'improving' | 'stable' | 'degrading'
  change: number
  significance: number
}

export interface TrendDataPoint {
  timestamp: number
  value: number
  baseline?: number
  target?: number
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enabled: boolean
  sampleRate: number
  thresholds: PerformanceThresholds
  reporting: ReportingConfig
  alerts: AlertConfig
}

export interface PerformanceThresholds {
  renderTime: number
  componentRenderTime: number
  apiResponseTime: number
  memoryUsage: number
  errorRate: number
  interactionTime: number
}

export interface ReportingConfig {
  endpoint?: string
  interval: number
  batchSize: number
  includeStackTrace: boolean
  includeSourceMap: boolean
}

export interface AlertConfig {
  enabled: boolean
  thresholds: AlertThresholds
  channels: AlertChannel[]
}

export interface AlertThresholds {
  critical: number
  warning: number
  info: number
}

export interface AlertChannel {
  type: 'console' | 'endpoint' | 'webhook'
  config: Record<string, unknown>
  enabled: boolean
}

// Performance events
export interface PerformanceEvent {
  type: string
  timestamp: number
  data: Record<string, unknown>
  component?: string
  severity: 'error' | 'warning' | 'info'
  tags?: string[]
}

export interface RenderEvent extends PerformanceEvent {
  type: 'render'
  data: {
    duration: number
    props: Record<string, unknown>
    state: Record<string, unknown>
    cause: string
  }
}

export interface ErrorEvent extends PerformanceEvent {
  type: 'error'
  data: {
    error: Error
    stack: string
    component: string
    props: Record<string, unknown>
  }
}

export interface InteractionEvent extends PerformanceEvent {
  type: 'interaction'
  data: {
    action: string
    target: string
    duration: number
    success: boolean
  }
}
