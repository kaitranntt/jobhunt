'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Circle, CheckCircle, Clock, FileText, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface TimelineEvent {
  id: string
  type: 'status_change' | 'note_added' | 'interview_scheduled' | 'document_added'
  title: string
  description: string
  timestamp: Date
  icon?: React.ComponentType<{ className?: string }>
}

interface ApplicationTimelineProps {
  application: Application
  className?: string
}

export function ApplicationTimeline({ application, className }: ApplicationTimelineProps) {
  // Generate timeline events based on application data
  const timelineEvents: TimelineEvent[] = React.useMemo(() => {
    const events: TimelineEvent[] = []

    // Application creation event
    events.push({
      id: 'application-created',
      type: 'status_change',
      title: 'Application Created',
      description: `You added a new job application for ${application.job_title} at ${application.company_name}`,
      timestamp: new Date(application.date_applied),
      icon: Plus,
    })

    // Status change event
    if (application.status !== 'wishlist') {
      events.push({
        id: 'status-changed',
        type: 'status_change',
        title: `Status: ${application.status.replace('_', ' ')}`,
        description: `Application status updated to ${application.status.replace('_', ' ')}`,
        timestamp: new Date(application.date_applied),
        icon: CheckCircle,
      })
    }

    // Sort events by timestamp (newest first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [application])

  const formatDate = (date: Date): string => {
    return format(date, 'MMM dd, yyyy')
  }

  const formatTime = (date: Date): string => {
    return format(date, 'h:mm a')
  }

  const _getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'status_change':
        return CheckCircle
      case 'note_added':
        return FileText
      case 'interview_scheduled':
        return Calendar
      case 'document_added':
        return FileText
      default:
        return Circle
    }
  }

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'status_change':
        return 'text-copper'
      case 'note_added':
        return 'text-blue-500'
      case 'interview_scheduled':
        return 'text-purple-500'
      case 'document_added':
        return 'text-green-500'
      default:
        return 'text-label-tertiary'
    }
  }

  return (
    <div className={cn('p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-copper" />
        <h3 className="text-lg font-semibold text-label-primary">Timeline</h3>
      </div>

      <div className="space-y-4">
        {timelineEvents.map((event, index) => {
          const _Icon = event.icon || _getEventIcon(event.type)
          const isLast = index === timelineEvents.length - 1

          return (
            <div key={event.id} className="relative pl-6 pb-4 last:pb-0">
              {/* Timeline line */}
              {!isLast && (
                <div
                  className="absolute left-[7px] top-8 w-0.5 h-full bg-label-quaternary/30"
                  aria-hidden="true"
                />
              )}

              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-0 top-2 w-4 h-4 rounded-full border-2 bg-background',
                  getEventColor(event.type)
                )}
              >
                <div className="w-2 h-2 rounded-full bg-current m-auto mt-0.5" />
              </div>

              {/* Event content */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-label-primary text-sm">{event.title}</h4>
                  <div className="flex flex-col items-end text-right">
                    <div className="text-xs text-label-tertiary">{formatDate(event.timestamp)}</div>
                    <div className="text-xs text-label-quaternary">
                      {formatTime(event.timestamp)}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-label-secondary leading-relaxed">{event.description}</p>
              </div>
            </div>
          )
        })}

        {/* Empty state for future events */}
        {timelineEvents.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-label-tertiary mx-auto mb-2" />
            <p className="text-sm text-label-secondary">No timeline events yet</p>
          </div>
        )}

        {/* Add more events prompt */}
        <div className="pt-4 border-t border-label-quaternary/20">
          <p className="text-xs text-label-tertiary text-center">
            Timeline will update as your application progresses
          </p>
        </div>
      </div>
    </div>
  )
}

// Add missing Plus icon
const Plus = ({ className }: { className?: string }) => (
  <div className={cn('w-4 h-4 border-2 border-current rounded-sm', className)}>
    <div className="w-full h-0.5 bg-current absolute top-1/2 left-0 -translate-y-1/2" />
    <div className="h-full w-0.5 bg-current absolute left-1/2 top-0 -translate-x-1/2" />
  </div>
)
