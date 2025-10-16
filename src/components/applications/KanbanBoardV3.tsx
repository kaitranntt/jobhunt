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
import {
  Settings,
  Download,
  BarChart3,
  Plus,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { ApplicationCard } from './ApplicationCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Application, Board, BoardColumn, BoardSettings } from '@/lib/types/database.types'
import { KanbanOnboardingTour, useKanbanOnboarding } from '@/components/boards/KanbanOnboardingTour'

interface EnhancedKanbanBoardProps {
  applications: Application[]
  board: Board
  columns: BoardColumn[]
  settings: BoardSettings
  onUpdateApplicationStatus: (id: string, newStatus: string) => Promise<void>
  onApplicationClick?: (application: Application) => void
  onBoardSettingsClick?: () => void
  onBoardAnalyticsClick?: () => void
  onBoardExport?: (format: 'json' | 'csv') => Promise<void>
  onColumnAdd?: () => void
  onColumnEdit?: (column: BoardColumn) => void
  onColumnDelete?: (columnId: string) => void
  isLoading?: boolean
}

interface SortableApplicationProps {
  application: Application
  isDragging: boolean
  isFocused?: boolean
  onApplicationClick?: (application: Application) => void
}

function SortableApplication({
  application,
  isDragging,
  isFocused = false,
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      role="listitem"
      aria-label={`Application for ${application.job_title} at ${application.company_name}`}
      tabIndex={isFocused ? 0 : -1}
      className={isFocused ? 'ring-2 ring-ring ring-offset-2 rounded-md' : ''}
    >
      <ApplicationCard
        application={application}
        isDragging={isDragging}
        onClick={() => onApplicationClick?.(application)}
        dragHandleProps={{ ref: setActivatorNodeRef, ...listeners }}
      />
    </div>
  )
}

interface WIPIndicatorProps {
  current: number
  limit: number
}

function WIPIndicator({ current, limit }: WIPIndicatorProps) {
  if (limit === 0) return null // No limit

  const isOverLimit = current >= limit
  const isNearLimit = current >= limit - 1

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        isOverLimit
          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          : isNearLimit
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      )}
      data-testid="wip-indicator"
    >
      {isOverLimit ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
      {current}/{limit}
    </div>
  )
}

interface EnhancedColumnProps {
  column: BoardColumn
  applications: Application[]
  activeId: string | null
  settings: BoardSettings
  isFocused?: boolean
  focusedApplicationIndex?: number
  onApplicationClick?: (application: Application) => void
  onEdit?: () => void
  onDelete?: () => void
}

function EnhancedColumn({
  column,
  applications,
  activeId,
  settings,
  isFocused = false,
  focusedApplicationIndex = 0,
  onApplicationClick,
  onEdit,
  onDelete,
}: EnhancedColumnProps) {
  const currentCount = applications.length
  const showWIP = column.wip_limit > 0

  return (
    <div
      className={cn(
        'flex flex-col w-full lg:w-auto lg:min-w-[280px] lg:flex-1 rounded-glass p-4 lg:p-6 shadow-glass-soft backdrop-blur-sm',
        'border-2',
        settings.show_empty_columns || applications.length > 0 ? 'opacity-100' : 'opacity-60',
        isFocused ? 'ring-2 ring-ring ring-offset-2' : ''
      )}
      style={{
        borderColor: column.color + '40',
        backgroundColor: column.color + '10',
      }}
      data-testid={`board-column-${column.id}`}
      role="region"
      aria-label={`${column.name} column with ${applications.length} applications`}
      aria-roledescription={`Kanban column for ${column.name} status`}
      tabIndex={isFocused ? 0 : -1}
    >
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="text-lg font-semibold text-label-primary">{column.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {settings.show_column_counts && (
            <Badge
              variant="secondary"
              className="text-xs glass-ultra border-0 px-3 py-1"
              data-testid={`count-badge-${column.id}`}
            >
              {currentCount}
            </Badge>
          )}

          {/* WIP Limit Indicator */}
          {showWIP && <WIPIndicator current={currentCount} limit={column.wip_limit} />}

          {/* Column Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 glass-ultra rounded-full hover:glass-light transition-all"
              >
                <MoreHorizontal className="h-4 w-4 text-label-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit Column</DropdownMenuItem>
              {!column.is_default && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  Delete Column
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Applications */}
      <SortableContext
        items={applications.map(app => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="flex flex-1 flex-col gap-3 min-h-[200px]"
          role="list"
          aria-label={`Applications in ${column.name} column`}
        >
          {applications.length === 0 ? (
            <div
              className="flex flex-1 items-center justify-center"
              role="status"
              aria-live="polite"
            >
              <div className="text-center text-label-tertiary">
                <div className="mb-2 text-sm">No applications</div>
                <div className="text-xs">Drag applications here</div>
              </div>
            </div>
          ) : (
            applications.map((application, index) => (
              <SortableApplication
                key={application.id}
                application={application}
                isDragging={application.id === activeId}
                isFocused={isFocused && index === focusedApplicationIndex}
                onApplicationClick={onApplicationClick}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function EnhancedKanbanBoard({
  applications,
  board,
  columns,
  settings,
  onUpdateApplicationStatus,
  onApplicationClick,
  onBoardSettingsClick,
  onBoardAnalyticsClick,
  onBoardExport,
  onColumnAdd,
  onColumnEdit,
  onColumnDelete,
  isLoading = false,
}: EnhancedKanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [optimisticApplications, setOptimisticApplications] =
    React.useState<Application[]>(applications)
  const [focusedColumnIndex, setFocusedColumnIndex] = React.useState<number>(0)
  const [focusedApplicationIndex, setFocusedApplicationIndex] = React.useState<number>(0)

  // Onboarding tour state
  const { shouldShow, markAsCompleted } = useKanbanOnboarding()
  const [isTourOpen, setIsTourOpen] = React.useState(false)

  React.useEffect(() => {
    if (shouldShow && !isLoading) {
      setIsTourOpen(true)
    }
  }, [shouldShow, isLoading])

  // Update optimistic state when applications prop changes
  React.useEffect(() => {
    setOptimisticApplications(applications)
  }, [applications])

  // Group applications by column based on status mapping
  const applicationsByColumn = React.useMemo(() => {
    const grouped: Record<string, Application[]> = {}

    // Initialize empty arrays for all columns
    columns.forEach(column => {
      grouped[column.id] = []
    })

    // Group applications by status, then map to columns
    optimisticApplications.forEach(app => {
      // Find the corresponding column based on status
      const targetColumn = columns.find(col => {
        // For backward compatibility, map status to column name
        const statusColumnName = getStatusColumnName(app.status)
        return col.name === statusColumnName
      })

      if (targetColumn) {
        grouped[targetColumn.id].push(app)
      }
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
    const dropTargetId = over.id as string

    // Find the application being dragged
    const application = optimisticApplications.find(app => app.id === applicationId)

    if (!application) {
      return
    }

    let newStatus: string | null = null

    // Check if dropping on a column
    const targetColumn = columns.find(col => col.id === dropTargetId)
    if (targetColumn) {
      // Map column name back to status for backward compatibility
      newStatus = getMappedStatus(targetColumn.name)
    } else {
      // Check if dropping on another application card
      const targetApplication = optimisticApplications.find(app => app.id === dropTargetId)
      if (targetApplication) {
        newStatus = targetApplication.status
      }
    }

    if (!newStatus || newStatus === application.status) {
      return
    }

    // const oldStatus = application.status // Not used, keeping for reference

    // Optimistic update: Update UI immediately
    const updatedApplications = optimisticApplications.map(app =>
      app.id === applicationId ? { ...app, status: newStatus as Application['status'] } : app
    )
    setOptimisticApplications(updatedApplications)

    try {
      // Call the API to persist the change
      await onUpdateApplicationStatus(applicationId, newStatus)
    } catch (error) {
      // Rollback on error
      console.error('Failed to update application status:', error)
      setOptimisticApplications(applications)
    }
  }

  const activeApplication = React.useMemo(
    () => optimisticApplications.find(app => app.id === activeId),
    [activeId, optimisticApplications]
  )

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      await onBoardExport?.(format)
    } catch (error) {
      console.error('Failed to export board data:', error)
    }
  }

  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveId(null)
        return
      }

      // Navigation keys
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          setFocusedColumnIndex(prev => Math.max(0, prev - 1))
          setFocusedApplicationIndex(0)
          break
        case 'ArrowRight':
          event.preventDefault()
          setFocusedColumnIndex(prev => Math.min(columns.length - 1, prev + 1))
          setFocusedApplicationIndex(0)
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedApplicationIndex(prev => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          event.preventDefault()
          const columnApps = applicationsByColumn[columns[focusedColumnIndex]?.id] || []
          setFocusedApplicationIndex(prev => Math.min(columnApps.length - 1, prev + 1))
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          const currentColumnApps = applicationsByColumn[columns[focusedColumnIndex]?.id] || []
          const focusedApp = currentColumnApps[focusedApplicationIndex]
          if (focusedApp) {
            onApplicationClick?.(focusedApp)
          }
          break
      }
    },
    [columns, applicationsByColumn, focusedColumnIndex, focusedApplicationIndex, onApplicationClick]
  )

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

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
      aria-roledescription="Kanban board for managing job applications"
      className="flex h-full w-full flex-col"
      tabIndex={0}
    >
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-border/50 glass-ultra">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-label-primary truncate">
            {board.name}
          </h1>
          {board.description && (
            <p className="text-sm text-label-secondary mt-1 line-clamp-2">{board.description}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            className="glass-ultra border-0 whitespace-nowrap"
            data-testid="export-json-button"
          >
            <Download className="h-4 w-4 mr-2 sm:mr-2" />
            <span className="hidden sm:inline">Export JSON</span>
            <span className="sm:hidden">JSON</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="glass-ultra border-0 whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBoardAnalyticsClick}
            className="glass-ultra border-0 whitespace-nowrap"
            data-testid="analytics-button"
          >
            <BarChart3 className="h-4 w-4 mr-2 sm:mr-2" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBoardSettingsClick}
            className="glass-ultra border-0 whitespace-nowrap"
            data-testid="settings-button"
          >
            <Settings className="h-4 w-4 mr-2 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Setup</span>
          </Button>
          <Button variant="default" size="sm" onClick={onColumnAdd} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2 sm:mr-2" />
            <span className="hidden sm:inline">Add Column</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div data-testid="kanban-dnd-context" className="h-full w-full flex-1 overflow-auto">
          <div
            className="flex flex-col lg:flex-row gap-4 p-4 pb-8"
            role="group"
            aria-label="Kanban columns"
          >
            {columns.map((column, index) => (
              <EnhancedColumn
                key={column.id}
                column={column}
                applications={applicationsByColumn[column.id] || []}
                activeId={activeId}
                settings={settings}
                isFocused={index === focusedColumnIndex}
                focusedApplicationIndex={focusedApplicationIndex}
                onApplicationClick={onApplicationClick}
                onEdit={() => onColumnEdit?.(column)}
                onDelete={() => onColumnDelete?.(column.id)}
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

      {/* Onboarding Tour */}
      <KanbanOnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onStartTour={markAsCompleted}
      />
    </div>
  )
}

// Helper functions for backward compatibility
function getStatusColumnName(status: Application['status']): string {
  const statusColumnMap: Record<Application['status'], string> = {
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

  return statusColumnMap[status] || 'Applied'
}

function getMappedStatus(columnName: string): Application['status'] | null {
  const columnStatusMap: Record<string, Application['status']> = {
    Wishlist: 'wishlist',
    Applied: 'applied',
    'Phone Screen': 'phone_screen',
    Assessment: 'assessment',
    'Take Home': 'take_home',
    Interviewing: 'interviewing',
    'Final Round': 'final_round',
    Offered: 'offered',
    Accepted: 'accepted',
    Rejected: 'rejected',
    Withdrawn: 'withdrawn',
    Ghosted: 'ghosted',
  }

  return columnStatusMap[columnName] || null
}

EnhancedKanbanBoard.displayName = 'EnhancedKanbanBoard'
