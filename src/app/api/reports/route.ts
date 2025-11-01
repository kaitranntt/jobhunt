/**
 * Reports API Endpoint
 *
 * API endpoints for generating, retrieving, and exporting
 * monitoring reports and analytics.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  logAggregator,
  createMonitoringReport,
  ReportConfig,
  LogAggregation,
  MonitoringReport,
} from '@/lib/monitoring/aggregator'
import { logger } from '@/lib/monitoring/logger'

interface ReportTemplate {
  title: string
  description: string
  timeRange: number
  includeCharts: boolean
  includeDetails: boolean
  sections: Array<{
    id: string
    title: string
    type: string
  }>
}

interface ReportTemplates {
  daily: ReportTemplate
  weekly: ReportTemplate
  error_analysis: ReportTemplate
  performance: ReportTemplate
  real_time: ReportTemplate
}

/**
 * POST /api/reports - Generate a new monitoring report
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const config: ReportConfig = await request.json()

    // Validate config
    if (!config.title) {
      return NextResponse.json({ error: 'Report title is required' }, { status: 400 })
    }

    if (!config.sections || config.sections.length === 0) {
      return NextResponse.json(
        { error: 'At least one report section is required' },
        { status: 400 }
      )
    }

    logger.info(
      'Report generation requested',
      {
        requestId,
        title: config.title,
        timeRange: config.timeRange,
        sectionsCount: config.sections.length,
        includeCharts: config.includeCharts,
      },
      ['reports', 'api', 'generate']
    )

    // Generate report
    const report = await createMonitoringReport(config)
    const duration = Date.now() - startTime

    logger.info(
      'Report generated successfully',
      {
        requestId,
        reportId: report.id,
        title: config.title,
        duration,
        recommendationsCount: report.recommendations.length,
        alertsCount: report.alerts.length,
      },
      ['reports', 'api', 'success']
    )

    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Response-Time': duration.toString(),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      'Report generation failed',
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestId,
        duration,
        errorMessage,
      },
      ['reports', 'api', 'error']
    )

    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: errorMessage,
        timestamp: Date.now(),
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': duration.toString(),
        },
      }
    )
  }
}

/**
 * GET /api/reports - Get available reports or aggregation data
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `reports_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'aggregation'
    const timeRange = parseInt(searchParams.get('timeRange') || '60')
    const format = searchParams.get('format') || 'json'

    logger.info(
      'Reports data requested',
      {
        requestId,
        type,
        timeRange,
        format,
      },
      ['reports', 'api', 'fetch']
    )

    let response: LogAggregation | MonitoringReport | ReportTemplates | LogAggregation[]

    switch (type) {
      case 'aggregation':
        response = await logAggregator.aggregateLogs(timeRange)
        break

      case 'history':
        response = logAggregator.getAggregationHistory(parseInt(searchParams.get('limit') || '10'))
        break

      case 'templates':
        response = getReportTemplates()
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter', validTypes: ['aggregation', 'history', 'templates'] },
          { status: 400 }
        )
    }

    const duration = Date.now() - startTime

    logger.info(
      'Reports data retrieved successfully',
      {
        requestId,
        type,
        duration,
        responseType: Array.isArray(response) ? 'array' : 'object',
      },
      ['reports', 'api', 'success']
    )

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Response-Time': duration.toString(),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      'Reports data fetch failed',
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestId,
        duration,
        errorMessage,
      },
      ['reports', 'api', 'error']
    )

    return NextResponse.json(
      {
        error: 'Failed to retrieve reports data',
        message: errorMessage,
        timestamp: Date.now(),
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': duration.toString(),
        },
      }
    )
  }
}

/**
 * PUT /api/reports - Update or export a report
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `report_export_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const format = searchParams.get('format') || 'json'

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    logger.info(
      'Report export requested',
      {
        requestId,
        reportId,
        format,
      },
      ['reports', 'api', 'export']
    )

    const report = logAggregator.getCachedReport(reportId)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const exportedData = await logAggregator.exportReport(
      reportId,
      format as 'json' | 'csv' | 'html'
    )
    const duration = Date.now() - startTime

    logger.info(
      'Report exported successfully',
      {
        requestId,
        reportId,
        format,
        duration,
      },
      ['reports', 'api', 'export-success']
    )

    // Return appropriate content type based on format
    const contentType =
      format === 'html' ? 'text/html' : format === 'csv' ? 'text/csv' : 'application/json'

    return new NextResponse(exportedData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Disposition': `attachment; filename="report-${report.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${format}"`,
        'X-Request-ID': requestId,
        'X-Response-Time': duration.toString(),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      'Report export failed',
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestId,
        duration,
        errorMessage,
      },
      ['reports', 'api', 'export-error']
    )

    return NextResponse.json(
      {
        error: 'Failed to export report',
        message: errorMessage,
        timestamp: Date.now(),
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': duration.toString(),
        },
      }
    )
  }
}

/**
 * Report templates for common monitoring scenarios
 */
function getReportTemplates(): ReportTemplates {
  return {
    daily: {
      title: 'Daily System Health Report',
      description: 'Comprehensive daily overview of system performance and health',
      timeRange: 1440, // 24 hours
      includeCharts: true,
      includeDetails: true,
      sections: [
        { id: 'summary', title: 'Executive Summary', type: 'summary' },
        { id: 'errors', title: 'Error Analysis', type: 'errors' },
        { id: 'performance', title: 'Performance Metrics', type: 'performance' },
        { id: 'trends', title: 'Trends Analysis', type: 'trends' },
        { id: 'components', title: 'Component Health', type: 'components' },
      ],
    },

    weekly: {
      title: 'Weekly Performance Report',
      description: 'Weekly trends and performance analysis',
      timeRange: 10080, // 7 days
      includeCharts: true,
      includeDetails: true,
      sections: [
        { id: 'summary', title: 'Weekly Overview', type: 'summary' },
        { id: 'performance', title: 'Performance Trends', type: 'performance' },
        { id: 'trends', title: 'Trend Analysis', type: 'trends' },
        { id: 'components', title: 'Component Performance', type: 'components' },
      ],
    },

    error_analysis: {
      title: 'Error Analysis Report',
      description: 'Detailed analysis of system errors and issues',
      timeRange: 1440, // 24 hours
      includeCharts: true,
      includeDetails: true,
      sections: [
        { id: 'summary', title: 'Error Summary', type: 'summary' },
        { id: 'errors', title: 'Error Details', type: 'errors' },
        { id: 'components', title: 'Component Error Analysis', type: 'components' },
      ],
    },

    performance: {
      title: 'Performance Report',
      description: 'System performance and resource utilization',
      timeRange: 1440, // 24 hours
      includeCharts: true,
      includeDetails: true,
      sections: [
        { id: 'summary', title: 'Performance Overview', type: 'summary' },
        { id: 'performance', title: 'Performance Metrics', type: 'performance' },
        { id: 'trends', title: 'Performance Trends', type: 'trends' },
      ],
    },

    real_time: {
      title: 'Real-time Monitoring Report',
      description: 'Current system status and recent activity',
      timeRange: 60, // 1 hour
      includeCharts: false,
      includeDetails: false,
      sections: [
        { id: 'summary', title: 'Current Status', type: 'summary' },
        { id: 'errors', title: 'Recent Errors', type: 'errors' },
      ],
    },
  }
}
