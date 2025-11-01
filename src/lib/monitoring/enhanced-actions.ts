/**
 * Enhanced Actions with Monitoring
 *
 * Wrapper functions that add comprehensive monitoring and logging
 * to existing application actions and workflows.
 */

'use server'

import { log } from './logger'
import { performanceMonitor } from '@/lib/performance/monitor'
import { cache } from '@/lib/cache/cache-manager'
import { connectionPool } from '@/lib/performance/connection-pool'

export interface MonitoringOptions {
  name: string
  category?: string
  tags?: string[]
  cacheable?: boolean
  cacheTTL?: number
  measureDatabase?: boolean
  measureCache?: boolean
  logParams?: boolean
  logResult?: boolean
  threshold?: number
}

export interface ActionContext {
  actionId: string
  actionName: string
  category: string
  argsCount: number
  timestamp: number
  params?: unknown
}

export interface ActionLogData extends ActionContext {
  duration: number
  success: boolean
  cacheHit?: boolean
  result?: unknown
  cacheStats?: {
    hitRate: number
    totalEntries: number
    activeEntries: number
  }
  connectionMetrics?: unknown
}

export interface QueryContext {
  queryId: string
  queryName: string
  category: string
  timestamp: number
  [key: string]: unknown
}

export interface UserActionProperties {
  [key: string]: unknown
}

export interface WorkflowStep {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

export interface WorkflowAdditionalContext {
  [key: string]: unknown
}

export interface WorkflowPerformanceData {
  count: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
}

export interface UserAnalyticsData {
  [actionName: string]: number
}

// Generic array type for monitored actions
export type MonitoredActionArgs = readonly unknown[]

/**
 * Create a monitored server action wrapper
 */
export function createMonitoredAction<T extends MonitoredActionArgs, R>(
  action: (...args: T) => Promise<R>,
  options: MonitoringOptions
) {
  return async function monitoredAction(...args: T): Promise<R> {
    const startTime = Date.now()
    const actionId = generateActionId()

    const context: ActionContext = {
      actionId,
      actionName: options.name,
      category: options.category || 'server-action',
      argsCount: args.length,
      timestamp: startTime,
    }

    // Log parameter info if enabled
    if (options.logParams) {
      context.params = sanitizeActionParams(args)
    }

    log.info(`Action ${options.name} started`, context, [
      'server-action',
      'start',
      ...(options.tags || []),
    ])

    try {
      // Check cache first if cacheable
      let result: R | undefined
      let cacheHit = false

      if (options.cacheable) {
        const cacheKey = generateCacheKey(options.name, args)
        const cached = cache.get<R>(cacheKey)

        if (cached) {
          result = cached
          cacheHit = true

          log.debug(
            `Action ${options.name} cache hit`,
            {
              ...context,
              cacheHit: true,
              cacheKey,
            },
            ['server-action', 'cache-hit', ...(options.tags || [])]
          )
        }
      }

      // Execute action if not cached
      if (!cacheHit) {
        // Measure database operations
        const measureDb = options.measureDatabase !== false

        if (measureDb) {
          result = await performanceMonitor
            .measure(() => action(...args), `action_${options.name}_db`)
            .then(({ result }) => result)
        } else {
          result = await action(...args)
        }

        // Cache result if cacheable
        if (options.cacheable && result) {
          const cacheKey = generateCacheKey(options.name, args)
          cache.set(cacheKey, result, { ttl: options.cacheTTL })
        }
      }

      const duration = Date.now() - startTime

      const logData: ActionLogData = {
        ...context,
        duration,
        success: true,
        cacheHit,
      }

      // Log result info if enabled
      if (options.logResult && result) {
        logData.result = sanitizeActionResult(result)
      }

      // Add cache metrics
      if (options.measureCache) {
        const cacheStats = cache.getStats()
        logData.cacheStats = {
          hitRate: cacheStats.hitRate || 0,
          totalEntries: cacheStats.totalEntries,
          activeEntries: cacheStats.activeEntries,
        }
      }

      // Add connection pool metrics
      const connectionMetrics = connectionPool.getMetrics()
      logData.connectionMetrics = connectionMetrics

      log.info(`Action ${options.name} completed`, logData, [
        'server-action',
        'success',
        ...(options.tags || []),
      ])

      // Check performance threshold
      if (options.threshold && duration > options.threshold) {
        log.warn(
          `Action ${options.name} exceeded performance threshold`,
          {
            ...context,
            duration,
            threshold: options.threshold,
          },
          ['performance', 'slow-action', ...(options.tags || [])]
        )
      }

      // Record performance metrics
      performanceMonitor.recordMetric(`action_${options.name}`, duration, {
        category: options.category || 'server-action',
        success: 'true',
        cacheHit: String(cacheHit),
      })

      if (result === undefined) {
        throw new Error(`Action ${options.name} completed but returned undefined`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      log.error(
        `Action ${options.name} failed`,
        error instanceof Error ? error : new Error(errorMessage),
        {
          ...context,
          duration,
          errorMessage,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
        ['server-action', 'error', ...(options.tags || [])]
      )

      // Record error metrics
      performanceMonitor.recordMetric(`action_${options.name}_error`, duration, {
        category: options.category || 'server-action',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      })

      throw error
    }
  }
}

/**
 * Monitor database query execution
 */
export async function monitoredQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  context?: QueryContext
): Promise<T> {
  const startTime = Date.now()
  const queryId = generateQueryId()

  const queryContext = {
    queryId,
    queryName,
    category: 'database-query',
    timestamp: startTime,
    ...context,
  }

  log.debug(`Query ${queryName} started`, queryContext, ['database', 'query-start'])

  try {
    // Use connection pool for query execution
    const result = await connectionPool.execute(async _client => {
      return await performanceMonitor
        .measure(() => queryFn(), `query_${queryName}`)
        .then(({ result }) => result)
    })

    const duration = Date.now() - startTime

    log.databaseQuery(queryName, duration, true, {
      ...queryContext,
      duration,
      success: true,
    })

    // Record database metrics
    performanceMonitor.recordDatabaseQuery(duration, true)
    performanceMonitor.recordMetric(`query_${queryName}`, duration, {
      category: 'database-query',
      success: 'true',
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    log.databaseQuery(queryName, duration, false, {
      ...queryContext,
      duration,
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    })

    // Record error metrics
    performanceMonitor.recordDatabaseQuery(duration, false)
    performanceMonitor.recordMetric(`query_${queryName}_error`, duration, {
      category: 'database-query',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    })

    throw error
  }
}

/**
 * Monitor cache operations
 */
export const monitoredCache = {
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now()

    try {
      const result = cache.get<T>(key)
      const duration = Date.now() - startTime

      log.debug(
        `Cache get ${key}`,
        {
          key,
          hit: result !== null,
          duration,
          category: 'cache-operation',
        },
        ['cache', 'get']
      )

      performanceMonitor.recordMetric('cache_get', duration, {
        operation: 'get',
        hit: String(result !== null),
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      log.error(
        `Cache get failed for ${key}`,
        error instanceof Error ? error : new Error('Unknown error'),
        {
          key,
          duration,
          category: 'cache-operation',
        },
        ['cache', 'error']
      )

      performanceMonitor.recordMetric('cache_get_error', duration, {
        operation: 'get',
        error: 'true',
      })

      return null
    }
  },

  async set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void> {
    const startTime = Date.now()

    try {
      cache.set(key, value, options)
      const duration = Date.now() - startTime

      log.debug(
        `Cache set ${key}`,
        {
          key,
          duration,
          ttl: options?.ttl,
          category: 'cache-operation',
        },
        ['cache', 'set']
      )

      performanceMonitor.recordMetric('cache_set', duration, {
        operation: 'set',
      })
    } catch (error) {
      const duration = Date.now() - startTime
      log.error(
        `Cache set failed for ${key}`,
        error instanceof Error ? error : new Error('Unknown error'),
        {
          key,
          duration,
          category: 'cache-operation',
        },
        ['cache', 'error']
      )

      performanceMonitor.recordMetric('cache_set_error', duration, {
        operation: 'set',
        error: 'true',
      })
    }
  },

  async invalidate(pattern: string): Promise<number> {
    const startTime = Date.now()

    try {
      const regex = new RegExp(pattern)
      const deleted = cache.invalidateByPattern(regex)
      const duration = Date.now() - startTime

      log.info(
        `Cache invalidate ${pattern}`,
        {
          pattern,
          deleted,
          duration,
          category: 'cache-operation',
        },
        ['cache', 'invalidate']
      )

      performanceMonitor.recordMetric('cache_invalidate', duration, {
        operation: 'invalidate',
        deleted: String(deleted),
      })

      return deleted
    } catch (error) {
      const duration = Date.now() - startTime
      log.error(
        `Cache invalidate failed for ${pattern}`,
        error instanceof Error ? error : new Error('Unknown error'),
        {
          pattern,
          duration,
          category: 'cache-operation',
        },
        ['cache', 'error']
      )

      performanceMonitor.recordMetric('cache_invalidate_error', duration, {
        operation: 'invalidate',
        error: 'true',
      })

      return 0
    }
  },
}

/**
 * Monitor user interactions
 */
export function trackUserAction(
  actionName: string,
  properties?: UserActionProperties,
  _tags?: string[]
): void {
  const context = {
    actionName,
    category: 'user-interaction',
    timestamp: Date.now(),
    ...properties,
  }

  log.userAction(actionName, context)

  performanceMonitor.recordMetric(`user_action_${actionName}`, 1, {
    category: 'user-interaction',
    ...properties,
  })

  // Track in cache for real-time analytics
  const analyticsKey = `user_actions:${new Date().toISOString().substring(0, 10)}`
  const current: Record<string, number> = (cache.get(analyticsKey) as Record<string, number>) || {}
  current[actionName] = (current[actionName] || 0) + 1
  cache.set(analyticsKey, current, { ttl: 24 * 60 * 60 * 1000 }) // 24 hours
}

/**
 * Monitor workflow performance
 */
export class WorkflowMonitor {
  private workflowName: string
  private startTime: number
  private steps: Array<{ name: string; startTime: number; endTime?: number; duration?: number }> =
    []

  constructor(workflowName: string) {
    this.workflowName = workflowName
    this.startTime = Date.now()

    log.info(
      `Workflow ${workflowName} started`,
      {
        workflowName,
        category: 'workflow',
        timestamp: this.startTime,
      },
      ['workflow', 'start']
    )
  }

  step(stepName: string): () => void {
    const stepStartTime = Date.now()
    this.steps.push({ name: stepName, startTime: stepStartTime })

    log.debug(
      `Workflow step ${stepName} started`,
      {
        workflowName: this.workflowName,
        stepName,
        category: 'workflow-step',
      },
      ['workflow', 'step-start']
    )

    return () => {
      const stepEndTime = Date.now()
      const stepDuration = stepEndTime - stepStartTime

      const stepIndex = this.steps.findIndex(step => step.name === stepName && !step.endTime)
      if (stepIndex !== -1) {
        this.steps[stepIndex] = {
          ...this.steps[stepIndex],
          endTime: stepEndTime,
          duration: stepDuration,
        }
      }

      log.debug(
        `Workflow step ${stepName} completed`,
        {
          workflowName: this.workflowName,
          stepName,
          duration: stepDuration,
          category: 'workflow-step',
        },
        ['workflow', 'step-complete']
      )

      performanceMonitor.recordMetric(
        `workflow_${this.workflowName}_step_${stepName}`,
        stepDuration,
        {
          category: 'workflow-step',
          workflow: this.workflowName,
          step: stepName,
        }
      )
    }
  }

  complete(additionalContext?: WorkflowAdditionalContext): void {
    const endTime = Date.now()
    const totalDuration = endTime - this.startTime

    const workflowData = {
      workflowName: this.workflowName,
      totalDuration,
      steps: this.steps.map(step => ({
        name: step.name,
        duration: step.duration || 0,
        percentage: step.duration ? (step.duration / totalDuration) * 100 : 0,
      })),
      category: 'workflow',
      timestamp: this.startTime,
      ...additionalContext,
    }

    log.info(`Workflow ${this.workflowName} completed`, workflowData, ['workflow', 'complete'])

    performanceMonitor.recordMetric(`workflow_${this.workflowName}`, totalDuration, {
      category: 'workflow',
      steps: String(this.steps.length),
      success: 'true',
    })

    // Track workflow performance
    const performanceKey = `workflow_performance:${this.workflowName}`
    const performanceData: WorkflowPerformanceData = (cache.get(
      performanceKey
    ) as WorkflowPerformanceData) || {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
    }

    performanceData.count++
    performanceData.totalDuration += totalDuration
    performanceData.averageDuration = performanceData.totalDuration / performanceData.count
    performanceData.minDuration = Math.min(performanceData.minDuration, totalDuration)
    performanceData.maxDuration = Math.max(performanceData.maxDuration, totalDuration)

    cache.set(performanceKey, performanceData, { ttl: 60 * 60 * 1000 }) // 1 hour
  }

  error(error: Error | string, additionalContext?: WorkflowAdditionalContext): void {
    const endTime = Date.now()
    const totalDuration = endTime - this.startTime
    const errorMessage = typeof error === 'string' ? error : error.message

    log.error(
      `Workflow ${this.workflowName} failed`,
      typeof error === 'string' ? new Error(error) : error,
      {
        workflowName: this.workflowName,
        totalDuration,
        errorMessage,
        completedSteps: this.steps.filter(step => step.endTime).length,
        totalSteps: this.steps.length,
        category: 'workflow',
        ...additionalContext,
      },
      ['workflow', 'error']
    )

    performanceMonitor.recordMetric(`workflow_${this.workflowName}_error`, totalDuration, {
      category: 'workflow',
      errorType: typeof error === 'string' ? 'string' : error.constructor.name,
      completedSteps: String(this.steps.filter(step => step.endTime).length),
    })
  }
}

// Utility functions

function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function generateQueryId(): string {
  return `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function generateCacheKey(actionName: string, args: MonitoredActionArgs): string {
  const argsHash = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join('_')
  return `action_${actionName}_${argsHash}`
}

function sanitizeActionParams(args: MonitoredActionArgs): unknown {
  return args.map((arg, index) => {
    if (typeof arg === 'string' && arg.length > 100) {
      return { type: 'string', length: arg.length, index }
    }
    if (typeof arg === 'object' && arg !== null) {
      return { type: 'object', keys: Object.keys(arg), index }
    }
    return { value: arg, index }
  })
}

function sanitizeActionResult(result: unknown): unknown {
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
