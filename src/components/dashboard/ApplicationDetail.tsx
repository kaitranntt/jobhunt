'use client'

import * as React from 'react'
import { Check, Mail, Calendar, Eye, Download, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ApplicationDetailProps {
  application: Application
  className?: string
}

interface TimelineItemProps {
  icon: React.ReactNode
  title: string
  date: string
}

const TimelineItem = ({ icon, title, date }: TimelineItemProps) => {
  return (
    <div className="flex gap-4 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: 'var(--tint-blue)',
          color: 'white',
        }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium mb-1 text-label-primary">{title}</div>
        <div className="text-sm text-label-secondary">{date}</div>
      </div>
    </div>
  )
}

const DocumentCard = ({ type, name }: { type: string; name: string }) => {
  return (
    <div
      className="flex-1 p-4 rounded-lg"
      style={{
        backgroundColor: 'rgba(67, 97, 238, 0.05)',
      }}
    >
      <div className="text-xs mb-1 text-label-secondary">{type}</div>
      <div className="font-medium mb-3 text-label-primary">{name}</div>
      <div className="flex gap-3">
        <button className="flex items-center gap-1 text-sm" style={{ color: 'var(--tint-blue)' }}>
          <Eye className="h-4 w-4" />
          <span>Preview</span>
        </button>
        <button className="flex items-center gap-1 text-sm" style={{ color: 'var(--tint-blue)' }}>
          <Download className="h-4 w-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  )
}

export function ApplicationDetail({ application, className }: ApplicationDetailProps) {
  // Generate timeline events based on application status
  const timelineEvents = React.useMemo(() => {
    const events: TimelineItemProps[] = []

    // Applied event
    if (application.date_applied) {
      events.push({
        icon: <Check className="h-4 w-4" />,
        title: 'Applied',
        date: new Date(application.date_applied).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      })
    }

    // Response event
    if (!['wishlist', 'applied'].includes(application.status)) {
      events.push({
        icon: <Mail className="h-4 w-4" />,
        title: 'Response from HR',
        date: new Date(application.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      })
    }

    // Interview event
    if (
      ['phone_screen', 'assessment', 'take_home', 'interviewing', 'final_round'].includes(
        application.status
      )
    ) {
      events.push({
        icon: <Calendar className="h-4 w-4" />,
        title: 'Interview Scheduled',
        date: new Date(application.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      })
    }

    return events
  }, [application])

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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
    <div className={cn('glass-medium rounded-glass-lg shadow-glass-soft', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5" style={{ color: 'var(--tint-blue)' }} />
        <h2
          className="text-xl font-bold text-label-primary"
          style={{
            fontFamily: 'var(--font-display)',
          }}
        >
          Application Detail
        </h2>
      </div>

      {/* Header with company info and status */}
      <div
        className="flex justify-between items-center pb-4 mb-4 border-b"
        style={{ borderColor: 'var(--macos-separator)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl"
            style={{
              backgroundColor: 'var(--macos-fill-secondary)',
              color: 'var(--macos-label-secondary)',
            }}
          >
            {application.company_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3
              className="text-xl font-bold text-label-primary"
              style={{
                fontFamily: 'var(--font-display)',
              }}
            >
              {application.job_title}
            </h3>
            <p className="text-base text-label-secondary">
              {application.company_name} · {application.location || 'Remote'}
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${getStatusColor(application.status)}20`,
            color: getStatusColor(application.status),
          }}
        >
          {getStatusLabel(application.status)}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-label-primary">Timeline</h4>
        {timelineEvents.map((event, index) => (
          <TimelineItem key={index} icon={event.icon} title={event.title} date={event.date} />
        ))}
      </div>

      {/* Documents */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-label-primary">Documents</h4>
        <div className="flex gap-4">
          <DocumentCard type="RESUME" name="Frontend Resume v2.pdf" />
          <DocumentCard type="COVER LETTER" name={`${application.company_name} Cover Letter.pdf`} />
        </div>
      </div>

      {/* Notes */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: 'rgba(67, 97, 238, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" style={{ color: 'var(--tint-blue)' }} />
          <h4 className="font-medium text-label-primary">Notes</h4>
        </div>
        <p className="text-sm text-label-secondary">
          {application.notes ||
            'Focus on relevant experience and skills. Research the company culture and prepare questions for the interviewer.'}
        </p>
      </div>
    </div>
  )
}

ApplicationDetail.displayName = 'ApplicationDetail'
