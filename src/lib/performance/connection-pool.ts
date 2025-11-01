/**
 * Connection Pool Manager
 *
 * Manages Supabase client connections with pooling,
 * connection reuse, and performance monitoring.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserClient, getServerClient } from '@/lib/supabase/singleton'
import { logger } from '@/lib/monitoring/logger'
import { performanceMonitor } from '@/lib/performance/monitor'

export interface ConnectionMetrics {
  totalConnections: number
  activeConnections: number
  pooledConnections: number
  connectionCreations: number
  connectionReuses: number
  averageResponseTime: number
  lastActivity: number
}

export interface PoolOptions {
  maxConnections: number
  connectionTimeout: number
  idleTimeout: number
  maxReuseCount: number
  healthCheckInterval: number
}

export interface ConnectionPoolReport {
  timestamp: string
  pools: {
    [poolType: string]: ConnectionMetrics & {
      averageResponseTimeMs: number
      recommendations: string[]
    }
  }
}

/**
 * Connection pool entry
 */
interface PooledConnection {
  client: SupabaseClient
  createdAt: number
  lastUsed: number
  reuseCount: number
  isActive: boolean
  responseTimes: number[]
}

/**
 * Supabase Connection Pool
 */
export class SupabaseConnectionPool {
  private static instance: SupabaseConnectionPool
  private connections: Map<string, PooledConnection[]> = new Map()
  private metrics: Map<string, ConnectionMetrics> = new Map()
  private options: PoolOptions
  private healthCheckInterval: ReturnType<typeof setInterval>

  private constructor(options: Partial<PoolOptions> = {}) {
    this.options = {
      maxConnections: 10,
      connectionTimeout: 30000, // 30 seconds
      idleTimeout: 300000, // 5 minutes
      maxReuseCount: 100,
      healthCheckInterval: 60000, // 1 minute
      ...options,
    }

    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      this.options.healthCheckInterval
    )
  }

  static getInstance(options?: Partial<PoolOptions>): SupabaseConnectionPool {
    if (!SupabaseConnectionPool.instance) {
      SupabaseConnectionPool.instance = new SupabaseConnectionPool(options)
    }
    return SupabaseConnectionPool.instance
  }

  /**
   * Get a connection from the pool or create a new one
   */
  async getConnection(type: 'browser' | 'server' = 'browser'): Promise<SupabaseClient> {
    const poolKey = type
    const now = Date.now()
    const operationId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    logger.debug(
      `Connection requested from ${type} pool`,
      {
        operationId,
        poolType: type,
        timestamp: now,
      },
      ['connection-pool', 'get-connection']
    )

    // Initialize pool if needed
    if (!this.connections.has(poolKey)) {
      this.connections.set(poolKey, [])
      this.initializeMetrics(poolKey)

      logger.info(
        `Initialized ${type} connection pool`,
        {
          poolType: type,
          maxConnections: this.options.maxConnections,
        },
        ['connection-pool', 'init']
      )
    }

    const pool = this.connections.get(poolKey)!
    const metrics = this.metrics.get(poolKey)!

    // Try to reuse an existing connection
    for (let i = 0; i < pool.length; i++) {
      const connection = pool[i]

      if (
        !connection.isActive &&
        connection.reuseCount < this.options.maxReuseCount &&
        now - connection.lastUsed < this.options.idleTimeout
      ) {
        connection.isActive = true
        connection.lastUsed = now
        connection.reuseCount++
        metrics.activeConnections++
        metrics.connectionReuses++

        logger.debug(
          `Reusing existing connection from ${type} pool`,
          {
            operationId,
            poolType: type,
            reuseCount: connection.reuseCount,
            connectionAge: now - connection.createdAt,
          },
          ['connection-pool', 'reuse']
        )

        performanceMonitor.recordMetric(`connection_pool_${type}_reuse`, 1, {
          poolType: type,
          reuseCount: String(connection.reuseCount),
        })

        return this.timeConnection(connection.client, poolKey)
      }
    }

    // Create new connection if pool not full
    if (pool.length < this.options.maxConnections) {
      const client = await this.createConnection(type)
      const newConnection: PooledConnection = {
        client,
        createdAt: now,
        lastUsed: now,
        reuseCount: 1,
        isActive: true,
        responseTimes: [],
      }

      pool.push(newConnection)
      metrics.totalConnections++
      metrics.activeConnections++
      metrics.connectionCreations++
      metrics.pooledConnections++

      logger.info(
        `Created new connection in ${type} pool`,
        {
          operationId,
          poolType: type,
          poolSize: pool.length,
          maxConnections: this.options.maxConnections,
        },
        ['connection-pool', 'create']
      )

      performanceMonitor.recordMetric(`connection_pool_${type}_create`, 1, {
        poolType: type,
        poolSize: String(pool.length),
      })

      return this.timeConnection(client, poolKey)
    }

    // Pool full, create temporary connection
    metrics.totalConnections++
    metrics.connectionCreations++

    logger.warn(
      `Connection pool ${type} is full, creating temporary connection`,
      {
        operationId,
        poolType: type,
        poolSize: pool.length,
        maxConnections: this.options.maxConnections,
      },
      ['connection-pool', 'pool-full', 'warning']
    )

    performanceMonitor.recordMetric(`connection_pool_${type}_overflow`, 1, {
      poolType: type,
      poolSize: String(pool.length),
    })

    const tempClient = await this.createConnection(type)
    return this.timeConnection(tempClient, poolKey)
  }

  /**
   * Return a connection to the pool
   */
  releaseConnection(client: SupabaseClient, type: 'browser' | 'server' = 'browser'): void {
    const poolKey = type
    const pool = this.connections.get(poolKey)
    const metrics = this.metrics.get(poolKey)
    const now = Date.now()

    if (!pool || !metrics) {
      logger.warn(
        `Attempted to release connection to unknown ${type} pool`,
        {
          poolType: type,
          timestamp: now,
        },
        ['connection-pool', 'release-error', 'warning']
      )
      return
    }

    // Find the connection in the pool
    const connection = pool.find(c => c.client === client)
    if (connection) {
      const connectionDuration = now - connection.lastUsed
      connection.isActive = false
      connection.lastUsed = now
      metrics.activeConnections--

      logger.debug(
        `Connection released to ${type} pool`,
        {
          poolType: type,
          connectionAge: now - connection.createdAt,
          connectionDuration,
          reuseCount: connection.reuseCount,
          activeConnections: metrics.activeConnections,
        },
        ['connection-pool', 'release']
      )

      performanceMonitor.recordMetric(`connection_pool_${type}_release`, connectionDuration, {
        poolType: type,
        reuseCount: String(connection.reuseCount),
      })
    } else {
      logger.warn(
        `Attempted to release unknown connection to ${type} pool`,
        {
          poolType: type,
          poolSize: pool.length,
          timestamp: now,
        },
        ['connection-pool', 'release-unknown', 'warning']
      )
    }
  }

  /**
   * Execute operation with automatic connection management
   */
  async execute<T>(
    operation: (client: SupabaseClient) => Promise<T>,
    type: 'browser' | 'server' = 'browser'
  ): Promise<T> {
    const client = await this.getConnection(type)

    try {
      const result = await operation(client)
      return result
    } finally {
      this.releaseConnection(client, type)
    }
  }

  /**
   * Get pool metrics
   */
  getMetrics(type?: 'browser' | 'server'): ConnectionMetrics | Record<string, ConnectionMetrics> {
    if (type) {
      return this.metrics.get(type) || this.getDefaultMetrics()
    }

    const result: Record<string, ConnectionMetrics> = {}
    for (const [key, metrics] of this.metrics.entries()) {
      result[key] = metrics
    }
    return result
  }

  /**
   * Clear idle connections
   */
  clearIdleConnections(): number {
    let cleared = 0
    const now = Date.now()

    for (const [poolKey, pool] of this.connections.entries()) {
      // Remove idle connections
      for (let i = pool.length - 1; i >= 0; i--) {
        const connection = pool[i]
        if (!connection.isActive && now - connection.lastUsed > this.options.idleTimeout) {
          pool.splice(i, 1)
          cleared++
        }
      }

      // Update metrics
      const metrics = this.metrics.get(poolKey)
      if (metrics) {
        metrics.pooledConnections = pool.length
      }
    }

    return cleared
  }

  /**
   * Destroy the connection pool
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.connections.clear()
    this.metrics.clear()
  }

  // Private methods

  private async createConnection(type: 'browser' | 'server'): Promise<SupabaseClient> {
    if (type === 'browser') {
      return getBrowserClient()
    } else {
      return getServerClient()
    }
  }

  private async timeConnection<T>(
    client: SupabaseClient,
    poolKey: string,
    operation?: () => Promise<T>
  ): Promise<SupabaseClient> {
    // If no operation, just return client
    if (!operation) return client

    const startTime = Date.now()
    const connection = this.findConnection(client, poolKey)

    try {
      await operation()
      const responseTime = Date.now() - startTime

      if (connection) {
        connection.responseTimes.push(responseTime)
        // Keep only last 10 response times
        if (connection.responseTimes.length > 10) {
          connection.responseTimes.shift()
        }
      }

      this.updateAverageResponseTime(poolKey)
    } catch (error) {
      // Still update timing on error
      const responseTime = Date.now() - startTime
      if (connection) {
        connection.responseTimes.push(responseTime)
        if (connection.responseTimes.length > 10) {
          connection.responseTimes.shift()
        }
      }
      this.updateAverageResponseTime(poolKey)
      throw error
    }

    return client
  }

  private findConnection(client: SupabaseClient, poolKey: string): PooledConnection | null {
    const pool = this.connections.get(poolKey)
    return pool?.find(c => c.client === client) || null
  }

  private initializeMetrics(poolKey: string): void {
    this.metrics.set(poolKey, this.getDefaultMetrics())
  }

  private getDefaultMetrics(): ConnectionMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      pooledConnections: 0,
      connectionCreations: 0,
      connectionReuses: 0,
      averageResponseTime: 0,
      lastActivity: Date.now(),
    }
  }

  private updateAverageResponseTime(poolKey: string): void {
    const pool = this.connections.get(poolKey)
    const metrics = this.metrics.get(poolKey)

    if (!pool || !metrics) return

    let totalTime = 0
    let count = 0

    for (const connection of pool) {
      for (const responseTime of connection.responseTimes) {
        totalTime += responseTime
        count++
      }
    }

    metrics.averageResponseTime = count > 0 ? totalTime / count : 0
    metrics.lastActivity = Date.now()
  }

  private performHealthCheck(): void {
    const now = Date.now()

    for (const [poolKey, pool] of this.connections.entries()) {
      // Remove dead connections
      for (let i = pool.length - 1; i >= 0; i--) {
        const connection = pool[i]
        const age = now - connection.createdAt
        const idleTime = now - connection.lastUsed

        // Remove old or excessively idle connections
        if (
          age > 24 * 60 * 60 * 1000 || // 24 hours
          idleTime > this.options.idleTimeout * 2
        ) {
          pool.splice(i, 1)
        }
      }

      // Update metrics
      const metrics = this.metrics.get(poolKey)
      if (metrics) {
        metrics.pooledConnections = pool.length
      }
    }

    // Clean up idle connections
    this.clearIdleConnections()
  }
}

// Export singleton instance
export const connectionPool = SupabaseConnectionPool.getInstance()

/**
 * Performance monitoring utilities
 */
export const ConnectionMonitor = {
  /**
   * Get comprehensive pool performance report
   */
  getPerformanceReport: () => {
    const metrics = connectionPool.getMetrics()
    const report: ConnectionPoolReport = {
      timestamp: new Date().toISOString(),
      pools: {},
    }

    for (const [poolType, poolMetrics] of Object.entries(metrics)) {
      report.pools[poolType] = {
        ...poolMetrics,
        averageResponseTimeMs: poolMetrics.averageResponseTime,
        recommendations: getConnectionRecommendations(poolMetrics),
      }
    }

    return report
  },

  /**
   * Check if connection pool is healthy
   */
  isHealthy: (): boolean => {
    const metrics = connectionPool.getMetrics()

    for (const poolMetrics of Object.values(metrics)) {
      if (poolMetrics.activeConnections > 50) {
        // Too many active connections
        return false
      }
      if (poolMetrics.averageResponseTime > 5000) {
        // Too slow
        return false
      }
    }

    return true
  },
}

function getConnectionRecommendations(metrics: ConnectionMetrics): string[] {
  const recommendations: string[] = []

  const connectionEfficiency = metrics.connectionReuses / (metrics.connectionCreations || 1)
  if (connectionEfficiency < 0.5) {
    recommendations.push('Low connection reuse - consider increasing connection pool size')
  }

  if (metrics.averageResponseTime > 1000) {
    recommendations.push('High response times - check network latency or query performance')
  }

  const poolUtilization = metrics.pooledConnections / 10 // Assuming max 10
  if (poolUtilization > 0.8) {
    recommendations.push('High pool utilization - consider increasing max connections')
  }

  return recommendations
}
