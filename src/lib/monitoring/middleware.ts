/**
 * Monitoring Middleware
 *
 * Middleware for API routes with comprehensive performance tracking,
 * request logging, and error monitoring.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'
import { performanceMonitor } from '@/lib/performance/monitor'
import { cache } from '@/lib/cache/cache-manager'
import { connectionPool, type ConnectionMetrics } from '@/lib/performance/connection-pool'

export interface MonitoringMiddlewareOptions {
  enableRequestBodyLogging?: boolean
  enableResponseBodyLogging?: boolean
  maxRequestBodySize?: number
  excludePaths?: string[]
  customTags?: string[]
  rateLimiting?: {
    windowMs: number
    maxRequests: number
  }
}

export interface RequestContext {
  requestId: string
  startTime: number
  method: string
  url: string
  userAgent?: string
  ip?: string
  userId?: string
  sessionId?: string
}

// Type definitions for monitoring system
export interface RequestData {
  requestId: string
  method: string
  url: string
  userAgent?: string
  ip?: string
  userId?: string
  sessionId?: string
  body?: unknown
  bodySize?: number
  bodyParseError?: boolean
}

export interface ResponseData {
  requestId: string
  method: string
  url: string
  statusCode: number
  duration: number
  success: boolean
  body?: unknown
  responseBodySize?: number
  responseBodyParseError?: boolean
  cacheHitRate?: number
  cacheSize?: number
  connectionPoolMetrics?: ConnectionPoolMetrics
}

export type ConnectionPoolMetrics = ConnectionMetrics | Record<string, ConnectionMetrics>

export interface HandlerContext {
  requestId: string
  method: string
  url: string
  userAgent?: string
  ip?: string
  userId?: string
  sessionId?: string
}

export interface FunctionContext {
  function: string
  class: unknown
  category: string
  params?: unknown
}

export interface FunctionLogData extends FunctionContext {
  duration: number
  success: boolean
  result?: unknown
}

export interface MonitoringDecoratorOptions {
  category?: string
  tags?: string[]
  logParams?: boolean
  logResult?: boolean
  threshold?: number
}

export interface MonitoringHandlerOptions {
  name: string
  category?: string
  tags?: string[]
  logRequestBody?: boolean
  logResponseBody?: boolean
}

export interface Constructor {
  new (...args: unknown[]): unknown
  name: string
}

// Generic array type for monitoring functions
export type MonitoringFunctionArgs = readonly unknown[]

/**
 * Middleware factory for API monitoring
 */
export function createMonitoringMiddleware(options: MonitoringMiddlewareOptions = {}) {
  const {
    enableRequestBodyLogging = false,
    enableResponseBodyLogging = false,
    maxRequestBodySize = 1024 * 10, // 10KB
    excludePaths = ['/api/health', '/api/metrics'],
    customTags = [],
    rateLimiting,
  } = options

  const requestCounts = new Map<string, { count: number; resetTime: number }>()

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = generateRequestId()
    const url = request.url
    const method = request.method

    // Skip monitoring for excluded paths
    if (excludePaths.some(path => url.includes(path))) {
      return NextResponse.next()
    }

    // Rate limiting check
    if (rateLimiting) {
      const clientIp = getClientIp(request)
      const now = Date.now()
      const clientData = requestCounts.get(clientIp)

      if (clientData && now > clientData.resetTime) {
        requestCounts.delete(clientIp)
      }

      const currentData = requestCounts.get(clientIp) || {
        count: 0,
        resetTime: now + rateLimiting.windowMs,
      }
      currentData.count++
      requestCounts.set(clientIp, currentData)

      if (currentData.count > rateLimiting.maxRequests) {
        logger.warn(
          'Rate limit exceeded',
          {
            ip: clientIp,
            url,
            method,
            count: currentData.count,
            limit: rateLimiting.maxRequests,
          },
          ['rate-limit']
        )

        return NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: { 'X-RateLimit-Limit': rateLimiting.maxRequests.toString() } }
        )
      }
    }

    // Create request context
    const context: RequestContext = {
      requestId,
      startTime,
      method,
      url,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: getClientIp(request),
      userId: request.headers.get('x-user-id') || undefined,
      sessionId: request.headers.get('x-session-id') || undefined,
    }

    // Log request start
    const requestData: RequestData = {
      requestId,
      method,
      url,
      userAgent: context.userAgent,
      ip: context.ip,
      userId: context.userId,
      sessionId: context.sessionId,
    }

    if (enableRequestBodyLogging && request.body) {
      try {
        const body = await request.clone().text()
        if (body.length <= maxRequestBodySize) {
          try {
            requestData.body = JSON.parse(body)
          } catch {
            requestData.body = body.substring(0, maxRequestBodySize)
          }
        } else {
          requestData.bodySize = body.length
        }
      } catch (_error) {
        requestData.bodyParseError = true
      }
    }

    logger.info(`${method} ${url} started`, requestData, ['api', 'request', 'start', ...customTags])

    // Create response wrapper
    let response: NextResponse
    let statusCode = 200
    let errorMessage: string | undefined

    try {
      // Add monitoring context to headers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-request-id', requestId)
      requestHeaders.set('x-start-time', startTime.toString())

      // Clone request with new headers
      const monitoredRequest = new Request(request.url, {
        method: request.method,
        headers: requestHeaders,
        body: request.body,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        mode: request.mode,
        credentials: request.credentials,
        cache: request.cache,
        integrity: request.integrity,
        keepalive: request.keepalive,
        signal: request.signal,
      })

      // Continue with request
      response = NextResponse.next({
        request: monitoredRequest,
      })

      // Get status code from response
      statusCode = response.status || 200

      // Log successful request
      const duration = Date.now() - startTime
      const responseData: ResponseData = {
        requestId,
        method,
        url,
        statusCode,
        duration,
        success: statusCode < 400,
      }

      // Log response body if enabled and response is successful
      if (enableResponseBodyLogging && statusCode < 400) {
        try {
          const responseClone = response.clone()
          const body = await responseClone.text()
          if (body.length <= maxRequestBodySize) {
            try {
              responseData.body = JSON.parse(body)
            } catch {
              responseData.body = body.substring(0, maxRequestBodySize)
            }
          } else {
            responseData.responseBodySize = body.length
          }
        } catch (_error) {
          responseData.responseBodyParseError = true
        }
      }

      // Add cache and connection metrics
      const cacheStats = cache.getStats()
      const connectionMetrics = connectionPool.getMetrics()

      responseData.cacheHitRate = cacheStats.hitRate || 0
      responseData.cacheSize = cacheStats.totalEntries
      responseData.connectionPoolMetrics = connectionMetrics

      logger.apiRequest(method, url, statusCode, duration, responseData)

      // Add monitoring headers to response
      response.headers.set('x-request-id', requestId)
      response.headers.set('x-response-time', duration.toString())
      response.headers.set('x-cache-hit-rate', responseData.cacheHitRate.toString())
    } catch (_error) {
      statusCode = 500
      errorMessage = 'Unknown error'
      const duration = Date.now() - startTime

      logger.error(
        `${method} ${url} failed`,
        new Error(errorMessage),
        {
          requestId,
          method,
          url,
          statusCode,
          duration,
          errorMessage,
        },
        ['api', 'request', 'error', ...customTags]
      )

      response = NextResponse.json(
        { error: 'Internal Server Error', requestId },
        { status: 500, headers: { 'x-request-id': requestId } }
      )
    }

    // Record performance metrics
    const duration = Date.now() - startTime
    performanceMonitor.recordAPIRequest(duration, statusCode)
    performanceMonitor.recordMetric(
      `api_${method.toLowerCase()}_${Math.floor(statusCode / 100)}xx`,
      duration,
      {
        endpoint: new URL(url).pathname,
        method,
        statusCode: String(statusCode),
      }
    )

    // Add monitoring headers
    response.headers.set('x-request-id', requestId)
    response.headers.set('x-response-time', duration.toString())

    return response
  }
}

/**
 * Create API route wrapper with monitoring
 */
export function withMonitoring<T extends MonitoringFunctionArgs, R>(
  handler: (...args: T) => Promise<R>,
  options: MonitoringHandlerOptions = { name: 'api-handler' }
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    const requestId = generateRequestId()

    try {
      // Extract request and response from args (for Next.js API routes)
      const request = args[0] as NextRequest
      const _responseHandler = args[1] as unknown

      const context = {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: getClientIp(request),
        userId: request.headers.get('x-user-id'),
        sessionId: request.headers.get('x-session-id'),
      }

      logger.info(
        `${options.name} started`,
        {
          ...context,
          handler: options.name,
          category: options.category || 'api',
        },
        ['handler', 'start', ...(options.tags || [])]
      )

      // Execute handler
      const result = await handler(...args)

      // Log success
      const duration = Date.now() - startTime
      logger.info(
        `${options.name} completed`,
        {
          ...context,
          handler: options.name,
          category: options.category,
          duration,
          success: true,
        },
        ['handler', 'success', ...(options.tags || [])]
      )

      // Record performance
      performanceMonitor.recordMetric(`handler_${options.name}`, duration, {
        category: options.category || 'api',
        success: 'true',
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error(
        `${options.name} failed`,
        error instanceof Error ? error : new Error(errorMessage),
        {
          requestId,
          handler: options.name,
          category: options.category,
          duration,
          errorMessage,
        },
        ['handler', 'error', ...(options.tags || [])]
      )

      // Record performance
      performanceMonitor.recordMetric(`handler_${options.name}`, duration, {
        category: options.category || 'api',
        success: 'false',
      })

      throw error
    }
  }
}

/**
 * Performance monitoring decorator for functions
 */
export function measurePerformance<T extends MonitoringFunctionArgs, R>(
  name: string,
  options: MonitoringDecoratorOptions = {}
) {
  return function (target: Constructor, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      const startTime = Date.now()
      const context: FunctionContext = {
        function: name,
        class: target.constructor.name,
        category: options.category || 'function',
      }

      if (options.logParams) {
        context.params = sanitizeParams(args)
      }

      logger.debug(`Function ${name} started`, context, [
        'function',
        'start',
        ...(options.tags || []),
      ])

      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime

        const logData: FunctionLogData = {
          ...context,
          duration,
          success: true,
        }

        if (options.logResult && result) {
          logData.result = sanitizeResult(result)
        }

        logger.debug(`Function ${name} completed`, logData, [
          'function',
          'success',
          ...(options.tags || []),
        ])

        // Check threshold
        if (options.threshold && duration > options.threshold) {
          logger.warn(
            `Function ${name} exceeded performance threshold`,
            {
              ...context,
              duration,
              threshold: options.threshold,
            },
            ['performance', 'slow-function', ...(options.tags || [])]
          )
        }

        // Record performance
        performanceMonitor.recordMetric(`function_${name}`, duration, {
          category: options.category || 'function',
          class: target.constructor.name,
          success: 'true',
        })

        return result
      } catch (error) {
        const duration = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        logger.error(
          `Function ${name} failed`,
          error instanceof Error ? error : new Error(errorMessage),
          {
            ...context,
            duration,
            errorMessage,
          },
          ['function', 'error', ...(options.tags || [])]
        )

        // Record performance
        performanceMonitor.recordMetric(`function_${name}`, duration, {
          category: options.category || 'function',
          class: target.constructor.name,
          success: 'false',
        })

        throw error
      }
    }

    return descriptor
  }
}

// Utility functions

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

function sanitizeParams(params: MonitoringFunctionArgs): unknown {
  return params.map((param, _index) => {
    if (typeof param === 'string' && param.length > 100) {
      return `[string:${param.length} chars]`
    }
    if (typeof param === 'object' && param !== null) {
      return '[object]'
    }
    return param
  })
}

function sanitizeResult(result: unknown): unknown {
  if (typeof result === 'string' && result.length > 100) {
    return `[string:${result.length} chars]`
  }
  if (typeof result === 'object' && result !== null) {
    if (Array.isArray(result)) {
      return `[array:${result.length} items]`
    }
    return '[object]'
  }
  return result
}

// Export convenience function for Next.js middleware
export const monitoringMiddleware = createMonitoringMiddleware()
