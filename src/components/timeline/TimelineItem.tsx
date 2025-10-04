import { Briefcase, User, FileText, Bell } from 'lucide-react'
import type { TimelineActivity } from '@/lib/types/timeline.types'

interface TimelineItemProps {
  activity: TimelineActivity
}

const activityIconMap = {
  application: Briefcase,
  contact: User,
  document: FileText,
  reminder: Bell,
}

const activityIconColorMap = {
  application: 'var(--tint-blue)',
  contact: 'var(--tint-green)',
  document: 'var(--tint-purple)',
  reminder: 'var(--tint-orange)',
}

export default function TimelineItem({ activity }: TimelineItemProps) {
  const Icon = activityIconMap[activity.type]
  const iconColor = activityIconColorMap[activity.type]

  const absoluteTime = new Date(activity.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <li className="relative pb-8 last:pb-0 glass-ultra rounded-glass-sm p-4 shadow-glass-subtle glass-interactive animate-spring-bounce-in"
      style={{ border: '1px solid var(--glass-border-subtle)' }}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-medium shadow-glass-soft"
          style={{ border: '1px solid var(--glass-border-medium)' }}
        >
          <Icon className="size-5" data-testid={`activity-icon-${activity.type}`} style={{ color: iconColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base text-label-primary leading-tight">{activity.title}</h3>
            <time
              className="shrink-0 text-xs text-label-tertiary font-medium"
              dateTime={activity.created_at}
              title={absoluteTime}
            >
              {absoluteTime}
            </time>
          </div>

          <p className="text-sm text-label-secondary">{activity.description}</p>

          {activity.application_name && (
            <p className="text-xs text-label-tertiary font-medium">
              {activity.application_name}
            </p>
          )}
        </div>
      </div>

      {/* Connecting line */}
      <div className="absolute left-9 top-14 -ml-px h-full w-0.5" style={{ background: 'var(--glass-border-subtle)' }} aria-hidden="true" />
    </li>
  )
}
