'use client'

import * as React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, Briefcase, PhoneCall, PartyPopper, XCircle } from 'lucide-react'
import { ApplicationCard } from './ApplicationCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

interface KanbanBoardV2Props {
  applications: Application[]
  onUpdateStatus: (_id: string, _newStatus: ApplicationStatus) => Promise<void>
  onApplicationClick?: (_application: Application) => void
  isLoading?: boolean
}

type StatusGroup = 'active_pipeline' | 'in_progress' | 'offers' | 'closed'

const STATUS_GROUPS: Record<StatusGroup, ApplicationStatus[]> = {
  active_pipeline: ['wishlist', 'applied'],
  in_progress: ['phone_screen', 'assessment', 'take_home', 'interviewing', 'final_round'],
  offers: ['offered', 'accepted'],
  closed: ['rejected', 'withdrawn', 'ghosted'],
}

const GROUP_LABELS: Record<StatusGroup, string> = {
  active_pipeline: '🎯 Active Pipeline',
  in_progress: '📞 In Progress',
  offers: '🎉 Offers',
  closed: '❌ Closed',
}

const GROUP_DESCRIPTIONS: Record<StatusGroup, string> = {
  active_pipeline: 'Early-stage applications',
  in_progress: 'Interviewing and assessments',
  offers: 'Successful outcomes',
  closed: 'Archived applications',
}

const GROUP_COLORS: Record<StatusGroup, string> = {
  active_pipeline: 'glass-light bg-blue-500/5 border-blue-300/20 dark:border-blue-600/20',
  in_progress: 'glass-light bg-purple-500/5 border-purple-300/20 dark:border-purple-600/20',
  offers: 'glass-light bg-green-500/5 border-green-300/20 dark:border-green-600/20',
  closed: 'glass-light bg-slate-500/5 border-slate-300/20 dark:border-slate-600/20',
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  assessment: 'Assessment',
  take_home: 'Take Home',
  interviewing: 'Interviewing',
  final_round: 'Final Round',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  ghosted: 'Ghosted',
}

const EMPTY_STATE_GUIDANCE: Record<StatusGroup, { heading: string; text: string; cta?: string }> = {
  active_pipeline: {
    heading: 'No active applications yet',
    text: "Start by adding jobs to your wishlist or track applications you've submitted",
    cta: 'Add your first application',
  },
  in_progress: {
    heading: 'No applications in progress',
    text: 'When you start interviewing, applications will appear here with their current stage',
  },
  offers: {
    heading: 'No offers yet',
    text: 'Keep applying! Your successful offers will be tracked here',
  },
  closed: {
    heading: 'No archived applications',
    text: "Applications that didn't work out will be stored here for future reference",
  },
}

interface SortableApplicationProps {
  application: Application
  isDragging: boolean
  onApplicationClick?: (_application: Application) => void
}

function SortableApplication({
  application,
  isDragging,
  onApplicationClick,
}: SortableApplicationProps) {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef } =
    useSortable({
      id: application.id,
      data: {
        applicationId: application.id,
        currentStatus: application.status,
      },
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ApplicationCard
        application={application}
        isDragging={isDragging}
        onClick={() => onApplicationClick?.(application)}
        dragHandleProps={{ ref: setActivatorNodeRef, ...listeners }}
      />
    </div>
  )
}

interface SubStageColumnProps {
  status: ApplicationStatus
  applications: Application[]
  activeId: string | null
  onApplicationClick?: (_application: Application) => void
}

function SubStageColumn({
  status,
  applications,
  activeId,
  onApplicationClick,
}: SubStageColumnProps) {
  return (
    <div className="ml-4 glass-ultra rounded-glass-sm p-4 border-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-label-primary">{STATUS_LABELS[status]}</h4>
        <Badge variant="outline" className="text-xs glass-ultra border-0">
          {applications.length}
        </Badge>
      </div>
      <SortableContext
        items={applications.map(app => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {applications.map(application => (
            <SortableApplication
              key={application.id}
              application={application}
              isDragging={application.id === activeId}
              onApplicationClick={onApplicationClick}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

interface EmptyStateProps {
  group: StatusGroup
  Icon: React.ComponentType<{ className?: string }>
}

function EmptyState({ group, Icon }: EmptyStateProps) {
  const guidance = EMPTY_STATE_GUIDANCE[group]

  return (
    <div className="flex flex-1 flex-col items-center justify-center glass-ultra rounded-glass border-2 border-dashed border-label-quaternary p-12 text-center">
      <div className="glass-ultra rounded-full p-4 mb-4">
        <Icon className="h-12 w-12 text-label-tertiary" />
      </div>
      <h4 className="mb-2 font-semibold text-label-primary">{guidance.heading}</h4>
      <p className="mb-6 max-w-xs text-sm text-label-secondary">{guidance.text}</p>
      {guidance.cta && (
        <Button variant="outline" size="sm" disabled className="glass-ultra border-0">
          {guidance.cta}
        </Button>
      )}
    </div>
  )
}

interface GroupColumnProps {
  group: StatusGroup
  applications: Application[]
  applicationsByStatus: Record<ApplicationStatus, Application[]>
  activeId: string | null
  onApplicationClick?: (_application: Application) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function GroupColumn({
  group,
  applications,
  applicationsByStatus,
  activeId,
  onApplicationClick,
  isExpanded,
  onToggleExpand,
}: GroupColumnProps) {
  const count = applications.length
  const isExpandable = group === 'in_progress'
  const colorClass = GROUP_COLORS[group]

  const iconMap: Record<StatusGroup, React.ComponentType<{ className?: string }>> = {
    active_pipeline: Briefcase,
    in_progress: PhoneCall,
    offers: PartyPopper,
    closed: XCircle,
  }

  const Icon = iconMap[group]

  return (
    <div
      className={cn(
        'flex min-w-[280px] flex-1 flex-col rounded-glass p-6 md:min-w-[320px] shadow-glass-soft backdrop-blur-sm',
        colorClass
      )}
      data-testid={`group-column-${group}`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isExpandable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 glass-ultra rounded-full hover:glass-light transition-all"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Collapse sub-stages' : 'Expand sub-stages'}
              data-testid={`toggle-expand-${group}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-label-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-label-primary" />
              )}
            </Button>
          )}
          <h3 className="text-lg font-semibold text-label-primary">{GROUP_LABELS[group]}</h3>
        </div>
        <Badge
          variant="secondary"
          className="text-xs glass-ultra border-0 px-3 py-1"
          data-testid={`count-badge-${group}`}
        >
          {count}
        </Badge>
      </div>

      <p className="mb-6 text-sm text-label-secondary">{GROUP_DESCRIPTIONS[group]}</p>

      <SortableContext
        items={applications.map(app => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {applications.length === 0 ? (
            <EmptyState group={group} Icon={Icon} />
          ) : isExpandable && isExpanded ? (
            <div className="flex flex-col gap-3">
              {STATUS_GROUPS[group].map(status => {
                const statusApps = applicationsByStatus[status]
                if (statusApps.length === 0) return null
                return (
                  <SubStageColumn
                    key={status}
                    status={status}
                    applications={statusApps}
                    activeId={activeId}
                    onApplicationClick={onApplicationClick}
                  />
                )
              })}
            </div>
          ) : (
            applications.map(application => (
              <SortableApplication
                key={application.id}
                application={application}
                isDragging={application.id === activeId}
                onApplicationClick={onApplicationClick}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoardV2({
  applications,
  onUpdateStatus,
  onApplicationClick,
  isLoading = false,
}: KanbanBoardV2Props) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [optimisticApplications, setOptimisticApplications] =
    React.useState<Application[]>(applications)
  const [announcement, setAnnouncement] = React.useState<string>('')
  const [expandedGroups, setExpandedGroups] = React.useState<Set<StatusGroup>>(new Set())

  // Update optimistic state when applications prop changes
  React.useEffect(() => {
    setOptimisticApplications(applications)
  }, [applications])

  // Group applications by status group with memoization
  const groupedApplications = React.useMemo(() => {
    const grouped: Record<StatusGroup, Application[]> = {
      active_pipeline: [],
      in_progress: [],
      offers: [],
      closed: [],
    }

    optimisticApplications.forEach(app => {
      for (const [group, statuses] of Object.entries(STATUS_GROUPS) as [
        StatusGroup,
        ApplicationStatus[],
      ][]) {
        if (statuses.includes(app.status)) {
          grouped[group].push(app)
          break
        }
      }
    })

    return grouped
  }, [optimisticApplications])

  // Group applications by individual status for sub-stages
  const applicationsByStatus = React.useMemo(() => {
    const grouped: Record<ApplicationStatus, Application[]> = {
      wishlist: [],
      applied: [],
      phone_screen: [],
      assessment: [],
      take_home: [],
      interviewing: [],
      final_round: [],
      offered: [],
      accepted: [],
      rejected: [],
      withdrawn: [],
      ghosted: [],
    }

    optimisticApplications.forEach(app => {
      if (grouped[app.status]) {
        grouped[app.status].push(app)
      }
    })

    return grouped
  }, [optimisticApplications])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  // Helper function to check if a string is a UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) {
      return
    }

    const applicationId = active.id as string
    const dropTargetId = over.id as string

    // Find the application being dragged
    const application = optimisticApplications.find(app => app.id === applicationId)

    if (!application) {
      return
    }

    // Determine the new status based on the drop target
    let newStatus: ApplicationStatus

    // Check if the drop target is a UUID (another application card)
    if (isUUID(dropTargetId)) {
      // Find the target application and use its status
      const targetApplication = optimisticApplications.find(app => app.id === dropTargetId)
      if (targetApplication) {
        newStatus = targetApplication.status
      } else {
        // If we can't find the target application, fallback to current status
        console.error('Target application not found:', dropTargetId)
        return
      }
    } else if (Object.keys(STATUS_LABELS).includes(dropTargetId)) {
      // Check if the drop target is a valid status
      newStatus = dropTargetId as ApplicationStatus
    } else {
      // If dropping on a group, determine the appropriate status
      // Find the first status in the group or use a default
      const groupStatuses = Object.entries(STATUS_GROUPS).find(
        ([group, statuses]) => dropTargetId === group || statuses.some(s => s === dropTargetId)
      )

      if (groupStatuses) {
        const [, statuses] = groupStatuses
        // If dropping on a specific status within the group, use that
        if (statuses.includes(dropTargetId as ApplicationStatus)) {
          newStatus = dropTargetId as ApplicationStatus
        } else {
          // Otherwise, use the first status in the group as a default
          newStatus = statuses[0]
        }
      } else {
        // Fallback to current status if we can't determine the target
        console.error('Invalid drop target:', dropTargetId)
        return
      }
    }

    if (application.status === newStatus) {
      return
    }

    const oldStatus = application.status

    // Optimistic update: Update UI immediately
    const updatedApplications = optimisticApplications.map(app =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    )
    setOptimisticApplications(updatedApplications)

    // Announce status change for screen readers
    setAnnouncement(
      `${application.company_name} moved from ${STATUS_LABELS[oldStatus]} to ${STATUS_LABELS[newStatus]}`
    )

    try {
      // Call the API to persist the change
      await onUpdateStatus(applicationId, newStatus)
    } catch (error) {
      // Rollback on error
      console.error('Failed to update application status:', error)
      setOptimisticApplications(applications)
      setAnnouncement(`Failed to move ${application.company_name}. Please try again.`)
    }
  }

  const activeApplication = React.useMemo(
    () => optimisticApplications.find(app => app.id === activeId),
    [activeId, optimisticApplications]
  )

  const toggleGroupExpansion = (group: StatusGroup) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const orderedGroups: StatusGroup[] = ['active_pipeline', 'in_progress', 'offers', 'closed']

  return (
    <div
      role="region"
      aria-label="Job applications kanban board"
      className="flex h-full w-full flex-col"
    >
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div data-testid="kanban-dnd-context" className="h-full w-full">
          <div className="flex flex-wrap gap-4 p-4 pb-8">
            {orderedGroups.map(group => (
              <GroupColumn
                key={group}
                group={group}
                applications={groupedApplications[group]}
                applicationsByStatus={applicationsByStatus}
                activeId={activeId}
                onApplicationClick={onApplicationClick}
                isExpanded={expandedGroups.has(group)}
                onToggleExpand={() => toggleGroupExpansion(group)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeApplication ? (
            <div className="rotate-3 cursor-grabbing glass-heavy shadow-glass-dramatic rounded-glass animate-spring-bounce-in">
              <ApplicationCard application={activeApplication} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

KanbanBoardV2.displayName = 'KanbanBoardV2'
