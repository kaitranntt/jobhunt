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
import { ApplicationCard } from './ApplicationCard'
import { Badge } from '@/components/ui/badge'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

interface KanbanBoardProps {
  applications: Application[]
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => Promise<void>
  onApplicationClick?: (application: Application) => void
  isLoading?: boolean
}

const ALL_STATUSES: ApplicationStatus[] = [
  'wishlist',
  'applied',
  'phone_screen',
  'assessment',
  'take_home',
  'interviewing',
  'final_round',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
  'ghosted',
]

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

interface SortableApplicationProps {
  application: Application
  isDragging: boolean
  onApplicationClick?: (application: Application) => void
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

interface KanbanColumnProps {
  status: ApplicationStatus
  applications: Application[]
  activeId: string | null
  onApplicationClick?: (application: Application) => void
}

function KanbanColumn({ status, applications, activeId, onApplicationClick }: KanbanColumnProps) {
  const count = applications.length

  return (
    <div className="flex min-w-[280px] flex-col rounded-lg border bg-muted/40 p-4 md:min-w-[320px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>

      <SortableContext
        items={applications.map(app => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {applications.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <p className="text-sm text-muted-foreground">No applications</p>
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

export function KanbanBoard({
  applications,
  onUpdateStatus,
  onApplicationClick,
  isLoading = false,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [optimisticApplications, setOptimisticApplications] =
    React.useState<Application[]>(applications)
  const [announcement, setAnnouncement] = React.useState<string>('')

  // Update optimistic state when applications prop changes
  React.useEffect(() => {
    setOptimisticApplications(applications)
  }, [applications])

  // Group applications by status with memoization for performance
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) {
      return
    }

    const applicationId = active.id as string
    const newStatus = over.id as ApplicationStatus

    // Find the application being dragged
    const application = optimisticApplications.find(app => app.id === applicationId)

    if (!application || application.status === newStatus) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

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
        <div data-testid="kanban-dnd-context" className="overflow-x-auto">
          <div className="flex gap-4 p-4 pb-8">
            {ALL_STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                applications={applicationsByStatus[status]}
                activeId={activeId}
                onApplicationClick={onApplicationClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeApplication ? (
            <div className="rotate-3 cursor-grabbing">
              <ApplicationCard application={activeApplication} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

KanbanBoard.displayName = 'KanbanBoard'
