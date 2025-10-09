'use client'

import * as React from 'react'
import { Edit, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

interface RecentApplicationsProps {
  applications: Application[]
  className?: string
}

interface StatusBadgeProps {
  status: ApplicationStatus
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'wishlist':
        return 'var(--saved-color)'
      case 'applied':
        return 'var(--applied-color)'
      case 'phone_screen':
      case 'assessment':
      case 'take_home':
      case 'interviewing':
      case 'final_round':
        return 'var(--interviewing-color)'
      case 'offered':
      case 'accepted':
        return 'var(--offer-color)'
      case 'rejected':
      case 'withdrawn':
      case 'ghosted':
        return 'var(--rejected-color)'
      default:
        return 'var(--saved-color)'
    }
  }

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case 'wishlist':
        return 'Saved'
      case 'applied':
        return 'Applied'
      case 'phone_screen':
        return 'Phone Screen'
      case 'assessment':
        return 'Assessment'
      case 'take_home':
        return 'Take Home'
      case 'interviewing':
        return 'Interviewing'
      case 'final_round':
        return 'Final Round'
      case 'offered':
        return 'Offered'
      case 'accepted':
        return 'Accepted'
      case 'rejected':
        return 'Rejected'
      case 'withdrawn':
        return 'Withdrawn'
      case 'ghosted':
        return 'Ghosted'
      default:
        return status
    }
  }

  return (
    <span
      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
      style={{ backgroundColor: getStatusColor(status) }}
    >
      {getStatusLabel(status)}
    </span>
  )
}

export function RecentApplications({ applications, className }: RecentApplicationsProps) {
  // Get the most recent applications (limit to 5)
  const recentApplications = React.useMemo(() => {
    return applications
      .sort((a, b) => {
        // Sort by date_applied if available, otherwise by created_at
        const dateA = a.date_applied
          ? new Date(a.date_applied).getTime()
          : new Date(a.created_at).getTime()
        const dateB = b.date_applied
          ? new Date(b.date_applied).getTime()
          : new Date(b.created_at).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [applications])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className={cn('glass-medium rounded-glass shadow-glass-soft p-5', className)}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <h2
        className="text-[18px] font-bold mb-4"
        style={{
          fontFamily: 'var(--font-libre-baskerville)',
          color: 'var(--text-primary)',
        }}
      >
        Recent Applications
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th
                className="text-left py-2 px-2 text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-lora)',
                  color: 'var(--text-secondary)',
                  borderBottom: `1px solid var(--border-color)`,
                }}
              >
                Company
              </th>
              <th
                className="text-left py-2 px-2 text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-lora)',
                  color: 'var(--text-secondary)',
                  borderBottom: `1px solid var(--border-color)`,
                }}
              >
                Position
              </th>
              <th
                className="text-left py-2 px-2 text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-lora)',
                  color: 'var(--text-secondary)',
                  borderBottom: `1px solid var(--border-color)`,
                }}
              >
                Status
              </th>
              <th
                className="text-left py-2 px-2 text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-lora)',
                  color: 'var(--text-secondary)',
                  borderBottom: `1px solid var(--border-color)`,
                }}
              >
                Applied
              </th>
              <th
                className="text-left py-2 px-2 text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-lora)',
                  color: 'var(--text-secondary)',
                  borderBottom: `1px solid var(--border-color)`,
                }}
              >
                Next Action
              </th>
              <th
                className="py-2 px-2"
                style={{ borderBottom: `1px solid var(--border-color)` }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {recentApplications.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No applications yet
                </td>
              </tr>
            ) : (
              recentApplications.map(app => (
                <tr key={app.id}>
                  <td
                    className="py-3 px-2 text-sm"
                    style={{
                      color: 'var(--text-primary)',
                      borderBottom: `1px solid var(--border-color)`,
                    }}
                  >
                    {app.company_name}
                  </td>
                  <td
                    className="py-3 px-2 text-sm"
                    style={{
                      color: 'var(--text-primary)',
                      borderBottom: `1px solid var(--border-color)`,
                    }}
                  >
                    {app.job_title}
                  </td>
                  <td
                    className="py-3 px-2"
                    style={{ borderBottom: `1px solid var(--border-color)` }}
                  >
                    <StatusBadge status={app.status} />
                  </td>
                  <td
                    className="py-3 px-2 text-sm"
                    style={{
                      color: 'var(--text-primary)',
                      borderBottom: `1px solid var(--border-color)`,
                    }}
                  >
                    {app.date_applied ? formatDate(app.date_applied) : '—'}
                  </td>
                  <td
                    className="py-3 px-2 text-sm"
                    style={{
                      color: 'var(--text-primary)',
                      borderBottom: `1px solid var(--border-color)`,
                    }}
                  >
                    {app.status === 'applied'
                      ? 'Follow up next week'
                      : app.status === 'interviewing'
                        ? 'Prepare for interview'
                        : app.status === 'wishlist'
                          ? 'Submit application'
                          : '—'}
                  </td>
                  <td
                    className="py-3 px-2"
                    style={{ borderBottom: `1px solid var(--border-color)` }}
                  >
                    <div className="flex gap-2">
                      <button
                        className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                        }}
                      >
                        <Edit className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
                      </button>
                      <button
                        className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                        }}
                      >
                        <MoreVertical
                          className="h-4 w-4"
                          style={{ color: 'var(--text-primary)' }}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

RecentApplications.displayName = 'RecentApplications'
