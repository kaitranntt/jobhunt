/**
 * React Monitoring Hooks
 *
 * React hooks for real-time performance tracking,
 * component lifecycle monitoring, and user interaction tracking.
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { log } from './logger'
import {
  performanceMonitor,
  ConnectionMetrics,
  PerformanceTrends,
  PerformanceAlert,
  PerformanceMetrics as CorePerformanceMetrics,
} from '@/lib/performance/monitor'
import { cache } from '@/lib/cache/cache-manager'
import { connectionPool } from '@/lib/performance/connection-pool'
import type { LogEntry } from '@/types/monitoring'
import type {
  PerformanceMetrics as _CorePerformanceMetrics,
  LogStats,
  ConnectionPoolMetrics,
} from '@/types/monitoring'

export interface UsePerformanceMonitorOptions {
  componentName: string
  trackMount?: boolean
  trackUnmount?: boolean
  trackRenders?: boolean
  trackInteractions?: boolean
  threshold?: number // Warn if render time exceeds threshold (ms)
  logProps?: boolean
  customTags?: string[]
}

export interface UseUserInteractionOptions {
  component?: string
  logProperties?: string[]
  debounceMs?: number
  customTags?: string[]
}

export interface UseAsyncOperationOptions {
  name: string
  logParams?: boolean
  logResult?: boolean
  retryAttempts?: number
  timeout?: number
  customTags?: string[]
}

export interface ComponentPerformanceMetrics {
  renderCount: number
  renderTime: number
  lastRenderTime: number
  averageRenderTime: number
  interactionCount: number
  errorCount: number
  mountTime: number
  isHealthy: boolean
}

// Additional type definitions for monitoring hooks
export interface ComponentProps {
  [key: string]: unknown
}

export interface InteractionProperties {
  [key: string]: unknown
}

export interface ErrorContext {
  [key: string]: unknown
}

export interface InteractionData {
  action: string
  component?: string
  timestamp: number
  [key: string]: unknown
}

export interface AsyncOperationContext {
  operationName: string
  executionId: string
  attempt: number
  startTime: number
  category: string
  params?: unknown
}

export interface AsyncOperationLogData extends AsyncOperationContext {
  duration: number
  success: boolean
  attempt: number
  result?: unknown
}

// Extended interface for performance report from performance monitor
export interface PerformanceReport {
  current: ComponentPerformanceMetrics
  trends: PerformanceTrends
  alerts: PerformanceAlert[]
  recommendations: string[]
  health: 'healthy' | 'warning' | 'critical'
}

export interface RealTimeMetrics {
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

export interface ViewportMetrics {
  width: number
  height: number
  devicePixelRatio: number
  scrollY: number
  scrollX: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export interface BrowserPerformanceMetrics {
  memoryUsage: number
  memoryLimit: number
  jsHeapSizeLimit: number
  totalJSHeapSize: number
  usedJSHeapSize: number
}

export interface BrowserMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
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

// Generic array type for async operations
export type AsyncOperationArgs = readonly unknown[]

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions) {
  const {
    componentName,
    trackMount = true,
    trackUnmount = true,
    trackRenders = true,
    trackInteractions = true,
    threshold = 16, // 60fps = 16.67ms per frame
    logProps = false,
    customTags = [],
  } = options

  const [metrics, setMetrics] = useState<ComponentPerformanceMetrics>({
    renderCount: 0,
    renderTime: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    interactionCount: 0,
    errorCount: 0,
    mountTime: Date.now(),
    isHealthy: true,
  })

  const renderCountRef = useRef(0)
  const renderTimesRef = useRef<number[]>([])
  const interactionCountRef = useRef(0)
  const errorCountRef = useRef(0)
  const mountTimeRef = useRef(Date.now())
  const propsRef = useRef<ComponentProps | null>(null)

  // Track component mount
  useEffect(() => {
    if (trackMount) {
      const mountTime = Date.now()
      mountTimeRef.current = mountTime

      log.info(
        `Component ${componentName} mounted`,
        {
          componentName,
          mountTime,
          category: 'component-lifecycle',
        },
        ['component', 'mount', ...customTags]
      )

      performanceMonitor.recordMetric(`component_${componentName}_mount`, 0, {
        category: 'component-lifecycle',
        event: 'mount',
      })

      setMetrics(prev => ({ ...prev, mountTime }))
    }

    return () => {
      if (trackUnmount) {
        const unmountTime = Date.now()
        const lifetime = unmountTime - mountTimeRef.current

        log.info(
          `Component ${componentName} unmounted`,
          {
            componentName,
            unmountTime,
            lifetime,
            renderCount: renderCountRef.current,
            averageRenderTime: metrics.averageRenderTime,
            category: 'component-lifecycle',
          },
          ['component', 'unmount', ...customTags]
        )

        performanceMonitor.recordMetric(`component_${componentName}_lifetime`, lifetime, {
          category: 'component-lifecycle',
          event: 'unmount',
          renderCount: String(renderCountRef.current),
        })
      }
    }
  }, [componentName, trackMount, trackUnmount, metrics.averageRenderTime, customTags])

  // Track renders
  const renderTracker = useCallback(
    (props?: ComponentProps) => {
      if (!trackRenders) return

      const renderStart = performance.now()

      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart
        renderCountRef.current++
        renderTimesRef.current.push(renderTime)

        // Keep only last 10 render times for average
        if (renderTimesRef.current.length > 10) {
          renderTimesRef.current.shift()
        }

        const averageRenderTime =
          renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
        const isHealthy = renderTime < threshold && averageRenderTime < threshold

        // Update state
        setMetrics(prev => ({
          ...prev,
          renderCount: renderCountRef.current,
          renderTime,
          lastRenderTime: renderTime,
          averageRenderTime,
          isHealthy,
        }))

        // Log slow renders
        if (renderTime > threshold) {
          log.warn(
            `Component ${componentName} slow render`,
            {
              componentName,
              renderTime,
              threshold,
              renderCount: renderCountRef.current,
              averageRenderTime,
              category: 'component-performance',
            },
            ['component', 'slow-render', ...customTags]
          )
        }

        // Log props if enabled and changed
        if (logProps && props && JSON.stringify(props) !== JSON.stringify(propsRef.current)) {
          log.debug(
            `Component ${componentName} props changed`,
            {
              componentName,
              previousProps: propsRef.current,
              newProps: props,
              renderTime,
              category: 'component-props',
            },
            ['component', 'props-change', ...customTags]
          )
          propsRef.current = props
        }

        // Record performance metrics
        performanceMonitor.recordMetric(`component_${componentName}_render`, renderTime, {
          category: 'component-performance',
          slow: String(renderTime > threshold),
        })
      })
    },
    [componentName, trackRenders, threshold, logProps, customTags]
  )

  // Track interactions
  const trackInteraction = useCallback(
    (interactionType: string, properties?: InteractionProperties) => {
      if (!trackInteractions) return

      interactionCountRef.current++
      const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      log.userAction(`${componentName}_${interactionType}`, {
        componentName,
        interactionType,
        interactionId,
        ...properties,
        category: 'user-interaction',
      })

      performanceMonitor.recordMetric(`component_${componentName}_interaction`, 1, {
        category: 'user-interaction',
        type: interactionType,
      })

      setMetrics(prev => ({ ...prev, interactionCount: interactionCountRef.current }))
    },
    [componentName, trackInteractions]
  )

  // Track errors
  const trackError = useCallback(
    (error: Error, errorContext?: ErrorContext) => {
      errorCountRef.current++

      log.error(
        `Component ${componentName} error`,
        error,
        {
          componentName,
          errorContext,
          renderCount: renderCountRef.current,
          category: 'component-error',
        },
        ['component', 'error', ...customTags]
      )

      performanceMonitor.recordMetric(`component_${componentName}_error`, 1, {
        category: 'component-error',
        errorType: error.constructor.name,
      })

      setMetrics(prev => ({ ...prev, errorCount: errorCountRef.current }))
    },
    [componentName, customTags]
  )

  return {
    metrics,
    renderTracker,
    trackInteraction,
    trackError,
  }
}

/**
 * Hook for monitoring user interactions
 */
export function useUserInteraction(options: UseUserInteractionOptions = {}) {
  const { component, logProperties = [], debounceMs = 100, customTags = [] } = options

  const interactionCountRef = useRef(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const trackInteraction = useCallback(
    (action: string, properties?: InteractionProperties) => {
      interactionCountRef.current++

      const interactionData: InteractionData = {
        action,
        component,
        timestamp: Date.now(),
      }

      // Log only specified properties
      if (logProperties.length > 0 && properties) {
        logProperties.forEach(prop => {
          if (prop in properties) {
            interactionData[prop] = properties[prop]
          }
        })
      } else if (properties) {
        interactionData.properties = properties
      }

      // Debounce rapid interactions
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        log.userAction(action, interactionData)

        performanceMonitor.recordMetric(`user_interaction_${action}`, 1, {
          category: 'user-interaction',
          component: component || 'unknown',
        })
      }, debounceMs)
    },
    [component, logProperties, debounceMs, customTags]
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return { trackInteraction }
}

/**
 * Hook for monitoring async operations
 */
export function useAsyncOperation<T extends AsyncOperationArgs, R>(
  asyncFn: (...args: T) => Promise<R>,
  options: UseAsyncOperationOptions
) {
  const {
    name,
    logParams = false,
    logResult = false,
    retryAttempts = 0,
    timeout,
    customTags = [],
  } = options

  const [state, setState] = useState<{
    loading: boolean
    error: Error | null
    data: R | null
    attempt: number
    lastExecutionTime: number
  }>({
    loading: false,
    error: null,
    data: null,
    attempt: 0,
    lastExecutionTime: 0,
  })

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      const startTime = Date.now()
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        attempt: prev.attempt + 1,
      }))

      const context: AsyncOperationContext = {
        operationName: name,
        executionId,
        attempt: state.attempt + 1,
        startTime,
        category: 'async-operation',
      }

      if (logParams) {
        context.params = sanitizeAsyncParams(args)
      }

      log.info(`Async operation ${name} started`, context, ['async', 'start', ...customTags])

      let attempt = 0
      let lastError: Error | null = null

      while (attempt <= retryAttempts) {
        try {
          // Add timeout if specified
          const operationPromise = asyncFn(...args)
          const result = timeout
            ? await Promise.race([
                operationPromise,
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Operation timeout')), timeout)
                ),
              ])
            : await operationPromise

          const duration = Date.now() - startTime

          const logData: AsyncOperationLogData = {
            ...context,
            duration,
            success: true,
            attempt: attempt + 1,
          }

          if (logResult && result) {
            logData.result = sanitizeAsyncResult(result)
          }

          log.info(`Async operation ${name} completed`, logData, [
            'async',
            'success',
            ...customTags,
          ])

          performanceMonitor.recordMetric(`async_operation_${name}`, duration, {
            category: 'async-operation',
            success: 'true',
            attempt: String(attempt + 1),
          })

          setState({
            loading: false,
            error: null,
            data: result,
            attempt: attempt + 1,
            lastExecutionTime: duration,
          })

          return result
        } catch (error) {
          attempt++
          lastError = error instanceof Error ? error : new Error('Unknown error')
          const duration = Date.now() - startTime

          log.error(
            `Async operation ${name} failed (attempt ${attempt})`,
            lastError,
            {
              ...context,
              duration,
              attempt,
              maxAttempts: String(retryAttempts + 1),
              willRetry: attempt <= retryAttempts,
            },
            ['async', 'error', ...customTags]
          )

          performanceMonitor.recordMetric(`async_operation_${name}_error`, duration, {
            category: 'async-operation',
            errorType: lastError.constructor.name,
            attempt: String(attempt),
          })

          if (attempt > retryAttempts) {
            setState({
              loading: false,
              error: lastError,
              data: null,
              attempt,
              lastExecutionTime: duration,
            })
            return null
          }

          // Exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
      }

      return null
    },
    [asyncFn, name, logParams, logResult, retryAttempts, timeout, state.attempt, customTags]
  )

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
      attempt: 0,
      lastExecutionTime: 0,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * Hook for real-time metrics monitoring
 */
export function useRealTimeMetrics(refreshInterval = 5000) {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    performance: null,
    cache: null,
    connections: null,
    logs: null,
    timestamp: Date.now(),
  })

  const refresh = useCallback(async () => {
    try {
      const [performanceData, cacheData, connectionPoolData, logsData] = await Promise.all([
        performanceMonitor.getPerformanceReport(),
        Promise.resolve(cache.getStats()),
        Promise.resolve(connectionPool.getMetrics()),
        Promise.resolve({
          stats: (log as { getStats?: () => Record<string, unknown> }).getStats?.() || {},
          recent:
            (log as { getLogs?: (options: { limit: number }) => unknown[] }).getLogs?.({
              limit: 50,
            }) || [],
        } as LogStats),
      ])

      // Convert connection pool metrics to the expected ConnectionMetrics format
      let connectionData: ConnectionMetrics | null = null
      if (connectionPoolData && typeof connectionPoolData === 'object') {
        if ('totalConnections' in connectionPoolData) {
          // Single ConnectionMetrics from connection pool
          const poolMetrics = connectionPoolData as ConnectionPoolMetrics
          connectionData = {
            poolSize: poolMetrics.totalConnections || 0,
            activeConnections: poolMetrics.activeConnections || 0,
            idleConnections: poolMetrics.pooledConnections || 0,
            connectionReuseRate:
              poolMetrics.connectionReuses > 0
                ? poolMetrics.connectionReuses /
                  (poolMetrics.connectionCreations + poolMetrics.connectionReuses)
                : 0,
            averageConnectionTime: poolMetrics.averageResponseTime || 0,
            connectionErrors: 0,
          }
        } else {
          // Record<string, ConnectionMetrics> - use the first one or aggregate
          const entries = Object.values(connectionPoolData as Record<string, ConnectionPoolMetrics>)
          if (entries.length > 0) {
            const poolMetrics = entries[0]
            connectionData = {
              poolSize: poolMetrics.totalConnections || 0,
              activeConnections: poolMetrics.activeConnections || 0,
              idleConnections: poolMetrics.pooledConnections || 0,
              connectionReuseRate:
                poolMetrics.connectionReuses > 0
                  ? poolMetrics.connectionReuses /
                    (poolMetrics.connectionCreations + poolMetrics.connectionReuses)
                  : 0,
              averageConnectionTime: poolMetrics.averageResponseTime || 0,
              connectionErrors: 0,
            }
          }
        }
      }

      setMetrics({
        performance: performanceData?.current || undefined,
        cache: cacheData
          ? {
              totalEntries: 0, // Would need to be provided by the cache
              expiredEntries: 0,
              activeEntries: 0,
              hitRate:
                typeof cacheData === 'object' && cacheData !== null && 'hitRate' in cacheData
                  ? typeof cacheData.hitRate === 'number'
                    ? cacheData.hitRate
                    : undefined
                  : undefined,
              memoryUsage:
                typeof cacheData === 'object' && cacheData !== null && 'memoryUsage' in cacheData
                  ? typeof cacheData.memoryUsage === 'number'
                    ? cacheData.memoryUsage
                    : undefined
                  : undefined,
              evictions:
                typeof cacheData === 'object' && cacheData !== null && 'evictions' in cacheData
                  ? typeof cacheData.evictions === 'number'
                    ? cacheData.evictions
                    : undefined
                  : undefined,
              stats:
                typeof cacheData === 'object' &&
                cacheData !== null &&
                'stats' in cacheData &&
                typeof cacheData.stats === 'object' &&
                cacheData.stats !== null
                  ? (cacheData.stats as Record<string, unknown>)
                  : undefined,
            }
          : null,
        connections: connectionData
          ? {
              [connectionData.constructor.name || 'default']: connectionData,
            }
          : null,
        logs: logsData
          ? {
              stats: logsData.stats,
              recent: logsData.recent,
            }
          : null,
        timestamp: Date.now(),
        alerts: performanceData?.alerts || [],
      })
    } catch (error) {
      log.error(
        'Failed to refresh real-time metrics',
        error instanceof Error ? error : new Error('Unknown error')
      )
    }
  }, [])

  useEffect(() => {
    refresh() // Initial load

    const interval = setInterval(refresh, refreshInterval)
    return () => clearInterval(interval)
  }, [refresh, refreshInterval])

  return { metrics, refresh }
}

/**
 * Hook for monitoring viewport and performance
 */
export function useViewportPerformance() {
  const [viewportMetrics, setViewportMetrics] = useState({
    width: 0,
    height: 0,
    devicePixelRatio: 1,
    scrollY: 0,
    scrollX: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: 0,
    memoryLimit: 0,
    jsHeapSizeLimit: 0,
    totalJSHeapSize: 0,
    usedJSHeapSize: 0,
  })

  useEffect(() => {
    const updateViewportMetrics = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1

      setViewportMetrics({
        width,
        height,
        devicePixelRatio: dpr,
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      })
    }

    const updatePerformanceMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as { memory?: BrowserMemory }).memory
        if (memory) {
          setPerformanceMetrics({
            memoryUsage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
            memoryLimit: memory.jsHeapSizeLimit,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            totalJSHeapSize: memory.totalJSHeapSize,
            usedJSHeapSize: memory.usedJSHeapSize,
          })
        }
      }
    }

    updateViewportMetrics()
    updatePerformanceMetrics()

    window.addEventListener('resize', updateViewportMetrics)
    window.addEventListener('scroll', updateViewportMetrics)

    const performanceInterval = setInterval(updatePerformanceMetrics, 5000)

    return () => {
      window.removeEventListener('resize', updateViewportMetrics)
      window.removeEventListener('scroll', updateViewportMetrics)
      clearInterval(performanceInterval)
    }
  }, [])

  return { viewportMetrics, performanceMetrics }
}

// Utility functions

function sanitizeAsyncParams(params: AsyncOperationArgs): unknown {
  return params.map((param, index) => {
    if (typeof param === 'string' && param.length > 100) {
      return { type: 'string', length: param.length, index }
    }
    if (typeof param === 'object' && param !== null) {
      return { type: 'object', keys: Object.keys(param), index }
    }
    return { value: param, index }
  })
}

function sanitizeAsyncResult(result: unknown): unknown {
  if (Array.isArray(result)) {
    return { type: 'array', length: result.length }
  }
  if (typeof result === 'object' && result !== null) {
    return { type: 'object', keys: Object.keys(result) }
  }
  if (typeof result === 'string' && result.length > 100) {
    return { type: 'string', length: result.length }
  }
  return { type: typeof result, value: result }
}
