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
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
import type { ColumnConfig, ColumnType } from '@/lib/types/column.types'
import { getColumnIcon } from '@/lib/utils/column-colors'

interface DraggableColumnListProps {
  columns: ColumnConfig[]
  onReorder: (newOrder: ColumnType[]) => void
  children: (column: ColumnConfig, isDragging: boolean) => React.ReactNode
}

interface DraggableColumnItemProps {
  column: ColumnConfig
  children: (isDragging: boolean) => React.ReactNode
}

function DraggableColumnItem({ column, children }: DraggableColumnItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative group', isDragging && 'opacity-50')}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <div
          {...listeners}
          className="flex items-center justify-center w-8 h-8 rounded-md glass-light hover:glass-medium transition-all cursor-move opacity-0 group-hover:opacity-100 touch-none"
        >
          <GripVertical className="h-4 w-4 text-label-tertiary" />
        </div>
        <div className="flex-1 min-w-0">{children(isDragging)}</div>
      </div>
    </div>
  )
}

export function DraggableColumnList({ columns, onReorder, children }: DraggableColumnListProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    if (active.id !== over.id) {
      const oldIndex = columns.findIndex(col => col.id === active.id)
      const newIndex = columns.findIndex(col => col.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedColumns = arrayMove(columns, oldIndex, newIndex)
        const newOrder = reorderedColumns.map(col => col.id)
        onReorder(newOrder)
      }
    }
  }

  const activeColumn = columns.find(col => col.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columns.map(col => col.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {columns.map(column => (
            <DraggableColumnItem key={column.id} column={column}>
              {isDragging => children(column, isDragging)}
            </DraggableColumnItem>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeColumn ? (
          <div className="glass-heavy rounded-glass p-4 shadow-glass-dramatic rotate-2 scale-105">
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-label-tertiary" />
              <div className="flex items-center gap-2">
                <span className="text-lg">{getColumnIcon(activeColumn.id, activeColumn.icon)}</span>
                <div>
                  <h4 className="font-semibold text-label-primary">{activeColumn.name}</h4>
                  {activeColumn.description && (
                    <p className="text-sm text-label-secondary">{activeColumn.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
