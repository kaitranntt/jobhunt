'use client'

import * as React from 'react'
import { Clock, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

interface UpcomingInterviewsProps {
  applications: Application[]
  className?: string
}

interface InterviewCardProps {
  company: string
  position: string
  time: string
}

const InterviewCard = ({ company, position, time }: InterviewCardProps) => {
  return (
    <div
      className="flex justify-between items-center py-3 border-b"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex-1">
        <div
          className="font-semibold mb-1"
          style={{
            fontFamily: 'var(--font-libre-baskerville)',
            color: 'var(--text-primary)',
          }}
        >
          {company}
        </div>
        <div
          className="text-sm mb-1"
          style={{
            fontFamily: 'var(--font-lora)',
            color: 'var(--text-secondary)',
          }}
        >
          {position}
        </div>
        <div
          className="text-sm flex items-center gap-1"
          style={{
            fontFamily: 'var(--font-ibm-plex-mono)',
            color: 'var(--accent-primary)',
          }}
        >
          <Clock className="h-4 w-4" />
          {time}
        </div>
      </div>
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
    </div>
  )
}

export function UpcomingInterviews({ applications, className }: UpcomingInterviewsProps) {
  // Filter applications that are in interview stages
  const upcomingInterviews = React.useMemo(() => {
    const interviewStatuses: ApplicationStatus[] = [
      'phone_screen',
      'assessment',
      'take_home',
      'interviewing',
      'final_round',
    ]

    return applications
      .filter(app => interviewStatuses.includes(app.status))
      .slice(0, 3) // Show only the next 3 interviews
      .map(app => ({
        id: app.id,
        company: app.company_name,
        position: app.job_title,
        time: 'Scheduled soon',
      }))
  }, [applications])

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
        Upcoming Interviews
      </h2>
      <div>
        {upcomingInterviews.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            No upcoming interviews scheduled
          </div>
        ) : (
          upcomingInterviews.map(interview => (
            <InterviewCard
              key={interview.id}
              company={interview.company}
              position={interview.position}
              time={interview.time}
            />
          ))
        )}
      </div>
    </div>
  )
}

UpcomingInterviews.displayName = 'UpcomingInterviews'
