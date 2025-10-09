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
    <Card
      className="glass-medium rounded-glass shadow-glass-soft border-0 transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-glass-medium"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={cn('p-2 rounded-full transition-all', colorClass || 'bg-blue-500/10')}>
            {icon}
          </div>
          <p
            className="text-sm font-medium"
            style={{
              fontFamily: 'var(--font-lora)',
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </p>
        </div>
        <div
          className="text-4xl font-bold mb-2"
          style={{
            fontFamily: 'var(--font-libre-baskerville)',
            color: 'var(--text-primary)',
          }}
        >
          {value}
        </div>
        {trend && (
          <div
            className="flex items-center gap-1 text-xs"
            style={{
              fontFamily: 'var(--font-ibm-plex-mono)',
              color: '#43a047',
            }}
          >
            <TrendingUp className="h-3 w-3" />
            {trend} from last month
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const calculateStats = (applications: Application[]) => {
  const total = applications.length

  // Response rate - applications beyond 'wishlist' and 'applied'
  const responded = applications.filter(app => !['wishlist', 'applied'].includes(app.status)).length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

  // Active interviews - specific interview stage statuses
  const activeInterviews = applications.filter(app =>
    ['phone_screen', 'assessment', 'take_home', 'interviewing', 'final_round'].includes(app.status)
  ).length

  // Average response time - calculate from date_applied to updated_at
  // For applications that moved beyond 'applied' status
  const respondedApps = applications.filter(
    app => !['wishlist', 'applied'].includes(app.status) && app.date_applied && app.updated_at
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<FileText className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />}
          label="Total Applications"
          value="0"
          colorClass="glass-ultra"
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />}
          label="Response Rate"
          value="—"
          colorClass="glass-ultra"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />}
          label="Active Interviews"
          value="0"
          colorClass="glass-ultra"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />}
          label="Avg Response Time"
          value="—"
          colorClass="glass-ultra"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        label="Total Applications"
        value={stats.total}
        colorClass="bg-blue-500/10 border border-blue-300/40 dark:border-blue-600/40"
      />
      <StatCard
        icon={<MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />}
        label="Response Rate"
        value={`${stats.responseRate}%`}
        colorClass="bg-green-500/10 border border-green-300/40 dark:border-green-600/40"
        trend={stats.responseRate > 0 ? `+${stats.responseRate}%` : undefined}
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        label="Active Interviews"
        value={stats.activeInterviews}
        colorClass="bg-purple-500/10 border border-purple-300/40 dark:border-purple-600/40"
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
        label="Avg Response Time"
        value={stats.avgResponseTime > 0 ? `${stats.avgResponseTime}d` : '—'}
        colorClass="bg-orange-500/10 border border-orange-300/40 dark:border-orange-600/40"
      />
    </div>
  )
}

SmartStatsPanel.displayName = 'SmartStatsPanel'
