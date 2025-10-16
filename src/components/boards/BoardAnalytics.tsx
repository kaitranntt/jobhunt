'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Download,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Board, BoardColumn, Application } from '@/lib/types/database.types'

interface BoardAnalyticsProps {
  isOpen: boolean
  onClose: () => void
  board: Board
  columns: BoardColumn[]
  applications: Application[]
  onRefreshAnalytics?: () => Promise<void>
  onExportAnalytics?: () => Promise<void>
  isLoading?: boolean
}

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

function MetricCard({ title, value, description, trend, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
  }

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <Card className={cn('border-2', colorClasses[color])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {trend && (
              <div
                className={cn(
                  'flex items-center text-xs',
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
              </div>
            )}
            {icon && <div className={iconColorClasses[color]}>{icon}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ColumnAnalytics({
  column,
  applications,
  wipLimit,
}: {
  column: BoardColumn
  applications: Application[]
  wipLimit: number
}) {
  const count = applications.length
  const utilizationRate = wipLimit > 0 ? (count / wipLimit) * 100 : 0

  return (
    <Card className="border-2 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
            <CardTitle className="text-sm">{column.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {wipLimit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>WIP Utilization</span>
              <span className="font-medium">
                {count}/{wipLimit}
              </span>
            </div>
            <Progress
              value={Math.min(utilizationRate, 100)}
              className={cn(
                'h-2',
                utilizationRate >= 90
                  ? 'bg-red-100'
                  : utilizationRate >= 70
                    ? 'bg-yellow-100'
                    : 'bg-green-100'
              )}
            />
            <p className="text-xs text-gray-500">{utilizationRate.toFixed(0)}% utilized</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Recent Applications
          </p>
          <div className="space-y-1">
            {applications.slice(0, 3).map(app => (
              <div key={app.id} className="text-xs text-gray-700 dark:text-gray-300 truncate">
                {app.company_name} - {app.job_title}
              </div>
            ))}
            {applications.length > 3 && (
              <p className="text-xs text-gray-500">+{applications.length - 3} more</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BoardAnalytics({
  isOpen,
  onClose,
  board,
  columns,
  applications,
  onRefreshAnalytics,
  onExportAnalytics,
  isLoading = false,
}: BoardAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Calculate metrics from applications
  const metrics = useMemo(() => {
    const totalApplications = applications.length
    const applicationsByStatus = applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const activeApplications =
      applicationsByStatus.wishlist +
      applicationsByStatus.applied +
      applicationsByStatus.phone_screen +
      applicationsByStatus.assessment +
      applicationsByStatus.take_home +
      applicationsByStatus.interviewing +
      applicationsByStatus.final_round

    const offers = applicationsByStatus.offered + applicationsByStatus.accepted
    const rejections =
      applicationsByStatus.rejected + applicationsByStatus.withdrawn + applicationsByStatus.ghosted

    // Calculate conversion rate
    const conversionRate = totalApplications > 0 ? (offers / totalApplications) * 100 : 0

    // Calculate average time in pipeline (simplified - using created_at as proxy)
    const avgTimeInPipeline =
      totalApplications > 0
        ? applications.reduce((sum, app) => {
            const days = Math.floor(
              (Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
            )
            return sum + days
          }, 0) / totalApplications
        : 0

    return {
      totalApplications,
      activeApplications,
      offers,
      rejections,
      conversionRate,
      avgTimeInPipeline,
    }
  }, [applications])

  // Group applications by column for analytics
  const applicationsByColumn = useMemo(() => {
    const grouped: Record<string, Application[]> = {}

    columns.forEach(column => {
      // Map column name to application status for backward compatibility
      const statusMap: Record<string, Application['status']> = {
        Wishlist: 'wishlist',
        Applied: 'applied',
        'Phone Screen': 'phone_screen',
        Assessment: 'assessment',
        'Take Home': 'take_home',
        Interviewing: 'interviewing',
        'Final Round': 'final_round',
        Offered: 'offered',
        Accepted: 'accepted',
        Rejected: 'rejected',
        Withdrawn: 'withdrawn',
        Ghosted: 'ghosted',
      }

      const targetStatus = statusMap[column.name]
      if (targetStatus) {
        grouped[column.id] = applications.filter(app => app.status === targetStatus)
      } else {
        grouped[column.id] = []
      }
    })

    return grouped
  }, [columns, applications])

  const handleRefresh = async () => {
    try {
      await onRefreshAnalytics?.()
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
    }
  }

  const handleExport = async () => {
    try {
      await onExportAnalytics?.()
    } catch (error) {
      console.error('Failed to export analytics:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Board Analytics
              </DialogTitle>
              <DialogDescription>{board.name} - Performance metrics and insights</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Applications"
              value={metrics.totalApplications}
              description="All time"
              color="blue"
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              title="Active Pipeline"
              value={metrics.activeApplications}
              description="Currently in progress"
              color="green"
              icon={<Target className="h-5 w-5" />}
            />
            <MetricCard
              title="Offers"
              value={metrics.offers}
              description="Including accepted"
              color="purple"
              icon={<TrendingUp className="h-5 w-5" />}
              trend={metrics.offers > 0 ? 'up' : 'neutral'}
            />
            <MetricCard
              title="Conversion Rate"
              value={`${metrics.conversionRate.toFixed(1)}%`}
              description="Applications to offers"
              color={
                metrics.conversionRate >= 10
                  ? 'green'
                  : metrics.conversionRate >= 5
                    ? 'yellow'
                    : 'red'
              }
              icon={<BarChart3 className="h-5 w-5" />}
              trend={
                metrics.conversionRate >= 10
                  ? 'up'
                  : metrics.conversionRate >= 5
                    ? 'neutral'
                    : 'down'
              }
            />
          </div>

          <Separator />

          {/* Pipeline Funnel */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pipeline Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Application Status Distribution</CardTitle>
                  <CardDescription>Breakdown by current status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(
                    applications.reduce(
                      (acc, app) => {
                        acc[app.status] = (acc[app.status] || 0) + 1
                        return acc
                      },
                      {} as Record<string, number>
                    )
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / applications.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pipeline Health</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Time in Pipeline</span>
                    <span className="text-sm font-medium">
                      {Math.round(metrics.avgTimeInPipeline)} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Rejections</span>
                    <span className="text-sm font-medium text-red-600">{metrics.rejections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {metrics.totalApplications > 0
                        ? `${((metrics.offers / metrics.totalApplications) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active vs Closed</span>
                    <span className="text-sm font-medium">
                      {metrics.activeApplications} /{' '}
                      {metrics.totalApplications - metrics.activeApplications}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Column Analytics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Column Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map(column => (
                <ColumnAnalytics
                  key={column.id}
                  column={column}
                  applications={applicationsByColumn[column.id] || []}
                  wipLimit={column.wip_limit}
                />
              ))}
            </div>
          </div>

          {/* Board Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Board Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">
                    {new Date(board.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <div className="font-medium">
                    {new Date(board.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Total Columns:</span>
                  <div className="font-medium">{columns.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Applications:</span>
                  <div className="font-medium">{applications.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

BoardAnalytics.displayName = 'BoardAnalytics'
