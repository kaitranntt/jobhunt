'use client'

import * as React from 'react'
import { TrendingUp, FileText, MessageSquare, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface SmartStatsPanelProps {
  applications: Application[]
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  colorClass?: string
}

const StatCard = ({ icon, label, value, trend, colorClass }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className={cn('p-2 rounded-lg', colorClass || 'bg-blue-100 dark:bg-blue-900')}>
            {icon}
          </div>
          {trend && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const calculateStats = (applications: Application[]) => {
  const total = applications.length

  // Response rate - applications beyond 'wishlist' and 'applied'
  const responded = applications.filter(
    (app) => !['wishlist', 'applied'].includes(app.status)
  ).length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

  // Active interviews - specific interview stage statuses
  const activeInterviews = applications.filter((app) =>
    ['phone_screen', 'assessment', 'take_home', 'interviewing', 'final_round'].includes(
      app.status
    )
  ).length

  // Average response time - calculate from date_applied to updated_at
  // For applications that moved beyond 'applied' status
  const respondedApps = applications.filter(
    (app) => !['wishlist', 'applied'].includes(app.status) && app.date_applied && app.updated_at
  )

  let avgResponseTime = 0
  if (respondedApps.length > 0) {
    const totalDays = respondedApps.reduce((sum, app) => {
      const appliedDate = new Date(app.date_applied)
      const responseDate = new Date(app.updated_at)
      const diffInMs = responseDate.getTime() - appliedDate.getTime()
      const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)))
      return sum + diffInDays
    }, 0)
    avgResponseTime = Math.round(totalDays / respondedApps.length)
  }

  return {
    total,
    responseRate,
    activeInterviews,
    avgResponseTime,
  }
}

export function SmartStatsPanel({ applications }: SmartStatsPanelProps) {
  const stats = calculateStats(applications)
  const isEmpty = applications.length === 0

  if (isEmpty) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label="Total Applications"
          value="0"
          colorClass="bg-blue-100 dark:bg-blue-900"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />}
          label="Response Rate"
          value="—"
          colorClass="bg-green-100 dark:bg-green-900"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label="Active Interviews"
          value="0"
          colorClass="bg-purple-100 dark:bg-purple-900"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          label="Avg Response Time"
          value="—"
          colorClass="bg-orange-100 dark:bg-orange-900"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        label="Total Applications"
        value={stats.total}
        colorClass="bg-blue-100 dark:bg-blue-900"
      />
      <StatCard
        icon={<MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />}
        label="Response Rate"
        value={`${stats.responseRate}%`}
        colorClass="bg-green-100 dark:bg-green-900"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        label="Active Interviews"
        value={stats.activeInterviews}
        colorClass="bg-purple-100 dark:bg-purple-900"
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
        label="Avg Response Time"
        value={stats.avgResponseTime > 0 ? `${stats.avgResponseTime}d` : '—'}
        colorClass="bg-orange-100 dark:bg-orange-900"
      />
    </div>
  )
}

SmartStatsPanel.displayName = 'SmartStatsPanel'
