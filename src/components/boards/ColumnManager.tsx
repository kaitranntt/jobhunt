'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, Edit, Plus, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BoardColumn } from '@/lib/types/database.types'

interface ColumnManagerProps {
  isOpen: boolean
  onClose: () => void
  columns: BoardColumn[]
  onCreateColumn: (column: {
    name: string
    color: string
    position: number
    wip_limit: number
  }) => Promise<void>
  onUpdateColumn: (
    id: string,
    updates: {
      name?: string
      color?: string
      wip_limit?: number
    }
  ) => Promise<void>
  onDeleteColumn: (id: string) => Promise<void>
  onReorderColumns: (columnIds: string[]) => Promise<void>
}

const PREDEFINED_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
]

function ColumnForm({
  column,
  onSubmit,
  onCancel,
  isLoading = false,
}: {
  column?: BoardColumn
  onSubmit: (data: { name: string; color: string; wip_limit: number }) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const [formData, setFormData] = useState({
    name: column?.name || '',
    color: column?.color || PREDEFINED_COLORS[0],
    wip_limit: column?.wip_limit || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Column Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Phone Screen"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Column Color</Label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, color }))}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                formData.color === color
                  ? 'border-primary scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              )}
              style={{ backgroundColor: color }}
              disabled={isLoading}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.color }} />
          <span className="text-sm text-gray-600">{formData.color}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wip_limit">WIP Limit (0 = no limit)</Label>
        <Slider
          id="wip_limit"
          min={0}
          max={20}
          step={1}
          value={[formData.wip_limit]}
          onValueChange={([value]) => setFormData(prev => ({ ...prev, wip_limit: value }))}
          disabled={isLoading}
          className="w-full"
        />
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>No limit</span>
          <span className="font-medium">{formData.wip_limit}</span>
          <span>Max 20</span>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? 'Saving...' : column ? 'Update Column' : 'Create Column'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function SortableColumnListItem({
  column,
  onEdit,
  onDelete,
  isDefault,
}: {
  column: BoardColumn
  onEdit: () => void
  onDelete: () => void
  isDefault: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-4 border border-gray-200 rounded-lg glass-ultra cursor-move',
        isDragging && 'shadow-lg border-blue-400'
      )}
      {...attributes}
    >
      <div className="flex items-center gap-3">
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </div>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
        <div>
          <div className="font-medium text-label-primary">{column.name}</div>
          <div className="text-sm text-label-secondary">
            {column.wip_limit > 0 ? `WIP: ${column.wip_limit}` : 'No WIP limit'}
          </div>
        </div>
        {isDefault && (
          <Badge variant="secondary" className="text-xs">
            Default
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>

        {!isDefault && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Column</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the "{column.name}" column? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

function ColumnDragOverlay({ column, isDefault }: { column: BoardColumn; isDefault: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 border-2 border-blue-400 rounded-lg glass-ultra shadow-lg opacity-90">
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-blue-600" />
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
        <div>
          <div className="font-medium text-label-primary">{column.name}</div>
          <div className="text-sm text-label-secondary">
            {column.wip_limit > 0 ? `WIP: ${column.wip_limit}` : 'No WIP limit'}
          </div>
        </div>
        {isDefault && (
          <Badge variant="secondary" className="text-xs">
            Default
          </Badge>
        )}
      </div>
    </div>
  )
}

export function ColumnManager({
  isOpen,
  onClose,
  columns,
  onCreateColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns,
}: ColumnManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reorderedColumns, setReorderedColumns] = useState<BoardColumn[]>(columns)
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  React.useEffect(() => {
    if (isOpen) {
      setReorderedColumns(columns)
      setIsCreating(false)
      setEditingColumn(null)
    }
  }, [isOpen, columns])

  const handleCreateColumn = async (data: { name: string; color: string; wip_limit: number }) => {
    setIsLoading(true)
    try {
      const position = columns.length
      await onCreateColumn({ ...data, position })
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create column:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateColumn = async (
    id: string,
    updates: {
      name?: string
      color?: string
      wip_limit?: number
    }
  ) => {
    setIsLoading(true)
    try {
      await onUpdateColumn(id, updates)
      setEditingColumn(null)
    } catch (error) {
      console.error('Failed to update column:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteColumn = async (id: string) => {
    setIsLoading(true)
    try {
      await onDeleteColumn(id)
    } catch (error) {
      console.error('Failed to delete column:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReorder = async () => {
    setIsLoading(true)
    try {
      const columnIds = reorderedColumns.map(col => col.id)
      await onReorderColumns(columnIds)
      onClose()
    } catch (error) {
      console.error('Failed to reorder columns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) {
      return
    }

    if (active.id !== over.id) {
      const oldIndex = reorderedColumns.findIndex(col => col.id === active.id)
      const newIndex = reorderedColumns.findIndex(col => col.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumns = arrayMove(reorderedColumns, oldIndex, newIndex)
        setReorderedColumns(newColumns)
      }
    }
  }

  const hasChanges = reorderedColumns.some((col, index) => columns[index]?.id !== col.id)

  const activeColumn = reorderedColumns.find(col => col.id === activeId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
          <DialogDescription>Add, edit, or reorder your Kanban board columns.</DialogDescription>
        </DialogHeader>

        {/* Create/Edit Column Form */}
        {(isCreating || editingColumn) && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{editingColumn ? 'Edit Column' : 'Create New Column'}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false)
                  setEditingColumn(null)
                }}
              >
                Cancel
              </Button>
            </div>

            <ColumnForm
              column={editingColumn || undefined}
              onSubmit={async data => {
                if (editingColumn) {
                  await handleUpdateColumn(editingColumn.id, data)
                } else {
                  await handleCreateColumn(data)
                }
              }}
              onCancel={() => {
                setIsCreating(false)
                setEditingColumn(null)
              }}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Columns List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Columns (Drag to reorder)</h3>
            {!isCreating && !editingColumn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Column
              </Button>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={reorderedColumns.map(col => col.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {reorderedColumns.map(column => (
                  <SortableColumnListItem
                    key={column.id}
                    column={column}
                    isDefault={column.is_default}
                    onEdit={() => setEditingColumn(column)}
                    onDelete={() => handleDeleteColumn(column.id)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeColumn && (
                <ColumnDragOverlay column={activeColumn} isDefault={activeColumn.is_default} />
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Reorder Actions */}
        {hasChanges && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Column order changed
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Save to apply the new column order
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReorderedColumns(columns)}
                disabled={isLoading}
              >
                Reset
              </Button>
              <Button size="sm" onClick={handleReorder} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Order'}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

ColumnManager.displayName = 'ColumnManager'
