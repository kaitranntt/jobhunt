import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'

// Performance monitoring utilities
class PerformanceTestSuite {
  private measurements: Map<string, number[]> = new Map()
  private memorySnapshots: number[] = []

  startMeasurement(name: string): void {
    performance.mark(`${name}-start`)
  }

  endMeasurement(name: string): number {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)

    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure.duration

    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    this.measurements.get(name)!.push(duration)

    return duration
  }

  takeMemorySnapshot(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage()
      this.memorySnapshots.push(memory.heapUsed)
    }
  }

  getAverageMeasurement(name: string): number {
    const measurements = this.measurements.get(name) || []
    return measurements.length > 0
      ? measurements.reduce((a, b) => a + b, 0) / measurements.length
      : 0
  }

  getMemoryGrowth(): number {
    if (this.memorySnapshots.length < 2) return 0
    const first = this.memorySnapshots[0]
    const last = this.memorySnapshots[this.memorySnapshots.length - 1]
    return last - first
  }

  reset(): void {
    this.measurements.clear()
    this.memorySnapshots = []
    performance.clearMarks()
    performance.clearMeasures()
  }

  getReport(): Record<string, any> {
    const report: Record<string, any> = {}

    for (const [name, measurements] of this.measurements.entries()) {
      report[name] = {
        count: measurements.length,
        average: this.getAverageMeasurement(name),
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        median: this.getMedian(measurements),
        p95: this.getPercentile(measurements, 95),
        p99: this.getPercentile(measurements, 99),
      }
    }

    if (this.memorySnapshots.length > 0) {
      report.memory = {
        snapshots: this.memorySnapshots.length,
        growth: this.getMemoryGrowth(),
        peak: Math.max(...this.memorySnapshots),
        average: this.memorySnapshots.reduce((a, b) => a + b, 0) / this.memorySnapshots.length,
      }
    }

    return report
  }

  private getMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  private getPercentile(numbers: number[], percentile: number): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index]
  }
}

// Global performance test instance
let performanceTestSuite: PerformanceTestSuite

beforeAll(() => {
  console.log('⚡ Setting up performance test environment...')

  performanceTestSuite = new PerformanceTestSuite()

  // Mock timers for consistent performance testing
  vi.useFakeTimers()

  // Setup performance monitoring
  global.performanceTestSuite = performanceTestSuite

  console.log('✅ Performance test environment ready')
})

beforeEach(() => {
  performanceTestSuite.reset()
  vi.clearAllMocks()
})

afterEach(() => {
  // Clean up any lingering resources
  vi.runAllTimers()
})

afterAll(() => {
  console.log('📊 Performance test report:')
  console.log(JSON.stringify(performanceTestSuite.getReport(), null, 2))

  // Restore real timers
  vi.useRealTimers()
})

// Global performance utilities
global.performanceUtils = {
  measureAsync: async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> => {
    performanceTestSuite.startMeasurement(name)
    const result = await fn()
    const duration = performanceTestSuite.endMeasurement(name)
    return { result, duration }
  },

  measureSync: <T>(name: string, fn: () => T): { result: T; duration: number } => {
    performanceTestSuite.startMeasurement(name)
    const result = fn()
    const duration = performanceTestSuite.endMeasurement(name)
    return { result, duration }
  },

  takeMemorySnapshot: () => {
    performanceTestSuite.takeMemorySnapshot()
  },

  getPerformanceReport: () => {
    return performanceTestSuite.getReport()
  },

  assertPerformanceThreshold: (name: string, threshold: number) => {
    const avg = performanceTestSuite.getAverageMeasurement(name)
    if (avg > threshold) {
      throw new Error(`Performance threshold exceeded for ${name}: ${avg}ms > ${threshold}ms`)
    }
  },

  assertMemoryThreshold: (threshold: number) => {
    const growth = performanceTestSuite.getMemoryGrowth()
    if (growth > threshold) {
      throw new Error(`Memory growth threshold exceeded: ${growth} bytes > ${threshold} bytes`)
    }
  },
}

declare global {
  var performanceTestSuite: PerformanceTestSuite
  var performanceUtils: {
    measureAsync: <T>(
      name: string,
      fn: () => Promise<T>
    ) => Promise<{ result: T; duration: number }>
    measureSync: <T>(name: string, fn: () => T) => { result: T; duration: number }
    takeMemorySnapshot: () => void
    getPerformanceReport: () => Record<string, any>
    assertPerformanceThreshold: (name: string, threshold: number) => void
    assertMemoryThreshold: (threshold: number) => void
  }
}
