import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type {
  MockLogMetadata,
  MockLogEntry,
  MockLoggerConfig,
  AggregatedLogData,
  LogPattern,
  LogAlert,
} from '@/types/monitoring'

// Mock logging system
class MockLogger {
  private logs: MockLogEntry[] = []

  private config: MockLoggerConfig = {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    maxLogSize: 1000,
    logRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
  }

  debug(message: string, metadata?: MockLogMetadata): void {
    this.log('debug', message, metadata)
  }

  info(message: string, metadata?: MockLogMetadata): void {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata?: MockLogMetadata): void {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata?: MockLogMetadata): void {
    this.log('error', message, metadata)
  }

  private log(level: string, message: string, metadata?: MockLogMetadata): void {
    const logEntry = {
      level: level as 'debug' | 'info' | 'warn' | 'error',
      message,
      timestamp: Date.now(),
      metadata,
    }

    // Filter by log level
    if (!this.shouldLog(logEntry.level)) {
      return
    }

    // Add to memory logs
    this.logs.push(logEntry)

    // Maintain max log size
    if (this.logs.length > this.config.maxLogSize) {
      this.logs = this.logs.slice(-this.config.maxLogSize)
    }

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry)
    }

    // Output to file if enabled (mocked)
    if (this.config.enableFile) {
      this.outputToFile(logEntry)
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.config.level)
    const logLevelIndex = levels.indexOf(level)
    return logLevelIndex >= currentLevelIndex
  }

  private outputToConsole(logEntry: MockLogEntry): void {
    const timestamp = new Date(logEntry.timestamp).toISOString()
    const logMessage = `[${timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`

    switch (logEntry.level) {
      case 'debug':
        console.debug(logMessage, logEntry.metadata || '')
        break
      case 'info':
        console.info(logMessage, logEntry.metadata || '')
        break
      case 'warn':
        console.warn(logMessage, logEntry.metadata || '')
        break
      case 'error':
        console.error(logMessage, logEntry.metadata || '')
        break
    }
  }

  private outputToFile(logEntry: MockLogEntry): void {
    // Mock file output
    // In real implementation, this would write to a log file
    console.log(`FILE LOG: ${JSON.stringify(logEntry)}`)
  }

  getLogs(level?: string): MockLogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }

  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.config.level = level
  }

  setConfig(config: Partial<MockLoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): MockLoggerConfig {
    return { ...this.config }
  }

  // Advanced logging features
  createChildLogger(context: string): MockLogger {
    const child = new MockLogger()
    child.config = { ...this.config }

    // Override log method to add context
    child.log = (level: string, message: string, metadata?: MockLogMetadata) => {
      const contextualizedMessage = `[${context}] ${message}`
      MockLogger.prototype.log.call(child, level, contextualizedMessage, metadata)
    }

    return child
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: MockLogMetadata): void {
    this.info(`Performance: ${operation}`, {
      duration,
      operation,
      ...metadata,
    })
  }

  // Error logging with stack traces
  logError(error: Error, context?: string): void {
    this.error(error.message, {
      stack: error.stack,
      context,
      name: error.name,
    })
  }

  // Structured logging
  logStructured(
    event: string,
    data: unknown,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info'
  ): void {
    this.log(level, event, {
      structuredLog: true,
      eventData: data,
      timestamp: new Date().toISOString(),
    })
  }
}

// Mock log aggregator
class MockLogAggregator {
  private aggregatedLogs: Map<string, AggregatedLogData> = new Map()

  private patterns: LogPattern[] = []

  addLogPattern(
    name: string,
    pattern: RegExp,
    action: (match: RegExpMatchArray, log: unknown) => void
  ): void {
    this.patterns.push({ name, pattern, action })
  }

  aggregateLog(log: unknown): void {
    const logEntry = log as MockLogEntry
    const key = this.generateLogKey(log)

    if (!this.aggregatedLogs.has(key)) {
      this.aggregatedLogs.set(key, {
        count: 0,
        firstSeen: logEntry.timestamp,
        lastSeen: logEntry.timestamp,
        samples: [],
        metadata: { level: logEntry.level, message: logEntry.message },
      })
    }

    const aggregated = this.aggregatedLogs.get(key)!
    aggregated.count++
    aggregated.lastSeen = logEntry.timestamp

    // Keep only last few samples
    if (aggregated.samples.length < 5) {
      aggregated.samples.push(log)
    } else {
      aggregated.samples = [...aggregated.samples.slice(1), log]
    }

    // Apply patterns
    this.applyPatterns(log)
  }

  private generateLogKey(log: unknown): string {
    // Simple key generation based on message pattern
    const logEntry = log as MockLogEntry
    return `${logEntry.level}:${logEntry.message.split(' ')[0]}`
  }

  private applyPatterns(log: unknown): void {
    const logEntry = log as MockLogEntry
    for (const pattern of this.patterns) {
      const match = logEntry.message.match(pattern.pattern)
      if (match) {
        pattern.action(match, log)
      }
    }
  }

  getAggregatedLogs(): Array<{
    key: string
    aggregation: AggregatedLogData
  }> {
    return Array.from(this.aggregatedLogs.entries()).map(([key, aggregation]) => ({
      key,
      aggregation,
    }))
  }

  clearAggregation(): void {
    this.aggregatedLogs.clear()
  }

  // Generate alerts based on aggregation
  generateAlerts(): LogAlert[] {
    const alerts: LogAlert[] = []

    for (const [key, aggregation] of this.aggregatedLogs.entries()) {
      // High frequency alerts
      if (aggregation.count > 100) {
        alerts.push({
          type: 'high_frequency_logs',
          message: `High frequency logs detected: ${key} (${aggregation.count} occurrences)`,
          severity: 'high',
          data: aggregation,
        })
      }

      // Error rate alerts
      if (aggregation.metadata.level === 'error' && aggregation.count > 10) {
        alerts.push({
          type: 'high_error_rate',
          message: `High error rate detected: ${key} (${aggregation.count} errors)`,
          severity: 'critical',
          data: aggregation,
        })
      }

      // Sustained logging alerts
      const duration = aggregation.lastSeen - aggregation.firstSeen
      if (duration > 60 * 1000 && aggregation.count > 50) {
        // 1 minute with >50 logs
        alerts.push({
          type: 'sustained_logging',
          message: `Sustained high volume logging: ${key}`,
          severity: 'medium',
          data: aggregation,
        })
      }
    }

    return alerts
  }
}

describe('Logging System Tests', () => {
  let logger: MockLogger
  let aggregator: MockLogAggregator
  let originalConsole: typeof console

  beforeEach(() => {
    logger = new MockLogger()
    aggregator = new MockLogAggregator()

    // Mock console methods to capture output
    originalConsole = global.console
    global.console = {
      ...originalConsole,
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    } as typeof console
  })

  afterEach(() => {
    global.console = originalConsole
  })

  describe('Basic Logging Functionality', () => {
    it('should log messages at different levels', () => {
      // Configure logger to accept debug messages
      logger.setConfig({ level: 'debug' })

      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(4)

      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe('Debug message')

      expect(logs[1].level).toBe('info')
      expect(logs[1].message).toBe('Info message')

      expect(logs[2].level).toBe('warn')
      expect(logs[2].message).toBe('Warning message')

      expect(logs[3].level).toBe('error')
      expect(logs[3].message).toBe('Error message')
    })

    it('should filter logs by configured level', () => {
      logger.setLevel('warn')

      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(2) // Only warn and error should be logged

      expect(logs.every(log => log.level === 'warn' || log.level === 'error')).toBe(true)
    })

    it('should include metadata in logs', () => {
      const metadata = { userId: '123', action: 'login' }
      logger.info('User action', metadata)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].metadata).toEqual(metadata)
    })

    it('should include timestamps in logs', () => {
      const beforeTime = Date.now()
      logger.info('Timestamp test')
      const afterTime = Date.now()

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(logs[0].timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('Console Output', () => {
    it('should output to console when enabled', () => {
      logger.setConfig({ enableConsole: true })

      logger.info('Console test message')

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Console test message'),
        ''
      )
    })

    it('should not output to console when disabled', () => {
      logger.setConfig({ enableConsole: false })

      logger.info('Silent message')

      expect(console.info).not.toHaveBeenCalled()
    })

    it('should format console messages correctly', () => {
      logger.setConfig({ enableConsole: true })

      const testMessage = 'Test message'
      logger.error(testMessage, { error: 'details' })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] ERROR: Test message$/
        ),
        { error: 'details' }
      )
    })
  })

  describe('Log Management', () => {
    it('should maintain maximum log size', () => {
      logger.setConfig({ maxLogSize: 5 })

      // Add more logs than the maximum
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`)
      }

      const logs = logger.getLogs()
      expect(logs).toHaveLength(5)
      expect(logs[0].message).toBe('Message 5') // Should keep the last 5
      expect(logs[4].message).toBe('Message 9')
    })

    it('should clear logs', () => {
      logger.info('Test message 1')
      logger.info('Test message 2')

      expect(logger.getLogs()).toHaveLength(2)

      logger.clearLogs()

      expect(logger.getLogs()).toHaveLength(0)
    })

    it('should filter logs by level', () => {
      logger.debug('Debug 1')
      logger.info('Info 1')
      logger.info('Info 2')
      logger.warn('Warning 1')
      logger.error('Error 1')

      const infoLogs = logger.getLogs('info')
      expect(infoLogs).toHaveLength(2)
      expect(infoLogs.every(log => log.level === 'info')).toBe(true)

      const errorLogs = logger.getLogs('error')
      expect(errorLogs).toHaveLength(1)
      expect(errorLogs[0].level).toBe('error')
    })
  })

  describe('Child Loggers', () => {
    it('should create child loggers with context', () => {
      const childLogger = logger.createChildLogger('UserService')

      childLogger.info('User created')

      const logs = childLogger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('[UserService] User created')
    })

    it('should inherit configuration from parent', () => {
      logger.setLevel('warn')
      logger.setConfig({ enableConsole: false })

      const childLogger = logger.createChildLogger('TestContext')
      childLogger.info('This should not appear')
      childLogger.warn('This should appear')

      const logs = childLogger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('warn')
    })
  })

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      logger.logPerformance('database_query', 150, { query: 'SELECT * FROM users' })

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
      expect(logs[0].metadata).toEqual({
        duration: 150,
        operation: 'database_query',
        query: 'SELECT * FROM users',
      })
    })

    it('should handle slow operations', () => {
      logger.logPerformance('slow_operation', 5000, { complexity: 'high' })

      const logs = logger.getLogs()
      expect(logs[0].message).toBe('Performance: slow_operation')
      expect(logs[0].metadata?.duration).toBe(5000)
    })
  })

  describe('Error Logging', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:10:5'

      logger.logError(error, 'TestContext')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toBe('Test error')
      expect(logs[0].metadata).toEqual({
        stack: 'Error: Test error\n    at test.js:10:5',
        context: 'TestContext',
        name: 'Error',
      })
    })
  })

  describe('Structured Logging', () => {
    it('should log structured events', () => {
      logger.logStructured('user_login', {
        userId: '123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      })

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('user_login')
      expect(logs[0].metadata).toEqual({
        structuredLog: true,
        eventData: {
          userId: '123',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
        },
        timestamp: expect.any(String),
      })
    })
  })

  describe('Log Aggregation', () => {
    beforeEach(() => {
      logger.setConfig({ enableConsole: false })
    })

    it('should aggregate similar logs', () => {
      const logs = [
        { level: 'error', message: 'Database connection failed', timestamp: Date.now() },
        { level: 'error', message: 'Database connection failed', timestamp: Date.now() + 1000 },
        { level: 'info', message: 'User logged in', timestamp: Date.now() + 2000 },
        { level: 'error', message: 'Database connection failed', timestamp: Date.now() + 3000 },
      ]

      logs.forEach(log => aggregator.aggregateLog(log))

      const aggregated = aggregator.getAggregatedLogs()
      expect(aggregated).toHaveLength(2) // error and info

      const errorAggregation = aggregated.find(a => a.key.includes('error'))
      expect(errorAggregation?.aggregation.count).toBe(3)
    })

    it('should generate alerts based on aggregation', () => {
      // Generate high frequency error logs
      for (let i = 0; i < 150; i++) {
        aggregator.aggregateLog({
          level: 'error',
          message: 'High frequency error',
          timestamp: Date.now() + i * 100,
        })
      }

      const alerts = aggregator.generateAlerts()
      expect(alerts.length).toBeGreaterThan(0)

      const highFrequencyAlert = alerts.find(a => a.type === 'high_frequency_logs')
      expect(highFrequencyAlert).toBeDefined()
      expect(highFrequencyAlert?.severity).toBe('high')
    })

    it('should detect sustained high volume logging', () => {
      const baseTime = Date.now()

      // Generate sustained high volume logs over 2 minutes
      for (let i = 0; i < 120; i++) {
        aggregator.aggregateLog({
          level: 'warn',
          message: 'System warning',
          timestamp: baseTime + i * 1000, // 1 second apart
        })
      }

      const alerts = aggregator.generateAlerts()
      const sustainedAlert = alerts.find(a => a.type === 'sustained_logging')
      expect(sustainedAlert).toBeDefined()
      expect(sustainedAlert?.severity).toBe('medium')
    })
  })

  describe('Log Patterns', () => {
    it('should apply log patterns for analysis', () => {
      let patternMatches = 0

      aggregator.addLogPattern('error_codes', /Error code (\d+)/, (_match, _log) => {
        patternMatches++
      })

      const testLogs = [
        { level: 'error', message: 'Error code 404: Not found', timestamp: Date.now() },
        { level: 'error', message: 'Error code 500: Server error', timestamp: Date.now() },
        { level: 'error', message: 'Error code 404: Not found', timestamp: Date.now() },
      ]

      testLogs.forEach(log => aggregator.aggregateLog(log))

      expect(patternMatches).toBe(3) // Three error codes total (2x404, 1x500)
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should integrate with performance monitoring', async () => {
      const performanceLogger = logger.createChildLogger('Performance')

      // Simulate performance measurements
      const measurements = [
        { operation: 'database_query', duration: 50 },
        { operation: 'api_request', duration: 200 },
        { operation: 'cache_hit', duration: 5 },
        { operation: 'slow_query', duration: 1500 },
      ]

      measurements.forEach(({ operation, duration }) => {
        performanceLogger.logPerformance(operation, duration)
      })

      const logs = performanceLogger.getLogs()
      expect(logs).toHaveLength(4)

      const slowOperation = logs.find(
        log =>
          log.metadata &&
          'duration' in log.metadata &&
          typeof log.metadata.duration === 'number' &&
          log.metadata.duration > 1000
      )
      expect(slowOperation).toBeDefined()
      expect(
        slowOperation?.metadata && 'operation' in slowOperation.metadata
          ? slowOperation.metadata.operation
          : undefined
      ).toBe('slow_query')
    })
  })

  describe('Security and Privacy', () => {
    it('should handle sensitive data in logs', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      // Log should include data but in real implementation, this should be sanitized
      logger.info('User login attempt', sensitiveData)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].metadata?.email).toBe('user@example.com')

      // In production, sensitive data should be masked or omitted
      // This test verifies the logging structure works
    })

    it('should handle large metadata objects', () => {
      const largeMetadata = {
        data: 'x'.repeat(10000), // 10KB
        nested: {
          deep: {
            value: 'test',
          },
        },
      }

      logger.info('Large metadata test', largeMetadata)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].metadata?.data).toHaveLength(10000)
    })
  })

  describe('Configuration Management', () => {
    it('should update configuration at runtime', () => {
      logger.info('Test message 1')

      logger.setConfig({ level: 'error', enableConsole: false })

      logger.info('Test message 2')
      logger.error('Test message 3')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(2) // Only the first info and the error
      expect(logs[0].message).toBe('Test message 1')
      expect(logs[1].message).toBe('Test message 3')
    })

    it('should retrieve current configuration', () => {
      const customConfig = {
        level: 'warn' as const,
        enableConsole: false,
        enableFile: true,
        maxLogSize: 500,
      }

      logger.setConfig(customConfig)
      const currentConfig = logger.getConfig()

      expect(currentConfig.level).toBe('warn')
      expect(currentConfig.enableConsole).toBe(false)
      expect(currentConfig.enableFile).toBe(true)
      expect(currentConfig.maxLogSize).toBe(500)
    })
  })
})
