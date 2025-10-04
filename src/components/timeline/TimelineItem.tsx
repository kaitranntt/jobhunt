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

const activityColorMap = {
  application: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  contact: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  document: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  reminder: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function TimelineItem({ activity }: TimelineItemProps) {
  const Icon = activityIconMap[activity.type]
  const colorClass = activityColorMap[activity.type]

  const absoluteTime = new Date(activity.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <li className="relative pb-8 last:pb-0">
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
          <Icon className="size-5" data-testid={`activity-icon-${activity.type}`} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{activity.title}</h3>
            <time
              className="shrink-0 text-sm text-muted-foreground"
              dateTime={activity.created_at}
              title={absoluteTime}
            >
              {absoluteTime}
            </time>
          </div>

          <p className="text-sm text-muted-foreground">{activity.description}</p>

          {activity.application_name && (
            <p className="text-xs text-muted-foreground">
              {activity.application_name}
            </p>
          )}
        </div>
      </div>

      {/* Connecting line */}
      <div className="absolute left-5 top-10 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
    </li>
  )
}
