/**
 * Log Aggregation and Reporting
 *
 * Advanced log aggregation, analysis, and reporting system
 * for comprehensive monitoring insights.
 */

import { logger, LogLevel, LogEntry, LogFilter } from './logger'

export interface AggregationConfig {
  timeWindow: number // minutes
  maxEntries: number
  enableCompression: boolean
  enableRealTimeAnalysis: boolean
  alertThresholds: Record<string, number>
}

export interface LogAggregation {
  timestamp: number
  timeWindow: number
  totalLogs: number
  logsByLevel: Record<string, number>
  logsByComponent: Record<string, number>
  logsByTags: Record<string, number>
  errorRate: number
  warningRate: number
  topErrors: Array<{
    message: string
    count: number
    component?: string
    firstSeen: number
    lastSeen: number
  }>
  performanceMetrics: {
    averageLogSize: number
    logsPerMinute: number
    peakLogRate: number
  }
  trends: {
    errorTrend: 'increasing' | 'decreasing' | 'stable'
    volumeTrend: 'increasing' | 'decreasing' | 'stable'
    componentHealth: Record<string, 'healthy' | 'warning' | 'critical'>
  }
}

export interface ReportConfig {
  title: string
  description?: string
  timeRange: number // minutes
  includeCharts: boolean
  includeDetails: boolean
  filters?: LogFilter
  sections: ReportSection[]
}

export interface ReportSection {
  id: string
  title: string
  type: 'summary' | 'errors' | 'performance' | 'trends' | 'components' | 'custom'
  config?: Record<string, any>
  recommendations?: string[]
  alerts?: Array<{
    type: 'warning' | 'critical'
    message: string
    metric?: string
    value?: number
    threshold?: number
  }>
}

export interface MonitoringReport {
  id: string
  title: string
  description?: string
  generatedAt: number
  timeRange: number
  summary: LogAggregation
  sections: ReportSection[]
  charts?: ReportChart[]
  recommendations: string[]
  alerts: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    metric: string
    value: number
    threshold: number
  }>
  metadata: {
    totalLogs: number
    filteredLogs: number
    generatedBy: string
    version: string
  }
}

export interface ChartDataPoint {
  name?: string
  value?: number
  [key: string]: unknown
}

export interface ChartConfig {
  [key: string]: unknown
}

export interface ReportChart {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'heatmap'
  data: ChartDataPoint[]
  config: ChartConfig
}

/**
 * Log Aggregator class
 */
export class LogAggregator {
  private static instance: LogAggregator
  private config: AggregationConfig
  private aggregations: Map<string, LogAggregation> = new Map()
  private analysisInterval: ReturnType<typeof setInterval>
  private reportCache: Map<string, MonitoringReport> = new Map()

  private constructor(config: Partial<AggregationConfig> = {}) {
    this.config = {
      timeWindow: 60, // 1 hour
      maxEntries: 10000,
      enableCompression: true,
      enableRealTimeAnalysis: true,
      alertThresholds: {
        errorRate: 0.1, // 10%
        warningRate: 0.2, // 20%
        logsPerMinute: 1000,
        errorSpike: 5, // 5x normal error rate
      },
      ...config,
    }

    this.analysisInterval = setInterval(() => {
      if (this.config.enableRealTimeAnalysis) {
        this.performRealTimeAnalysis()
      }
    }, 30000) // Analyze every 30 seconds
  }

  static getInstance(config?: Partial<AggregationConfig>): LogAggregator {
    if (!LogAggregator.instance) {
      LogAggregator.instance = new LogAggregator(config)
    }
    return LogAggregator.instance
  }

  /**
   * Aggregate logs for a time window
   */
  async aggregateLogs(timeWindow?: number, filters?: LogFilter): Promise<LogAggregation> {
    const window = timeWindow || this.config.timeWindow
    const cutoff = Date.now() - window * 60 * 1000

    const logs = logger.getLogs({
      startTime: cutoff,
      ...filters,
    })

    const aggregation = this.performAggregation(logs, window)

    // Store aggregation
    const key = `agg_${window}_${Date.now()}`
    this.aggregations.set(key, aggregation)

    // Clean old aggregations
    this.cleanupAggregations()

    return aggregation
  }

  /**
   * Generate comprehensive monitoring report
   */
  async generateReport(config: ReportConfig): Promise<MonitoringReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const startTime = Date.now()

    logger.info(
      `Generating monitoring report: ${config.title}`,
      {
        reportId,
        title: config.title,
        timeRange: config.timeRange,
        sections: config.sections.length,
      },
      ['reporting', 'generate']
    )

    try {
      // Get base aggregation
      const aggregation = await this.aggregateLogs(config.timeRange, config.filters)

      // Generate sections
      const sections: ReportSection[] = []
      const charts: ReportChart[] = []
      const recommendations: string[] = []
      const alerts: MonitoringReport['alerts'] = []

      for (const sectionConfig of config.sections) {
        const section = await this.generateReportSection(sectionConfig, aggregation, config)
        sections.push(section)

        if (section.type === 'errors' || section.type === 'performance') {
          const sectionCharts = await this.generateSectionCharts(section, aggregation)
          charts.push(...sectionCharts)
        }

        if (section.recommendations) {
          recommendations.push(...section.recommendations)
        }

        if (section.alerts) {
          alerts.push(...section.alerts)
        }
      }

      const report: MonitoringReport = {
        id: reportId,
        title: config.title,
        description: config.description,
        generatedAt: Date.now(),
        timeRange: config.timeRange,
        summary: aggregation,
        sections,
        charts: config.includeCharts ? charts : undefined,
        recommendations: [...new Set(recommendations)], // Remove duplicates
        alerts,
        metadata: {
          totalLogs: aggregation.totalLogs,
          filteredLogs: aggregation.totalLogs, // Would be different if filters applied
          generatedBy: 'LogAggregator',
          version: '1.0.0',
        },
      }

      // Cache report
      this.reportCache.set(reportId, report)

      const duration = Date.now() - startTime

      logger.info(
        `Monitoring report generated successfully`,
        {
          reportId,
          title: config.title,
          duration,
          sectionsCount: sections.length,
          chartsCount: charts?.length || 0,
          recommendationsCount: recommendations.length,
          alertsCount: alerts.length,
        },
        ['reporting', 'success']
      )

      return report
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error(
        `Failed to generate monitoring report: ${config.title}`,
        error instanceof Error ? error : new Error(errorMessage),
        {
          reportId,
          title: config.title,
          duration,
          errorMessage,
        },
        ['reporting', 'error']
      )

      throw error
    }
  }

  /**
   * Get cached report
   */
  getCachedReport(reportId: string): MonitoringReport | null {
    return this.reportCache.get(reportId) || null
  }

  /**
   * Export report to different formats
   */
  async exportReport(reportId: string, format: 'json' | 'csv' | 'html' | 'pdf'): Promise<string> {
    const report = this.getCachedReport(reportId)
    if (!report) {
      throw new Error(`Report ${reportId} not found`)
    }

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2)

      case 'csv':
        return this.exportToCSV(report)

      case 'html':
        return this.exportToHTML(report)

      case 'pdf':
        // Would need a PDF library like puppeteer
        throw new Error('PDF export not implemented yet')

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Get aggregation history
   */
  getAggregationHistory(limit = 10): LogAggregation[] {
    const aggregations = Array.from(this.aggregations.values())
    return aggregations.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  /**
   * Destroy aggregator
   */
  destroy(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
    this.aggregations.clear()
    this.reportCache.clear()
  }

  // Private methods

  private performAggregation(logs: LogEntry[], timeWindow: number): LogAggregation {
    const now = Date.now()
    const windowStart = now - timeWindow * 60 * 1000

    const logsByLevel: Record<string, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0,
    }

    const logsByComponent: Record<string, number> = {}
    const logsByTags: Record<string, number> = {}

    const errorMessages = new Map<
      string,
      {
        count: number
        component?: string
        firstSeen: number
        lastSeen: number
      }
    >()

    let totalLogSize = 0
    const logTimestamps: number[] = []

    // Process logs
    for (const log of logs) {
      // Count by level
      const levelName = LogLevel[log.level]
      logsByLevel[levelName]++

      // Count by component
      if (log.component) {
        logsByComponent[log.component] = (logsByComponent[log.component] || 0) + 1
      }

      // Count by tags
      if (log.tags) {
        for (const tag of log.tags) {
          logsByTags[tag] = (logsByTags[tag] || 0) + 1
        }
      }

      // Track errors
      if (log.level >= LogLevel.ERROR) {
        const key = log.message
        const existing = errorMessages.get(key)

        if (existing) {
          existing.count++
          existing.lastSeen = Math.max(existing.lastSeen, log.timestamp)
        } else {
          errorMessages.set(key, {
            count: 1,
            component: log.component,
            firstSeen: log.timestamp,
            lastSeen: log.timestamp,
          })
        }
      }

      // Calculate log size (rough estimate)
      totalLogSize += JSON.stringify(log).length
      logTimestamps.push(log.timestamp)
    }

    const totalLogs = logs.length
    const errorRate = totalLogs > 0 ? (logsByLevel.ERROR + logsByLevel.FATAL) / totalLogs : 0
    const warningRate = totalLogs > 0 ? logsByLevel.WARN / totalLogs : 0

    // Calculate top errors
    const topErrors = Array.from(errorMessages.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate performance metrics
    const timeSpan = Math.max(...logTimestamps, now) - Math.min(...logTimestamps, windowStart)
    const logsPerMinute = timeSpan > 0 ? (totalLogs / timeSpan) * 60000 : 0
    const averageLogSize = totalLogs > 0 ? totalLogSize / totalLogs : 0

    // Calculate peak log rate (sliding window)
    let peakLogRate = 0
    const windowSize = 60000 // 1 minute
    for (let i = 0; i < logTimestamps.length; i++) {
      const windowStart = logTimestamps[i]
      const windowEnd = windowStart + windowSize
      const countInWindow = logTimestamps.filter(ts => ts >= windowStart && ts <= windowEnd).length
      const rate = (countInWindow / windowSize) * 60000
      peakLogRate = Math.max(peakLogRate, rate)
    }

    // Calculate trends (simplified)
    const halfPoint = Math.floor(logTimestamps.length / 2)
    const firstHalf = logTimestamps.slice(0, halfPoint)
    const secondHalf = logTimestamps.slice(halfPoint)

    const firstHalfErrors = firstHalf.filter(ts => {
      const log = logs.find(l => l.timestamp === ts)
      return log && log.level >= LogLevel.ERROR
    }).length

    const secondHalfErrors = secondHalf.filter(ts => {
      const log = logs.find(l => l.timestamp === ts)
      return log && log.level >= LogLevel.ERROR
    }).length

    const errorTrend =
      secondHalfErrors > firstHalfErrors * 1.2
        ? 'increasing'
        : secondHalfErrors < firstHalfErrors * 0.8
          ? 'decreasing'
          : 'stable'

    const volumeTrend =
      secondHalf.length > firstHalf.length * 1.2
        ? 'increasing'
        : secondHalf.length < firstHalf.length * 0.8
          ? 'decreasing'
          : 'stable'

    // Component health
    const componentHealth: Record<string, 'healthy' | 'warning' | 'critical'> = {}
    for (const [component, count] of Object.entries(logsByComponent)) {
      const componentErrors = logs.filter(
        log => log.component === component && log.level >= LogLevel.ERROR
      ).length
      const errorRate = count > 0 ? componentErrors / count : 0

      componentHealth[component] =
        errorRate > 0.2 ? 'critical' : errorRate > 0.1 ? 'warning' : 'healthy'
    }

    return {
      timestamp: now,
      timeWindow,
      totalLogs,
      logsByLevel,
      logsByComponent,
      logsByTags,
      errorRate,
      warningRate,
      topErrors,
      performanceMetrics: {
        averageLogSize,
        logsPerMinute,
        peakLogRate,
      },
      trends: {
        errorTrend,
        volumeTrend,
        componentHealth,
      },
    }
  }

  private async generateReportSection(
    sectionConfig: ReportSection,
    aggregation: LogAggregation,
    _reportConfig: ReportConfig
  ): Promise<ReportSection & { recommendations?: string[]; alerts?: MonitoringReport['alerts'] }> {
    const section = { ...sectionConfig }

    switch (sectionConfig.type) {
      case 'summary':
        section.config = {
          ...section.config,
          totalLogs: aggregation.totalLogs,
          errorRate: aggregation.errorRate,
          warningRate: aggregation.warningRate,
          topComponents: Object.entries(aggregation.logsByComponent)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5),
        }
        break

      case 'errors':
        section.config = {
          ...section.config,
          topErrors: aggregation.topErrors,
          errorTrend: aggregation.trends.errorTrend,
          errorRate: aggregation.errorRate,
        }

        // Add recommendations for errors
        if (aggregation.errorRate > this.config.alertThresholds.errorRate) {
          section.recommendations = [
            'Error rate is above threshold - investigate common error patterns',
            'Consider implementing better error handling and validation',
            'Review recent deployments that may have introduced issues',
          ]
        }

        // Add alerts for errors
        if (aggregation.trends.errorTrend === 'increasing') {
          section.alerts = [
            {
              type: 'warning',
              message: 'Error rate is trending upward',
              metric: 'errorTrend',
              value: 1,
              threshold: 0,
            },
          ]
        }
        break

      case 'performance':
        section.config = {
          ...section.config,
          logsPerMinute: aggregation.performanceMetrics.logsPerMinute,
          peakLogRate: aggregation.performanceMetrics.peakLogRate,
          averageLogSize: aggregation.performanceMetrics.averageLogSize,
        }

        if (
          aggregation.performanceMetrics.logsPerMinute > this.config.alertThresholds.logsPerMinute
        ) {
          section.recommendations = [
            'High log volume detected - consider adjusting log levels',
            'Review for potential log storms or infinite loops',
            'Consider implementing log sampling for high-volume scenarios',
          ]
        }
        break

      case 'trends':
        section.config = {
          ...section.config,
          errorTrend: aggregation.trends.errorTrend,
          volumeTrend: aggregation.trends.volumeTrend,
          componentHealth: aggregation.trends.componentHealth,
        }
        break

      case 'components':
        section.config = {
          ...section.config,
          componentBreakdown: aggregation.logsByComponent,
          componentHealth: aggregation.trends.componentHealth,
        }
        break
    }

    return section as ReportSection & {
      recommendations?: string[]
      alerts?: MonitoringReport['alerts']
    }
  }

  private async generateSectionCharts(
    section: ReportSection,
    aggregation: LogAggregation
  ): Promise<ReportChart[]> {
    const charts: ReportChart[] = []

    switch (section.type) {
      case 'errors':
        charts.push({
          id: `error_distribution_${section.id}`,
          title: 'Error Distribution',
          type: 'pie',
          data: aggregation.topErrors.map(error => ({
            name: error.message.substring(0, 50),
            value: error.count,
          })),
          config: {
            colors: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
          },
        })
        break

      case 'performance':
        charts.push({
          id: `log_volume_${section.id}`,
          title: 'Log Volume Over Time',
          type: 'line',
          data: [], // Would need time-series data
          config: {
            xAxis: 'time',
            yAxis: 'count',
          },
        })
        break
    }

    return charts
  }

  private exportToCSV(report: MonitoringReport): string {
    const headers = ['Timestamp', 'Level', 'Component', 'Message', 'Tags']
    const rows = [headers.join(',')]

    // This is simplified - would need actual log data
    rows.push(`Report: ${report.title},Generated: ${new Date(report.generatedAt).toISOString()}`)

    return rows.join('\n')
  }

  private exportToHTML(report: MonitoringReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
        .error { color: red; }
        .warning { color: orange; }
        .success { color: green; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        <p>Time Range: ${report.timeRange} minutes</p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <div class="metric">Total Logs: ${report.summary.totalLogs}</div>
        <div class="metric">Error Rate: ${(report.summary.errorRate * 100).toFixed(2)}%</div>
        <div class="metric">Warning Rate: ${(report.summary.warningRate * 100).toFixed(2)}%</div>
    </div>

    ${
      report.alerts.length > 0
        ? `
    <div class="section">
        <h2>Alerts</h2>
        ${report.alerts
          .map(
            alert => `
            <div class="metric ${alert.type}">
                <strong>${alert.message}</strong><br>
                ${alert.metric}: ${alert.value}
            </div>
        `
          )
          .join('')}
    </div>
    `
        : ''
    }

    ${
      report.recommendations.length > 0
        ? `
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    `
        : ''
    }
</body>
</html>
    `
  }

  private performRealTimeAnalysis(): void {
    // Real-time analysis logic
    this.aggregateLogs(this.config.timeWindow)
      .then(aggregation => {
        // Check for alert conditions
        if (aggregation.errorRate > this.config.alertThresholds.errorRate) {
          logger.warn(
            'High error rate detected',
            {
              errorRate: aggregation.errorRate,
              threshold: this.config.alertThresholds.errorRate,
              timeWindow: this.config.timeWindow,
            },
            ['aggregator', 'alert', 'error-rate']
          )
        }

        if (
          aggregation.performanceMetrics.logsPerMinute > this.config.alertThresholds.logsPerMinute
        ) {
          logger.warn(
            'High log volume detected',
            {
              logsPerMinute: aggregation.performanceMetrics.logsPerMinute,
              threshold: this.config.alertThresholds.logsPerMinute,
            },
            ['aggregator', 'alert', 'log-volume']
          )
        }
      })
      .catch(error => {
        logger.error(
          'Real-time analysis failed',
          error instanceof Error ? error : new Error('Unknown error'),
          {
            timeWindow: this.config.timeWindow,
          },
          ['aggregator', 'analysis-error']
        )
      })
  }

  private cleanupAggregations(): void {
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    const cutoff = Date.now() - maxAge

    for (const [key, aggregation] of this.aggregations.entries()) {
      if (aggregation.timestamp < cutoff) {
        this.aggregations.delete(key)
      }
    }

    // Also clean report cache
    for (const [key, report] of this.reportCache.entries()) {
      if (report.generatedAt < cutoff) {
        this.reportCache.delete(key)
      }
    }
  }
}

// Export singleton instance
export const logAggregator = LogAggregator.getInstance()

// Export convenience functions
export const createMonitoringReport = async (config: ReportConfig): Promise<MonitoringReport> => {
  return logAggregator.generateReport(config)
}

export const getLogAggregation = async (
  timeWindow?: number,
  filters?: LogFilter
): Promise<LogAggregation> => {
  return logAggregator.aggregateLogs(timeWindow, filters)
}
