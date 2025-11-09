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
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, Settings, Plus, Search } from 'lucide-react'
import { ApplicationCard } from './ApplicationCard'
import { ColumnManageModal } from './ColumnManageModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'
import type { ColumnConfig } from '@/lib/types/column.types'
import { columnStorage } from '@/lib/storage/column-storage'
import { getColumnIcon } from '@/lib/utils/column-icons'
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll'
import { reorderApplicationsAction } from '@/app/dashboard/actions'

interface KanbanBoardV3Props {
  applications: Application[]
  onUpdateStatus: (_id: string, _newStatus: ApplicationStatus) => Promise<void>
  onApplicationClick?: (_application: Application) => void
  isLoading?: boolean
  searchQuery?: string
  onSearchChange?: (_query: string) => void
  onNewApplication?: () => void
}

// Enhanced status mapping that supports custom columns
function getColumnsStatusMap(columns: ColumnConfig[]): Record<string, ApplicationStatus[]> {
  const statusMap: Record<string, ApplicationStatus[]> = {}

  columns.forEach(column => {
    if (column.statuses) {
      // Use predefined statuses for core columns
      statusMap[column.id] = column.statuses
    } else {
      // For custom columns, we'll handle applications differently
      statusMap[column.id] = []
    }
  })

  return statusMap
}

// Legacy core status mapping for backwards compatibility
const CORE_STATUS_LABELS: Record<ApplicationStatus, string> = {
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

const CORE_EMPTY_STATE_GUIDANCE: Record<string, { heading: string; text: string; cta?: string }> = {
  saved: {
    heading: 'No saved jobs yet',
    text: "Start by adding jobs you're interested in to your wishlist",
    cta: 'Add jobs to wishlist',
  },
  applied: {
    heading: 'No applications submitted yet',
    text: 'Applications you submit will appear here',
  },
  interview: {
    heading: 'No interviews scheduled',
    text: 'When companies respond, your interviews will appear here',
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard
        application={application}
        isDragging={isDragging}
        onClick={() => onApplicationClick?.(application)}
        attributes={attributes as unknown as Record<string, unknown>}
        listeners={listeners as unknown as Record<string, unknown>}
        setNodeRef={setNodeRef}
      />
    </div>
  )
}

interface EmptyStateProps {
  column: ColumnConfig
  Icon: React.ComponentType<{ className?: string }>
}

function EmptyState({ column, Icon }: EmptyStateProps) {
  const guidance = CORE_EMPTY_STATE_GUIDANCE[column.id] || {
    heading: `No ${column.name.toLowerCase()} applications`,
    text: `Applications will appear here when you add them to this column.`,
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center glass-ultra rounded-glass border-2 border-dashed border-label-quaternary/30 p-12 text-center">
      <div className="glass-light rounded-full p-4 mb-4 border border-label-quaternary/20">
        <Icon className="h-12 w-12 text-label-tertiary" />
      </div>
      <h4 className="mb-2 font-bold text-label-primary text-base">{guidance.heading}</h4>
      <p className="mb-4 max-w-sm text-sm text-label-secondary leading-relaxed">{guidance.text}</p>
      {guidance.cta && (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="glass-light border border-label-quaternary/30"
        >
          {guidance.cta}
        </Button>
      )}
    </div>
  )
}

interface KanbanColumnProps {
  column: ColumnConfig
  applications: Application[]
  activeId: string | null
  onApplicationClick?: (_application: Application) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function DroppableKanbanColumn({
  column,
  applications,
  activeId,
  onApplicationClick,
  isExpanded,
  onToggleExpand,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      column,
    },
  })

  const count = applications.length
  const isExpandable = column.id === 'interview' && !column.isCustom

  // Use icon from column or fallback to default icons
  const icon = column.icon || getColumnIcon(column.id)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-[200px] flex-1 flex-col rounded-glass p-3 md:min-w-[240px] shadow-glass-soft backdrop-blur-sm transition-all duration-200',
        'h-full min-h-[200px]',
        'glass-light',
        isOver && 'ring-2 ring-blue-400 ring-opacity-50 shadow-glass-dramatic scale-[1.02]'
      )}
      data-testid={`column-${column.id}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isExpandable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 glass-ultra rounded-full hover:glass-light transition-all"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Collapse sub-stages' : 'Expand sub-stages'}
              data-testid={`toggle-expand-${column.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-label-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-label-primary" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full glass-light border border-label-quaternary/20">
              <span className="text-xl">{icon}</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-label-primary">{column.name}</h3>
              {column.isCustom && (
                <Badge variant="secondary" className="text-xs w-fit">
                  Custom
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-sm font-semibold glass-light border border-label-quaternary/30 px-3 py-1"
          data-testid={`count-badge-${column.id}`}
        >
          {count}
        </Badge>
      </div>

      {column.description && (
        <p className="mb-4 text-sm text-label-secondary">{column.description}</p>
      )}

      <SortableContext
        items={applications.map(app => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            'flex flex-1 flex-col gap-3 transition-all duration-200 overflow-y-auto',
            'h-full min-h-[100px] column-content'
          )}
        >
          {applications.length === 0 ? (
            <EmptyState
              column={column}
              Icon={() => (
                <span className="text-3xl">{column.icon || getColumnIcon(column.id)}</span>
              )}
            />
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
          {isOver && applications.length === 0 && (
            <div className="flex items-center justify-center h-20 border-2 border-dashed border-blue-400 rounded-glass-sm animate-pulse">
              <span className="text-blue-400 text-sm font-medium">Drop to move here</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoardV3({
  applications,
  onUpdateStatus,
  onApplicationClick,
  isLoading = false,
  searchQuery = '',
  onSearchChange,
  onNewApplication,
}: KanbanBoardV3Props) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [optimisticApplications, setOptimisticApplications] =
    React.useState<Application[]>(applications)
  const [announcement, setAnnouncement] = React.useState<string>('')
  const [expandedColumns, setExpandedColumns] = React.useState<Set<string>>(new Set())
  const [columns, setColumns] = React.useState<ColumnConfig[]>([])
  const [isManageModalOpen, setIsManageModalOpen] = React.useState(false)

  // Horizontal scroll hook for kanban container - preserves native horizontal scrolling
  const kanbanScroll = useHorizontalScroll<HTMLDivElement>({ behavior: 'auto', throttleMs: 8 })

  // Initialize columns from storage
  React.useEffect(() => {
    setColumns(columnStorage.getColumns())
  }, [])

  // Update optimistic state when applications prop changes
  React.useEffect(() => {
    setOptimisticApplications(applications)
  }, [applications])

  // Group applications by columns
  const columnApplications = React.useMemo(() => {
    const grouped: Record<string, Application[]> = {}
    const statusMap = getColumnsStatusMap(columns)

    // Initialize all columns
    columns.forEach(column => {
      grouped[column.id] = []
    })

    optimisticApplications.forEach(app => {
      // For core columns, use existing status mapping logic
      for (const [columnId, statuses] of Object.entries(statusMap)) {
        if (statuses.includes(app.status)) {
          grouped[columnId].push(app)
          return
        }
      }

      // For custom columns, we could add custom logic here
      // For now, custom columns will be empty unless we add custom status mapping
    })

    // Sort each column's applications by position
    Object.keys(grouped).forEach(columnId => {
      grouped[columnId].sort((a, b) => a.position - b.position)
    })

    return grouped
  }, [optimisticApplications, columns])

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

    // Determine the drop target - could be a card or a column
    // When dragging over a card, over.data.current.applicationId exists
    // When dragging over empty column space, over.id is the column ID
    const overData = over.data?.current as { applicationId?: string } | undefined
    const dropTargetId = overData?.applicationId || (over.id as string)

    // Find the application being dragged
    const application = optimisticApplications.find(app => app.id === applicationId)

    if (!application) {
      return
    }

    // Determine the target column
    // The dropTargetId could be either a column ID or an application ID (when dropping onto another card)
    let targetColumn = columns.find(col => col.id === dropTargetId)

    if (!targetColumn) {
      // If not a column, it might be an application ID - find which column contains that application
      const targetApplication = optimisticApplications.find(app => app.id === dropTargetId)
      if (targetApplication) {
        // Find the column that contains this application's status
        targetColumn = columns.find(col =>
          col.statuses && col.statuses.includes(targetApplication.status)
        )
      }
    }

    // If we still can't find a target column, use the over.data.column if available
    if (!targetColumn && over.data?.current) {
      const overData = over.data.current as Record<string, unknown>
      if (overData.column) {
        targetColumn = overData.column as ColumnConfig
      }
    }

    // If we still can't determine the target column, abort
    if (!targetColumn) {
      return
    }

    // Get the target statuses
    let targetStatuses: ApplicationStatus[] = []
    if (targetColumn.statuses) {
      targetStatuses = targetColumn.statuses
    }

    if (targetStatuses.length === 0) {
      // Cannot move to this column (likely a custom column without status mapping)
      return
    }

    // Use the first status in the target column
    const newStatus = targetStatuses[0]

    // Handle same-column reordering (NEW LOGIC)
    if (application.status === newStatus) {
      // Get applications in the current column
      const columnApps = columnApplications[targetColumn.id] || []

      // Find old and new indices
      const oldIndex = columnApps.findIndex(app => app.id === applicationId)
      let newIndex = columnApps.findIndex(app => app.id === dropTargetId)

      // If dropping on the column itself (not on a card), move to end
      if (newIndex === -1 && dropTargetId === targetColumn.id) {
        newIndex = columnApps.length - 1
      }

      // If indices are the same or invalid, no reordering needed
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return
      }

      // Reorder the applications array
      const reorderedApps = arrayMove(columnApps, oldIndex, newIndex)

      // Create position updates
      const positionUpdates = reorderedApps.map((app, index) => ({
        id: app.id,
        position: index + 1,
      }))

      // Optimistically update the UI
      const updatedApplications = optimisticApplications.map(app => {
        const update = positionUpdates.find(u => u.id === app.id)
        return update ? { ...app, position: update.position } : app
      })
      setOptimisticApplications(updatedApplications)

      // Announce reordering for screen readers
      setAnnouncement(`${application.company_name} reordered within ${targetColumn.name}`)

      try {
        // Persist the position changes
        await reorderApplicationsAction(positionUpdates)
      } catch (error) {
        // Rollback on error
        console.error('Failed to reorder applications:', error)
        setOptimisticApplications(applications)
        setAnnouncement(`Failed to reorder ${application.company_name}. Please try again.`)
      }

      return
    }

    // Handle cross-column move (EXISTING LOGIC)
    const oldStatus = application.status

    // Optimistic update: Update UI immediately
    const updatedApplications = optimisticApplications.map(app =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    )
    setOptimisticApplications(updatedApplications)

    // Announce status change for screen readers
    setAnnouncement(
      `${application.company_name} moved from ${CORE_STATUS_LABELS[oldStatus]} to ${CORE_STATUS_LABELS[newStatus]}`
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

  const toggleColumnExpansion = (columnId: string) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnId)) {
        newSet.delete(columnId)
      } else {
        newSet.add(columnId)
      }
      return newSet
    })
  }

  const handleColumnsChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Sort columns by order
  const orderedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <div
      role="region"
      aria-label="Job applications kanban board"
      className="flex h-full w-full flex-col"
      style={{ height: 'calc(100vh - 144px)' }}
    >
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Unified Header - Single Row */}
      <div className="flex items-center justify-between gap-4 p-4 pb-0">
        <h2 className="text-lg font-semibold text-label-primary">Application Pipeline</h2>

        {/* Search Bar - Positioned between Title and Buttons */}
        {onSearchChange && (
          <div className="flex-1 mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-tertiary" />
              <Input
                type="text"
                placeholder="Search by company or job title..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-10 glass-light rounded-glass-sm text-label-primary placeholder:text-label-tertiary shadow-glass-subtle w-full"
                style={{
                  border: '1px solid var(--glass-border-medium)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsManageModalOpen(true)}
            size="sm"
            className="btn-glass font-semibold"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Columns
          </Button>
          {onNewApplication && (
            <Button onClick={onNewApplication} size="sm" className="btn-glass font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={kanbanScroll.ref}
          data-testid="kanban-dnd-context"
          className="flex-1 w-full overflow-x-auto kanban-scrollbar"
        >
          <div
            className="flex gap-3 p-3 pb-6 min-w-max h-full"
            style={{ minHeight: 'calc(100vh - 250px)' }}
          >
            {orderedColumns.map(column => (
              <DroppableKanbanColumn
                key={column.id}
                column={column}
                applications={columnApplications[column.id] || []}
                activeId={activeId}
                onApplicationClick={onApplicationClick}
                isExpanded={expandedColumns.has(column.id)}
                onToggleExpand={() => toggleColumnExpansion(column.id)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeApplication ? (
            <div className="rotate-3 cursor-grabbing glass-heavy shadow-glass-dramatic rounded-glass animate-spring-bounce-in transform scale-105">
              <ApplicationCard application={activeApplication} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Column Management Modal */}
      <ColumnManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onColumnsChange={handleColumnsChange}
      />
    </div>
  )
}

KanbanBoardV3.displayName = 'KanbanBoardV3'
