/**
 * Logger Infrastructure
 *
 * Comprehensive logging system with structured logging,
 * multiple log levels, and performance monitoring integration.
 */

import { performanceMonitor } from '@/lib/performance/monitor'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
  tags?: string[]
  component?: string
  action?: string
  metrics?: Record<string, number>
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  maxLogSize: number
  bufferSize: number
  flushInterval: number
  remoteEndpoint?: string
  excludeFields?: string[]
}

export interface LogFilter {
  level?: LogLevel
  component?: string
  userId?: string
  sessionId?: string
  tags?: string[]
  startTime?: number
  endTime?: number
  search?: string
  limit?: number
}

/**
 * Logger class with structured logging capabilities
 */
export class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private buffer: LogEntry[] = []
  private flushTimer: ReturnType<typeof setInterval>
  private logCount = 0
  private errorCount = 0
  private warnCount = 0

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      maxLogSize: 10000,
      bufferSize: 1000,
      flushInterval: 30000, // 30 seconds
      ...config,
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config)
    }
    return Logger.instance
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log(LogLevel.DEBUG, message, context, tags)
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log(LogLevel.INFO, message, context, tags)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log(LogLevel.WARN, message, context, tags)
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error | Record<string, any>,
    context?: Record<string, any>,
    tags?: string[]
  ): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : error),
    }
    this.log(LogLevel.ERROR, message, errorContext, tags)
  }

  /**
   * Log fatal error message
   */
  fatal(
    message: string,
    error?: Error | Record<string, any>,
    context?: Record<string, any>,
    tags?: string[]
  ): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : error),
    }
    this.log(LogLevel.FATAL, message, errorContext, tags)
  }

  /**
   * Log performance metric
   */
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(
      `Performance: ${operation}`,
      {
        ...context,
        duration,
        performanceMetric: true,
        operation,
      },
      ['performance']
    )

    // Record in performance monitor
    performanceMonitor.recordMetric(`operation_${operation}`, duration, {
      category: 'performance',
    })
  }

  /**
   * Log API request
   */
  apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, any>
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO
    const message = `${method} ${url} ${statusCode} - ${duration}ms`

    this.log(
      level,
      message,
      {
        ...context,
        method,
        url,
        statusCode,
        duration,
        apiRequest: true,
      },
      ['api', 'request']
    )

    // Record in performance monitor
    performanceMonitor.recordAPIRequest(duration, statusCode)
  }

  /**
   * Log database query
   */
  databaseQuery(
    query: string,
    duration: number,
    success: boolean,
    context?: Record<string, any>
  ): void {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR
    const message = `DB Query ${success ? 'success' : 'failed'}: ${query.substring(0, 100)}... - ${duration}ms`

    this.log(
      level,
      message,
      {
        ...context,
        query: query.substring(0, 500), // Limit query length
        duration,
        success,
        databaseQuery: true,
      },
      ['database', 'query']
    )

    // Record in performance monitor
    performanceMonitor.recordDatabaseQuery(duration, success)
  }

  /**
   * Log user action
   */
  userAction(action: string, context?: Record<string, any>): void {
    this.info(
      `User Action: ${action}`,
      {
        ...context,
        userAction: true,
        action,
      },
      ['user', 'action']
    )
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>, component?: string): ChildLogger {
    return new ChildLogger(this, context, component)
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  /**
   * Get logs with filtering
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    let logs = [...this.buffer]

    if (filter) {
      if (filter.level !== undefined) {
        logs = logs.filter(log => log.level >= filter.level!)
      }

      if (filter.component) {
        logs = logs.filter(log => log.component === filter.component)
      }

      if (filter.userId) {
        logs = logs.filter(log => log.userId === filter.userId)
      }

      if (filter.sessionId) {
        logs = logs.filter(log => log.sessionId === filter.sessionId)
      }

      if (filter.tags && filter.tags.length > 0) {
        logs = logs.filter(log => filter.tags!.some(tag => log.tags?.includes(tag)))
      }

      if (filter.startTime) {
        logs = logs.filter(log => log.timestamp >= filter.startTime!)
      }

      if (filter.endTime) {
        logs = logs.filter(log => log.timestamp <= filter.endTime!)
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        logs = logs.filter(
          log =>
            log.message.toLowerCase().includes(searchLower) ||
            JSON.stringify(log.context).toLowerCase().includes(searchLower)
        )
      }

      if (filter.limit && filter.limit > 0) {
        logs = logs.slice(0, filter.limit)
      }
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get log statistics
   */
  getStats(): {
    totalLogs: number
    errorCount: number
    warnCount: number
    bufferSize: number
    uptime: number
    logsByLevel: Record<LogLevel, number>
    logsByComponent: Record<string, number>
  } {
    const logsByLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0,
    }

    const logsByComponent: Record<string, number> = {}

    for (const log of this.buffer) {
      logsByLevel[log.level]++

      if (log.component) {
        logsByComponent[log.component] = (logsByComponent[log.component] || 0) + 1
      }
    }

    return {
      totalLogs: this.logCount,
      errorCount: this.errorCount,
      warnCount: this.warnCount,
      bufferSize: this.buffer.length,
      uptime: Date.now() - (this.buffer[0]?.timestamp || Date.now()),
      logsByLevel,
      logsByComponent,
    }
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.buffer = []
    this.logCount = 0
    this.errorCount = 0
    this.warnCount = 0
  }

  /**
   * Force flush logs
   */
  flush(): Promise<void> {
    return new Promise(resolve => {
      if (this.buffer.length === 0) {
        resolve()
        return
      }

      const logsToFlush = [...this.buffer]

      // Send to remote endpoint if configured
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        this.sendToRemote(logsToFlush).catch(error => {
          console.error('Failed to send logs to remote endpoint:', error)
        })
      }

      // Clear buffer
      this.buffer = []
      resolve()
    })
  }

  /**
   * Destroy logger
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }

  // Private methods

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    tags?: string[]
  ): void {
    if (level < this.config.level) return

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      message,
      context: this.sanitizeContext(context),
      tags: tags || [],
      metrics: this.extractMetrics(context),
    }

    // Add to buffer
    this.buffer.push(logEntry)
    this.logCount++

    if (level >= LogLevel.ERROR) {
      this.errorCount++
    }
    if (level === LogLevel.WARN) {
      this.warnCount++
    }

    // Maintain buffer size
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer = this.buffer.slice(-this.config.bufferSize)
    }

    // Console output if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry)
    }

    // Auto-flush for high-severity logs
    if (level >= LogLevel.ERROR) {
      this.flush().catch(console.error)
    }
  }

  private generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined

    const sanitized = { ...context }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    // Remove excluded fields
    if (this.config.excludeFields) {
      for (const field of this.config.excludeFields) {
        delete sanitized[field]
      }
    }

    return sanitized
  }

  private extractMetrics(context?: Record<string, any>): Record<string, number> | undefined {
    if (!context) return undefined

    const metrics: Record<string, number> = {}

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'number') {
        metrics[key] = value
      }
    }

    return Object.keys(metrics).length > 0 ? metrics : undefined
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const levelName = LogLevel[entry.level].padEnd(5)
    const component = entry.component ? `[${entry.component}]` : ''
    const message = `${timestamp} ${levelName} ${component} ${entry.message}`

    const logData = {
      id: entry.id,
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      context: entry.context,
      tags: entry.tags,
      metrics: entry.metrics,
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, logData)
        break
      case LogLevel.INFO:
        console.info(message, logData)
        break
      case LogLevel.WARN:
        console.warn(message, logData)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, logData)
        break
    }
  }

  private async sendToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          source: 'jobhunt-frontend',
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error)
    }
  }
}

/**
 * Child logger with pre-configured context
 */
export class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Record<string, any>,
    private component?: string
  ) {}

  debug(message: string, additionalContext?: Record<string, any>, tags?: string[]): void {
    this.parent.debug(message, { ...this.context, ...additionalContext }, tags)
  }

  info(message: string, additionalContext?: Record<string, any>, tags?: string[]): void {
    this.parent.info(message, { ...this.context, ...additionalContext }, tags)
  }

  warn(message: string, additionalContext?: Record<string, any>, tags?: string[]): void {
    this.parent.warn(message, { ...this.context, ...additionalContext }, tags)
  }

  error(
    message: string,
    error?: Error | Record<string, any>,
    additionalContext?: Record<string, any>,
    tags?: string[]
  ): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext }, tags)
  }

  fatal(
    message: string,
    error?: Error | Record<string, any>,
    additionalContext?: Record<string, any>,
    tags?: string[]
  ): void {
    this.parent.fatal(message, error, { ...this.context, ...additionalContext }, tags)
  }

  performance(operation: string, duration: number, additionalContext?: Record<string, any>): void {
    this.parent.performance(operation, duration, { ...this.context, ...additionalContext })
  }

  apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    additionalContext?: Record<string, any>
  ): void {
    this.parent.apiRequest(method, url, statusCode, duration, {
      ...this.context,
      ...additionalContext,
    })
  }

  databaseQuery(
    query: string,
    duration: number,
    success: boolean,
    additionalContext?: Record<string, any>
  ): void {
    this.parent.databaseQuery(query, duration, success, { ...this.context, ...additionalContext })
  }

  userAction(action: string, additionalContext?: Record<string, any>): void {
    this.parent.userAction(action, { ...this.context, ...additionalContext })
  }

  child(additionalContext: Record<string, any>, component?: string): ChildLogger {
    return new ChildLogger(
      this.parent,
      { ...this.context, ...additionalContext },
      component || this.component
    )
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>, tags?: string[]) =>
    logger.debug(message, context, tags),
  info: (message: string, context?: Record<string, any>, tags?: string[]) =>
    logger.info(message, context, tags),
  warn: (message: string, context?: Record<string, any>, tags?: string[]) =>
    logger.warn(message, context, tags),
  error: (
    message: string,
    error?: Error | Record<string, any>,
    context?: Record<string, any>,
    tags?: string[]
  ) => logger.error(message, error, context, tags),
  fatal: (
    message: string,
    error?: Error | Record<string, any>,
    context?: Record<string, any>,
    tags?: string[]
  ) => logger.fatal(message, error, context, tags),
  performance: (operation: string, duration: number, context?: Record<string, any>) =>
    logger.performance(operation, duration, context),
  apiRequest: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, any>
  ) => logger.apiRequest(method, url, statusCode, duration, context),
  databaseQuery: (
    query: string,
    duration: number,
    success: boolean,
    context?: Record<string, any>
  ) => logger.databaseQuery(query, duration, success, context),
  userAction: (action: string, context?: Record<string, any>) => logger.userAction(action, context),
  child: (context: Record<string, any>, component?: string) => logger.child(context, component),
}
