/**
 * Cache Manager
 *
 * Provides a unified caching interface with multiple backends,
 * TTL support, and cache invalidation strategies.
 */

import { logger } from '@/lib/monitoring/logger'
import { performanceMonitor } from '@/lib/performance/monitor'

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] // Cache tags for invalidation
  priority?: 'low' | 'medium' | 'high'
}

export interface CacheEntry<T = any> {
  value: T
  expiresAt: number
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  accessCount: number
  lastAccessed: number
}

/**
 * In-memory cache implementation with LRU eviction
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor(maxSize = 1000, cleanupIntervalMs = 60000) {
    this.maxSize = maxSize
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs)
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const startTime = Date.now()
    const now = startTime
    const ttl = options.ttl || 5 * 60 * 1000 // 5 minutes default

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const cacheEntry = {
      value,
      expiresAt: now + ttl,
      tags: options.tags || [],
      priority: options.priority || 'medium',
      accessCount: 1,
      lastAccessed: now,
    }

    this.cache.set(key, cacheEntry)

    const duration = Date.now() - startTime

    logger.debug(
      `Cache set operation`,
      {
        key,
        ttl,
        priority: cacheEntry.priority,
        tags: options.tags,
        cacheSize: this.cache.size,
        duration,
        operation: 'set',
      },
      ['cache', 'set']
    )

    performanceMonitor.recordMetric('cache_set_operation', duration, {
      operation: 'set',
      cacheSize: String(this.cache.size),
      ttl: String(ttl),
    })
  }

  get<T>(key: string): T | null {
    const startTime = Date.now()
    const entry = this.cache.get(key)

    if (!entry) {
      const duration = Date.now() - startTime

      logger.debug(
        `Cache miss`,
        {
          key,
          cacheSize: this.cache.size,
          duration,
          operation: 'get_miss',
        },
        ['cache', 'miss']
      )

      performanceMonitor.recordMetric('cache_get_operation', duration, {
        operation: 'get',
        hit: 'false',
        cacheSize: String(this.cache.size),
      })

      return null
    }

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)

      const duration = Date.now() - startTime

      logger.debug(
        `Cache expired`,
        {
          key,
          cacheSize: this.cache.size,
          expiredAt: entry.expiresAt,
          duration,
          operation: 'get_expired',
        },
        ['cache', 'expired']
      )

      performanceMonitor.recordMetric('cache_get_operation', duration, {
        operation: 'get',
        hit: 'false',
        expired: 'true',
        cacheSize: String(this.cache.size),
      })

      return null
    }

    // Update access stats
    entry.accessCount++
    entry.lastAccessed = now

    const duration = Date.now() - startTime

    logger.debug(
      `Cache hit`,
      {
        key,
        accessCount: entry.accessCount,
        ttl: entry.expiresAt - now,
        cacheSize: this.cache.size,
        duration,
        operation: 'get_hit',
      },
      ['cache', 'hit']
    )

    performanceMonitor.recordMetric('cache_get_operation', duration, {
      operation: 'get',
      hit: 'true',
      cacheSize: String(this.cache.size),
      accessCount: String(entry.accessCount),
    })

    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidateByTag(tag: string): number {
    let deleted = 0
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
        deleted++
      }
    }
    return deleted
  }

  invalidateByPattern(pattern: RegExp): number {
    let deleted = 0
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        deleted++
      }
    }
    return deleted
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let expired = 0
    let totalSize = 0
    let byPriority = { low: 0, medium: 0, high: 0 }

    for (const entry of this.cache.values()) {
      totalSize++
      if (now > entry.expiresAt) expired++
      byPriority[entry.priority]++
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expired,
      activeEntries: totalSize - expired,
      maxEntries: this.maxSize,
      hitRate: 0, // Would need tracking of misses
      byPriority,
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

/**
 * Cache manager with multiple cache backends
 */
export class CacheManager {
  private static instance: CacheManager
  private memoryCache: MemoryCache
  private defaultTTL: number

  private constructor(defaultTTL = 5 * 60 * 1000) {
    // 5 minutes
    this.memoryCache = new MemoryCache()
    this.defaultTTL = defaultTTL
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const finalOptions = {
      ttl: options.ttl || this.defaultTTL,
      ...options,
    }
    this.memoryCache.set(key, value, finalOptions)
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    return this.memoryCache.get<T>(key)
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.memoryCache.has(key)
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.memoryCache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear()
  }

  /**
   * Invalidate cache by tag
   */
  invalidateByTag(tag: string): number {
    return this.memoryCache.invalidateByTag(tag)
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    return this.memoryCache.invalidateByPattern(pattern)
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.memoryCache.getStats()
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    this.set(key, value, options)
    return value
  }

  /**
   * Memoize function with caching
   */
  memoize<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    getKey?: (...args: TArgs) => string,
    options: CacheOptions = {}
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = getKey ? getKey(...args) : JSON.stringify(args)

      return this.getOrSet(key, () => fn(...args), options)
    }
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    this.memoryCache.destroy()
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance()
