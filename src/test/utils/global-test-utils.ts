import {
  createMockTestDatabaseFixed as createMockTestDatabase,
  TestDatabase,
} from './test-database-fixed'
import { createRealtimeTestHarness } from './realtime-test-utils'
import { createPerformanceTestSuite, type PerformanceReport } from './performance-monitor'
import {
  measureAsyncPerformance,
  measureSyncPerformance,
  createPerformanceMonitor,
} from './performance-monitor'
import type {
  TestUserCreationData,
  TestApplication,
  TestCompany,
} from '@/integration/__tests__/types/integration-test.types'
import type {
  StrictGlobalTestUtils,
  PerformanceMonitor,
  MockApplicationRecord,
  MockCompanyRecord,
} from './test-utils.types'

export interface RealtimeEvent {
  id?: string
  event?: string
  schema?: string
  table?: string
  commit_timestamp?: string
  payload?: Record<string, unknown>
}

export interface GlobalTestUtils extends StrictGlobalTestUtils {
  createTestApplication: (
    userId: string,
    appData?: Partial<MockApplicationRecord>
  ) => Promise<TestApplication>
  createTestCompany: (companyData?: Partial<MockCompanyRecord>) => Promise<TestCompany>
}

export interface GlobalRealtimeHarness {
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: (
    event: string,
    schema: string,
    table: string,
    callback: (payload: Record<string, unknown>) => void,
    filter?: string
  ) => string
  unsubscribe: (subscriptionId: string) => void
  simulateEvent: (event: RealtimeEvent) => void
  publish: (channel: string, payload: Record<string, unknown>) => Promise<void>
  clearEvents: () => void
  getSubscriptionCount: () => number
  getConnectionStatus: () => boolean
  getEventCount: () => number
  getEvents: () => RealtimeEvent[]
  assertSubscriptionExists: (subscriptionId: string) => boolean
  simulateDisconnection: () => void
  simulateReconnection: () => Promise<void>
  assertEventReceived: (eventType: string, schema: string, table: string) => boolean
  waitForEvent: (eventType: string, timeoutMs?: number) => Promise<RealtimeEvent>
}

export interface GlobalPerformanceSuite {
  startMeasurement: (name: string) => void
  endMeasurement: (name: string) => void
  getReport: () => PerformanceReport
  cleanup: () => void
}

let testDatabaseInstance: TestDatabase | null = null
let realtimeHarnessInstance: GlobalRealtimeHarness | null = null
let performanceTestSuiteInstance: GlobalPerformanceSuite | null = null
let performanceMonitorInstance: PerformanceMonitor | null = null

export function setupGlobalTestUtils(): void {
  // Initialize test database (use mock for now to avoid external dependencies)
  testDatabaseInstance = createMockTestDatabase()

  // Initialize realtime harness with additional publish method
  const baseRealtimeHarness = createRealtimeTestHarness()
  realtimeHarnessInstance = {
    connect: baseRealtimeHarness.connect.bind(baseRealtimeHarness),
    disconnect: baseRealtimeHarness.disconnect.bind(baseRealtimeHarness),
    subscribe: baseRealtimeHarness.subscribe.bind(baseRealtimeHarness),
    unsubscribe: baseRealtimeHarness.unsubscribe.bind(baseRealtimeHarness),
    simulateEvent: baseRealtimeHarness.simulateEvent.bind(baseRealtimeHarness),
    clearEvents: baseRealtimeHarness.clearEvents.bind(baseRealtimeHarness),
    getSubscriptionCount: baseRealtimeHarness.getSubscriptionCount.bind(baseRealtimeHarness),
    getConnectionStatus: baseRealtimeHarness.getConnectionStatus.bind(baseRealtimeHarness),
    getEventCount: baseRealtimeHarness.getEventCount.bind(baseRealtimeHarness),
    getEvents: baseRealtimeHarness.getEvents.bind(baseRealtimeHarness),
    assertSubscriptionExists:
      baseRealtimeHarness.assertSubscriptionExists.bind(baseRealtimeHarness),
    simulateDisconnection: baseRealtimeHarness.simulateDisconnection.bind(baseRealtimeHarness),
    simulateReconnection: baseRealtimeHarness.simulateReconnection.bind(baseRealtimeHarness),
    assertEventReceived: baseRealtimeHarness.assertEventReceived.bind(baseRealtimeHarness),
    waitForEvent: baseRealtimeHarness.waitForEvent.bind(baseRealtimeHarness),
    async publish(channel: string, payload: Record<string, unknown>): Promise<void> {
      // Simulate publishing to a channel
      console.log(`📤 Publishing to ${channel}:`, payload)
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10))
    },
  }

  // Initialize performance test suite
  performanceTestSuiteInstance = createPerformanceTestSuite()

  // Initialize performance monitor for advanced metrics
  performanceMonitorInstance = createPerformanceMonitor({
    maxQueryTime: 500,
    minCacheHitRate: 70,
    maxConnectionPoolUsage: 90,
    maxMemoryGrowth: 50 * 1024 * 1024, // 50MB
  })

  // Create global performance utilities with all required methods
  const globalPerformanceUtils = {
    // Performance measurement methods
    measureAsync: async <T>(name: string, fn: () => Promise<T>, iterations = 1) => {
      // Record measurement in performance test suite
      performanceTestSuiteInstance?.startMeasurement(name)

      const result = await measureAsyncPerformance(name, fn, iterations)

      performanceTestSuiteInstance?.endMeasurement(name)

      return {
        result: result.results[result.results.length - 1], // Last result
        duration: result.averageTime,
      }
    },
    measureSync: <T>(name: string, fn: () => T, iterations = 1) => {
      // Record measurement in performance test suite
      performanceTestSuiteInstance?.startMeasurement(name)

      const result = measureSyncPerformance(name, fn, iterations)

      performanceTestSuiteInstance?.endMeasurement(name)

      return {
        result: result.results[result.results.length - 1], // Last result
        duration: result.averageTime,
      }
    },

    // Performance monitor methods
    startMonitoring: () => performanceMonitorInstance?.startMonitoring(1000),
    stopMonitoring: () => performanceMonitorInstance?.stopMonitoring(),
    getMetrics: () => performanceMonitorInstance?.getMetrics() || [],
    getAlerts: () => performanceMonitorInstance?.getAlerts() || [],
    getPerformanceReport: () =>
      performanceMonitorInstance?.getReport() || {
        metrics: [],
        alerts: [],
        summary: {
          totalMetrics: 0,
          totalAlerts: 0,
          monitoringDuration: 0,
          averageQueryTime: 0,
          averageCacheHitRate: 0,
          averageConnectionPoolUsage: 0,
          memoryGrowth: 0,
        },
        thresholds: {
          maxQueryTime: 1000,
          minCacheHitRate: 80,
          maxConnectionPoolUsage: 80,
          maxMemoryGrowth: 100 * 1024 * 1024,
        },
      },

    // Memory snapshot functionality
    memorySnapshots: [] as number[],
    takeMemorySnapshot: () => {
      const memoryUsage = performanceMonitorInstance?.getMetrics().slice(-1)[0]?.memoryUsage || 0
      globalPerformanceUtils.memorySnapshots.push(memoryUsage)
      // Keep only last 10 snapshots
      if (globalPerformanceUtils.memorySnapshots.length > 10) {
        globalPerformanceUtils.memorySnapshots = globalPerformanceUtils.memorySnapshots.slice(-10)
      }
    },

    // Performance assertion methods
    assertPerformanceThreshold: (operationName: string, thresholdMs: number) => {
      // Check performance test suite measurements first
      if (performanceTestSuiteInstance) {
        const report = performanceTestSuiteInstance.getReport()
        if (report[operationName]) {
          const duration = report[operationName].duration
          if (duration > thresholdMs) {
            throw new Error(
              `Performance threshold exceeded for ${operationName}: ${duration}ms > ${thresholdMs}ms`
            )
          }
          console.log(
            `✅ Performance threshold passed for ${operationName}: ${duration}ms <= ${thresholdMs}ms`
          )
          return
        }
      }

      // Fallback to performance monitor metrics
      const report = performanceMonitorInstance?.getReport()
      const latestMetrics = report?.metrics.slice(-1)[0]

      if (!latestMetrics) {
        console.warn(`⚠️ No metrics available for ${operationName}`)
        return
      }

      if (latestMetrics.queryTime > thresholdMs) {
        throw new Error(
          `Performance threshold exceeded for ${operationName}: ${latestMetrics.queryTime}ms > ${thresholdMs}ms`
        )
      }

      console.log(
        `✅ Performance threshold passed for ${operationName}: ${latestMetrics.queryTime}ms <= ${thresholdMs}ms`
      )
    },

    assertMemoryThreshold: (thresholdBytes: number) => {
      const snapshots = globalPerformanceUtils.memorySnapshots
      if (snapshots.length < 2) {
        console.warn('⚠️ Insufficient memory snapshots for comparison')
        return
      }

      const memoryGrowth = snapshots[snapshots.length - 1] - snapshots[0]
      if (memoryGrowth > thresholdBytes) {
        throw new Error(
          `Memory threshold exceeded: ${memoryGrowth} bytes > ${thresholdBytes} bytes`
        )
      }

      console.log(`✅ Memory threshold passed: ${memoryGrowth} bytes <= ${thresholdBytes} bytes`)
    },

    // Reset method
    reset: () => {
      performanceMonitorInstance?.reset()
      globalPerformanceUtils.memorySnapshots = []
    },
  }

  // Create global testUtils object
  const globalTestUtils: GlobalTestUtils = {
    getTestDatabase(): TestDatabase {
      if (!testDatabaseInstance) {
        throw new Error('Test database not initialized')
      }
      return testDatabaseInstance
    },

    getPerformanceMonitor(): PerformanceMonitor {
      if (!performanceMonitorInstance) {
        throw new Error('Performance monitor not initialized')
      }
      return performanceMonitorInstance
    },

    async createTestUser(userData: Partial<TestUserCreationData> = {}) {
      const db = globalTestUtils.getTestDatabase()
      return await db.createUser(userData)
    },

    async createTestApplication(userId: string, appData: Partial<MockApplicationRecord> = {}) {
      const db = globalTestUtils.getTestDatabase()
      return await db.createApplication(userId, appData)
    },

    async createTestCompany(companyData: Partial<MockCompanyRecord> = {}) {
      const db = globalTestUtils.getTestDatabase()
      return await db.createCompany(companyData)
    },

    wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

    async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
      const start = Date.now()
      const result = await fn()
      const duration = Date.now() - start
      return { result, duration }
    },
  }

  // Assign to global object
  Object.assign(global, {
    testUtils: globalTestUtils,
    testRealtimeHarness: realtimeHarnessInstance,
    performanceTestSuite: performanceTestSuiteInstance,
    performanceUtils: globalPerformanceUtils,
  })

  // Define interface for test storage utilities
  interface _TestStorage {
    clearAllStorage: () => void
    getLocalStorage: () => Record<string, string>
    getSessionStorage: () => Record<string, string>
    setLocalStorage: (store: Record<string, string>) => void
    setSessionStorage: (store: Record<string, string>) => void
    simulateSessionStorageQuotaExceeded: () => void
    getObjectURLs: () => string[]
    clearObjectURLs: () => void
  }

  // Setup test storage utilities if they exist
  if (typeof global.testStorage === 'undefined') {
    global.testStorage = {
      clearAllStorage: () => {
        if (typeof localStorage !== 'undefined') localStorage.clear()
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
      },
      getLocalStorage: () => {
        const store: Record<string, string> = {}
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key) store[key] = localStorage.getItem(key) || ''
          }
        }
        return store
      },
      getSessionStorage: () => {
        const store: Record<string, string> = {}
        if (typeof sessionStorage !== 'undefined') {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key) store[key] = sessionStorage.getItem(key) || ''
          }
        }
        return store
      },
      setLocalStorage: (store: Record<string, string>) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear()
          Object.entries(store).forEach(([key, value]) => {
            localStorage.setItem(key, value)
          })
        }
      },
      setSessionStorage: (store: Record<string, string>) => {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear()
          Object.entries(store).forEach(([key, value]) => {
            sessionStorage.setItem(key, value)
          })
        }
      },
      simulateSessionStorageQuotaExceeded: () => {
        const error = new Error('SessionStorage is full')
        Object.defineProperty(error, 'name', { value: 'QuotaExceededError' })
        throw error
      },
      getObjectURLs: () => [],
      clearObjectURLs: () => {},
    }
  }

  console.log('✅ Global test utilities initialized')
}

// No global declarations needed - they are already defined elsewhere

// Interface exports are already available above
