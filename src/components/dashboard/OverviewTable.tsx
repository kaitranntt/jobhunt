'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ExternalLink, Edit, MoreVertical, MapPin, Star, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

interface OverviewTableProps {
  applications: Application[]
  className?: string
  onApplicationClick?: (application: Application) => void
  onApplicationUpdate?: (id: string, status: ApplicationStatus) => void
}

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const getStatusConfig = (status: ApplicationStatus) => {
    switch (status) {
      case 'wishlist':
        return {
          label: 'Saved',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
        }
      case 'applied':
        return {
          label: 'Applied',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        }
      case 'phone_screen':
        return {
          label: 'Phone Screen',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        }
      case 'assessment':
        return {
          label: 'Assessment',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        }
      case 'take_home':
        return {
          label: 'Take Home',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        }
      case 'interviewing':
        return {
          label: 'Interviewing',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200',
        }
      case 'final_round':
        return {
          label: 'Final Round',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200',
        }
      case 'offered':
        return {
          label: 'Offered',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        }
      case 'accepted':
        return {
          label: 'Accepted',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        }
      case 'rejected':
        return {
          label: 'Rejected',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        }
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        }
      case 'ghosted':
        return {
          label: 'Ghosted',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        }
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded text-xs font-medium border cursor-pointer transition-all hover:shadow-sm',
        config.bgColor,
        config.textColor,
        config.borderColor
      )}
    >
      {config.label}
    </span>
  )
}

const PriorityRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4 transition-colors',
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  )
}

const TableRow = ({ application, onClick }: { application: Application; onClick?: () => void }) => {
  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(application.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const isRecent = daysAgo <= 3

  return (
    <tr
      className={cn(
        'border-b hover:bg-gray-50 cursor-pointer transition-all duration-200',
        isRecent && 'bg-blue-50/30',
        'group'
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <td className="w-8 px-2 py-3"></td>

      {/* Company */}
      <td className="px-1.5 sm:px-2 py-2 min-w-[160px] sm:min-w-[180px]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
            style={{
              backgroundColor:
                application.status === 'offered' || application.status === 'accepted'
                  ? 'var(--color-success)'
                  : application.status === 'rejected' ||
                      application.status === 'withdrawn' ||
                      application.status === 'ghosted'
                    ? 'var(--color-error)'
                    : 'var(--tint-blue)',
            }}
          >
            {application.company_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {application.company_name}
            </div>
            {application.location && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {application.location}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Position */}
      <td className="px-1.5 sm:px-2 py-2 min-w-[140px] sm:min-w-[160px]">
        <div className="text-sm text-gray-900 font-medium truncate" title={application.job_title}>
          {application.job_title}
        </div>
      </td>

      {/* Status */}
      <td className="px-1.5 sm:px-2 py-2 min-w-[100px] sm:min-w-[110px]">
        <div onClick={e => e.stopPropagation()}>
          <StatusBadge status={application.status} />
        </div>
      </td>

      {/* Priority */}
      <td className="px-2 py-2.5 min-w-[90px]">
        <div onClick={e => e.stopPropagation()}>
          <PriorityRating rating={0} />
        </div>
      </td>

      {/* Salary Range */}
      <td className="px-2 py-2.5 min-w-[110px]">
        <div className="text-sm text-gray-900 font-medium">{application.salary_range || '—'}</div>
      </td>

      {/* Date Applied */}
      <td className="px-2 py-2.5 min-w-[90px]">
        <div className="text-sm text-gray-900">
          {application.date_applied
            ? format(new Date(application.date_applied), 'MMM d, yyyy')
            : '—'}
        </div>
      </td>

      {/* Follow Up */}
      <td className="px-2 py-2.5 min-w-[110px]">
        <div className="text-sm text-gray-900 flex items-center gap-1">
          <Calendar className="h-3 w-3" />—
        </div>
      </td>

      {/* Last Updated */}
      <td className="px-2 py-2.5 min-w-[90px]">
        <div className="text-sm text-gray-500">
          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
        </div>
      </td>

      {/* Actions */}
      <td className="px-2 py-2.5 min-w-[90px]">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {application.job_url && (
            <button
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              onClick={e => {
                e.stopPropagation()
                if (application.job_url) {
                  window.open(application.job_url, '_blank')
                }
              }}
            >
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
          )}

          <button
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            onClick={e => {
              e.stopPropagation()
              // Handle edit action
            }}
          >
            <Edit className="h-4 w-4 text-gray-500" />
          </button>

          <button
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            onClick={e => {
              e.stopPropagation()
              // Handle more options
            }}
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </td>
    </tr>
  )
}

const TableHeader = ({
  sortConfig,
  onSort,
}: {
  sortConfig: { key: keyof Application | null; direction: 'asc' | 'desc' }
  onSort: (key: keyof Application) => void
}) => {
  const headers = [
    { key: 'company_name' as keyof Application, label: 'Company', sortable: true },
    { key: 'job_title' as keyof Application, label: 'Position', sortable: true },
    { key: 'status' as keyof Application, label: 'Status', sortable: true },
    { key: 'excitement_level' as keyof Application, label: 'Priority', sortable: true },
    { key: 'salary_range' as keyof Application, label: 'Salary Range', sortable: true },
    { key: 'date_applied' as keyof Application, label: 'Date Applied', sortable: true },
    { key: 'follow_up_date' as keyof Application, label: 'Follow Up', sortable: true },
    { key: 'updated_at' as keyof Application, label: 'Updated', sortable: true },
    { key: null, label: 'Actions', sortable: false },
  ]

  return (
    <thead className="bg-gray-50/50 border-b border-gray-200">
      <tr>
        <th className="w-8 px-2 py-2.5"></th>
        {headers.map(({ key, label, sortable }) => (
          <th key={key || 'actions'} className="px-2 py-2.5 text-left">
            {sortable ? (
              <button
                onClick={() => key && onSort(key)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
              >
                {label}
                {sortConfig.key === key && (
                  <span className="text-blue-500">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ) : (
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {label}
              </span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export function OverviewTable({
  applications,
  className,
  onApplicationClick,
  onApplicationUpdate,
}: OverviewTableProps) {
  // onApplicationUpdate is kept for future use and API compatibility
  void onApplicationUpdate
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof Application | null
    direction: 'asc' | 'desc'
  }>({ key: 'updated_at', direction: 'desc' })

  // Sort and filter applications
  const sortedApplications = React.useMemo(() => {
    let sortableApplications = [...applications]

    if (sortConfig.key) {
      sortableApplications.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]

        if (aValue === null && bValue === null) return 0
        if (aValue === null) return 1
        if (bValue === null) return -1

        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1

        return sortConfig.direction === 'desc' ? -comparison : comparison
      })
    }

    return sortableApplications
  }, [applications, sortConfig])

  const handleSort = (key: keyof Application) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200/60 bg-white shadow-sm overflow-hidden',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="px-4 py-3 border-b border-gray-200/60 flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            Application Overview
          </h2>
          <p
            className="text-sm mt-1"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            {applications.length} application{applications.length !== 1 ? 's' : ''} • Click to edit
            • Drag to reorder
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Export CSV
          </button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Customize Columns
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader sortConfig={sortConfig} onSort={handleSort} />
          <tbody className="divide-y divide-gray-200/60">
            {sortedApplications.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <div className="text-gray-500">
                    <div className="text-sm font-medium mb-2">No applications yet</div>
                    <div className="text-xs">
                      Start by adding your first job application to see it here
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedApplications.map(app => (
                <TableRow
                  key={app.id}
                  application={app}
                  onClick={() => onApplicationClick?.(app)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

OverviewTable.displayName = 'OverviewTable'
