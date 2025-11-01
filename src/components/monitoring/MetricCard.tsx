/**
 * Metric Card Component
 *
 * Reusable card component for displaying metrics with trend indicators,
 * status indicators, and real-time updates.
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  description?: string
  status?: 'healthy' | 'warning' | 'critical' | 'unknown'
  trend?: 'improving' | 'stable' | 'degrading'
  trendValue?: number
  previousValue?: number
  threshold?: {
    warning?: number
    critical?: number
  }
  icon?: React.ReactNode
  refreshable?: boolean
  onRefresh?: () => Promise<void>
  loading?: boolean
  className?: string
  children?: React.ReactNode
  actions?: React.ReactNode
  timestamp?: number
}

export function MetricCard({
  title,
  value,
  unit = '',
  description,
  status = 'unknown',
  trend = 'stable',
  trendValue,
  previousValue,
  threshold,
  icon,
  refreshable = false,
  onRefresh,
  loading = false,
  className = '',
  children,
  actions,
  timestamp,
}: MetricCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Failed to refresh metric:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600'
      case 'degrading':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString()
  }

  const isThresholdBreached = () => {
    if (!threshold || typeof value !== 'number') return false

    if (threshold.critical && value >= threshold.critical) return 'critical'
    if (threshold.warning && value >= threshold.warning) return 'warning'
    return false
  }

  const thresholdStatus = isThresholdBreached()
  const displayStatus = thresholdStatus || status

  return (
    <TooltipProvider>
      <Card className={`relative overflow-hidden ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="flex items-center space-x-1">
              {getStatusIcon(displayStatus)}
              <div className={`h-2 w-2 rounded-full ${getStatusColor(displayStatus)}`} />
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {refreshable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing || loading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh metric</p>
                </TooltipContent>
              </Tooltip>
            )}

            {actions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More actions</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">
                {loading ? <span className="text-muted-foreground">...</span> : value}
              </span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>

            {trend !== 'stable' && (
              <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
                {getTrendIcon(trend)}
                {trendValue !== undefined && (
                  <span className="text-xs font-medium">
                    {trendValue > 0 ? '+' : ''}
                    {trendValue.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}

          {previousValue !== undefined && typeof value === 'number' && (
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-muted-foreground">Previous:</span>
              <span className="text-xs">{previousValue}</span>
              <span className="text-xs text-muted-foreground">
                ({(((value - previousValue) / previousValue) * 100).toFixed(1)}% change)
              </span>
            </div>
          )}

          {threshold && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Thresholds:</span>
                <div className="flex items-center space-x-2">
                  {threshold.warning && (
                    <Badge variant="outline" className="text-xs">
                      Warning: {threshold.warning}
                    </Badge>
                  )}
                  {threshold.critical && (
                    <Badge variant="destructive" className="text-xs">
                      Critical: {threshold.critical}
                    </Badge>
                  )}
                </div>
              </div>

              {typeof value === 'number' && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      thresholdStatus === 'critical'
                        ? 'bg-red-500'
                        : thresholdStatus === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((value / (threshold.critical || threshold.warning || 100)) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {timestamp && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {formatTimestamp(timestamp)}
            </p>
          )}

          {children && <div className="mt-3 pt-3 border-t">{children}</div>}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
