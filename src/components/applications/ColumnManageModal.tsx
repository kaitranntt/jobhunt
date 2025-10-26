'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { Plus, Settings, Trash2, Edit2, Save, X } from 'lucide-react'
import type {
  ColumnConfig,
  CreateColumnData,
  UpdateColumnData,
  ColumnColor,
  ColumnType,
} from '@/lib/types/column.types'
import { columnStorage } from '@/lib/storage/column-storage'
import { getAvailableColorOptions, DEFAULT_COLUMN_ICONS } from '@/lib/utils/column-colors'
import { DraggableColumnList } from './DraggableColumnList'

interface ColumnManageModalProps {
  isOpen: boolean
  onClose: () => void
  onColumnsChange: (columns: ColumnConfig[]) => void
}

function ColumnItem({
  column,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onColorChange,
  onIconChange,
  onNameChange,
  onDescriptionChange,
}: {
  column: ColumnConfig
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onColorChange: (color: ColumnColor) => void
  onIconChange: (icon: string) => void
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
}) {
  const [editName, setEditName] = useState(column.name)
  const [editDescription, setEditDescription] = useState(column.description || '')
  const [editColor, setEditColor] = useState(column.color)
  const [editIcon, setEditIcon] = useState(column.icon || '')

  const handleSave = () => {
    onNameChange(editName)
    onDescriptionChange(editDescription)
    onColorChange(editColor)
    onIconChange(editIcon)
    onSave()
  }

  const handleCancel = () => {
    setEditName(column.name)
    setEditDescription(column.description || '')
    setEditColor(column.color)
    setEditIcon(column.icon || '')
    onCancel()
  }

  return (
    <div className="w-full">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={editIcon}
              onChange={e => setEditIcon(e.target.value)}
              className="text-sm bg-transparent border border-label-quaternary/20 rounded px-2 py-1"
            >
              <option value="">Select icon...</option>
              {DEFAULT_COLUMN_ICONS.map(icon => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="h-8 text-sm font-semibold flex-1"
              placeholder="Column name"
            />
          </div>
          <Input
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            className="h-8 text-sm"
            placeholder="Column description (optional)"
          />
          <div className="flex gap-1">
            {getAvailableColorOptions().map(color => (
              <button
                key={color.value}
                onClick={() => setEditColor(color.value)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all',
                  color.preview,
                  editColor === color.value
                    ? 'border-label-primary scale-110'
                    : 'border-transparent hover:border-label-secondary'
                )}
                title={color.label}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!editName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-light rounded-glass p-4 border border-label-quaternary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-lg">{column.icon || '📋'}</span>
              <div>
                <h4 className="font-semibold text-label-primary truncate">{column.name}</h4>
                {column.description && (
                  <p className="text-sm text-label-secondary truncate">{column.description}</p>
                )}
              </div>
              {column.isCustom && (
                <Badge variant="secondary" className="text-xs">
                  Custom
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {column.isCustom && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={onEdit}
                  title="Edit column"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {column.isCustom && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-error hover:bg-error/10"
                  onClick={onDelete}
                  title="Delete column"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ColumnManageModal({ isOpen, onClose, onColumnsChange }: ColumnManageModalProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingColumn, setDeletingColumn] = useState<ColumnConfig | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newColumn, setNewColumn] = useState<CreateColumnData>({
    name: '',
    description: '',
    color: 'blue',
    icon: '',
  })

  React.useEffect(() => {
    if (isOpen) {
      setColumns(columnStorage.getColumns())
    }
  }, [isOpen])

  const refreshColumns = () => {
    const updatedColumns = columnStorage.getColumns()
    setColumns(updatedColumns)
    onColumnsChange(updatedColumns)
  }

  const handleColumnReorder = (newOrder: ColumnType[]) => {
    columnStorage.reorderColumns(newOrder)
    refreshColumns()
  }

  const handleCreateColumn = () => {
    if (!newColumn.name.trim()) return

    columnStorage.createCustomColumn(newColumn)
    setNewColumn({ name: '', description: '', color: 'blue', icon: '' })
    setShowAddForm(false)
    refreshColumns()
  }

  const handleUpdateColumn = (columnId: string, updates: Partial<UpdateColumnData>) => {
    columnStorage.updateCustomColumn(columnId, updates)
    refreshColumns()
  }

  const handleDeleteColumn = (column: ColumnConfig) => {
    setDeletingColumn(column)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteColumn = () => {
    if (deletingColumn && deletingColumn.isCustom) {
      columnStorage.deleteCustomColumn(deletingColumn.id)
      refreshColumns()
    }
    setDeleteDialogOpen(false)
    setDeletingColumn(null)
  }

  const handleColumnEdit = (columnId: string) => {
    setEditingId(columnId)
  }

  const handleColumnSave = () => {
    setEditingId(null)
  }

  const handleColumnCancel = () => {
    setEditingId(null)
  }

  const handleColorChange = (columnId: string, color: ColumnColor) => {
    handleUpdateColumn(columnId, { color })
  }

  const handleIconChange = (columnId: string, icon: string) => {
    handleUpdateColumn(columnId, { icon })
  }

  const handleNameChange = (columnId: string, name: string) => {
    handleUpdateColumn(columnId, { name })
  }

  const handleDescriptionChange = (columnId: string, description: string) => {
    handleUpdateColumn(columnId, { description })
  }

  const coreColumns = columns.filter(col => !col.isCustom)
  const customColumns = columns.filter(col => col.isCustom)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-heavy">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Columns
            </DialogTitle>
            <DialogDescription>
              Customize your kanban board by adding, editing, or removing columns. Core columns
              cannot be deleted but can be reordered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Core Columns */}
            <div>
              <h3 className="text-sm font-semibold text-label-primary mb-3">Core Columns</h3>
              <DraggableColumnList columns={coreColumns} onReorder={handleColumnReorder}>
                {(column, _isDragging) => (
                  <ColumnItem
                    column={column}
                    isEditing={editingId === column.id}
                    onEdit={() => handleColumnEdit(column.id)}
                    onSave={handleColumnSave}
                    onCancel={handleColumnCancel}
                    onDelete={() => handleDeleteColumn(column)}
                    onColorChange={color => handleColorChange(column.id, color)}
                    onIconChange={icon => handleIconChange(column.id, icon)}
                    onNameChange={name => handleNameChange(column.id, name)}
                    onDescriptionChange={description =>
                      handleDescriptionChange(column.id, description)
                    }
                  />
                )}
              </DraggableColumnList>
            </div>

            {/* Custom Columns */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-label-primary">Custom Columns</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="glass-ultra border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>

              {showAddForm && (
                <div className="glass-light rounded-glass p-4 border border-label-quaternary/20 mb-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={newColumn.icon}
                        onChange={e => setNewColumn({ ...newColumn, icon: e.target.value })}
                        className="text-sm bg-transparent border border-label-quaternary/20 rounded px-2 py-1"
                      >
                        <option value="">Select icon...</option>
                        {DEFAULT_COLUMN_ICONS.map(icon => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={newColumn.name}
                        onChange={e => setNewColumn({ ...newColumn, name: e.target.value })}
                        placeholder="Column name"
                        className="flex-1"
                      />
                    </div>
                    <Input
                      value={newColumn.description}
                      onChange={e => setNewColumn({ ...newColumn, description: e.target.value })}
                      placeholder="Column description (optional)"
                    />
                    <div className="flex gap-1">
                      {getAvailableColorOptions().map(color => (
                        <button
                          key={color.value}
                          onClick={() => setNewColumn({ ...newColumn, color: color.value })}
                          className={cn(
                            'w-6 h-6 rounded-full border-2 transition-all',
                            color.preview,
                            newColumn.color === color.value
                              ? 'border-label-primary scale-110'
                              : 'border-transparent hover:border-label-secondary'
                          )}
                          title={color.label}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateColumn}
                        disabled={!newColumn.name.trim()}
                      >
                        Create Column
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false)
                          setNewColumn({ name: '', description: '', color: 'blue', icon: '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {customColumns.length === 0 ? (
                  <div className="glass-ultra rounded-glass p-8 text-center border-2 border-dashed border-label-quaternary/20">
                    <p className="text-label-tertiary text-sm">No custom columns yet</p>
                    <p className="text-label-quaternary text-xs mt-1">
                      Add custom columns to track additional application stages
                    </p>
                  </div>
                ) : (
                  <DraggableColumnList columns={customColumns} onReorder={handleColumnReorder}>
                    {(column, _isDragging) => (
                      <ColumnItem
                        column={column}
                        isEditing={editingId === column.id}
                        onEdit={() => handleColumnEdit(column.id)}
                        onSave={handleColumnSave}
                        onCancel={handleColumnCancel}
                        onDelete={() => handleDeleteColumn(column)}
                        onColorChange={color => handleColorChange(column.id, color)}
                        onIconChange={icon => handleIconChange(column.id, icon)}
                        onNameChange={name => handleNameChange(column.id, name)}
                        onDescriptionChange={description =>
                          handleDescriptionChange(column.id, description)
                        }
                      />
                    )}
                  </DraggableColumnList>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-label-quaternary/20">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-heavy">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingColumn?.name}"? This action cannot be
              undone. Any applications in this column will need to be moved to other columns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteColumn}
              className="bg-error hover:bg-error/90 text-error-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
