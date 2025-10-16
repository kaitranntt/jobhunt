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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { Board, BoardSettings } from '@/lib/types/database.types'

interface BoardSettingsProps {
  isOpen: boolean
  onClose: () => void
  board: Board
  settings: BoardSettings
  onUpdateBoard: (updates: { name?: string; description?: string | null }) => Promise<void>
  onUpdateSettings: (updates: {
    theme?: string
    compact_mode?: boolean
    show_empty_columns?: boolean
    show_column_counts?: boolean
    enable_animations?: boolean
    auto_archive_days?: number
  }) => Promise<void>
  isLoading?: boolean
}

const THEME_OPTIONS = [
  { value: 'default', label: 'Default', description: 'Clean and professional' },
  { value: 'dark', label: 'Dark Mode', description: 'Reduced eye strain' },
  { value: 'colorful', label: 'Colorful', description: 'Vibrant and energetic' },
  { value: 'minimal', label: 'Minimal', description: 'Simple and focused' },
]

export function BoardSettings({
  isOpen,
  onClose,
  board,
  settings,
  onUpdateBoard,
  onUpdateSettings,
  isLoading = false,
}: BoardSettingsProps) {
  const [boardFormData, setBoardFormData] = useState({
    name: board.name,
    description: board.description || '',
  })

  const [settingsFormData, setSettingsFormData] = useState({
    theme: settings.theme,
    compact_mode: settings.compact_mode,
    show_empty_columns: settings.show_empty_columns,
    show_column_counts: settings.show_column_counts,
    enable_animations: settings.enable_animations,
    auto_archive_days: settings.auto_archive_days,
  })

  const [hasBoardChanges, setHasBoardChanges] = useState(false)
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setBoardFormData({
        name: board.name,
        description: board.description || '',
      })
      setSettingsFormData({
        theme: settings.theme,
        compact_mode: settings.compact_mode,
        show_empty_columns: settings.show_empty_columns,
        show_column_counts: settings.show_column_counts,
        enable_animations: settings.enable_animations,
        auto_archive_days: settings.auto_archive_days,
      })
      setHasBoardChanges(false)
      setHasSettingsChanges(false)
    }
  }, [isOpen, board, settings])

  const handleBoardChange = (field: string, value: string) => {
    setBoardFormData(prev => ({ ...prev, [field]: value }))
    setHasBoardChanges(true)
  }

  const handleSettingsChange = (field: string, value: any) => {
    setSettingsFormData(prev => ({ ...prev, [field]: value }))
    setHasSettingsChanges(true)
  }

  const handleSave = async () => {
    const promises: Promise<void>[] = []

    if (hasBoardChanges) {
      const boardUpdates: any = {}
      if (boardFormData.name !== board.name) {
        boardUpdates.name = boardFormData.name
      }
      if (boardFormData.description !== (board.description || '')) {
        boardUpdates.description = boardFormData.description || null
      }
      if (Object.keys(boardUpdates).length > 0) {
        promises.push(onUpdateBoard(boardUpdates))
      }
    }

    if (hasSettingsChanges) {
      const settingsUpdates: any = {}
      if (settingsFormData.theme !== settings.theme) {
        settingsUpdates.theme = settingsFormData.theme
      }
      if (settingsFormData.compact_mode !== settings.compact_mode) {
        settingsUpdates.compact_mode = settingsFormData.compact_mode
      }
      if (settingsFormData.show_empty_columns !== settings.show_empty_columns) {
        settingsUpdates.show_empty_columns = settingsFormData.show_empty_columns
      }
      if (settingsFormData.show_column_counts !== settings.show_column_counts) {
        settingsUpdates.show_column_counts = settingsFormData.show_column_counts
      }
      if (settingsFormData.enable_animations !== settings.enable_animations) {
        settingsUpdates.enable_animations = settingsFormData.enable_animations
      }
      if (settingsFormData.auto_archive_days !== settings.auto_archive_days) {
        settingsUpdates.auto_archive_days = settingsFormData.auto_archive_days
      }
      if (Object.keys(settingsUpdates).length > 0) {
        promises.push(onUpdateSettings(settingsUpdates))
      }
    }

    try {
      await Promise.all(promises)
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const hasChanges = hasBoardChanges || hasSettingsChanges

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
          <DialogDescription>
            Customize your Kanban board appearance and behavior.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Board Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Board Information</h3>

            <div className="space-y-2">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={boardFormData.name}
                onChange={e => handleBoardChange('name', e.target.value)}
                placeholder="e.g., Job Applications"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-description">Description</Label>
              <Textarea
                id="board-description"
                value={boardFormData.description}
                onChange={e => handleBoardChange('description', e.target.value)}
                placeholder="Optional description for your board..."
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settingsFormData.theme}
                onValueChange={value => handleSettingsChange('theme', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map(theme => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div>
                        <div className="font-medium">{theme.label}</div>
                        <div className="text-sm text-gray-500">{theme.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-gray-500">Reduce spacing between elements</p>
                </div>
                <Switch
                  checked={settingsFormData.compact_mode}
                  onCheckedChange={checked => handleSettingsChange('compact_mode', checked)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Animations</Label>
                  <p className="text-sm text-gray-500">Smooth transitions and effects</p>
                </div>
                <Switch
                  checked={settingsFormData.enable_animations}
                  onCheckedChange={checked => handleSettingsChange('enable_animations', checked)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Options</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show Empty Columns</Label>
                  <p className="text-sm text-gray-500">Display columns with no applications</p>
                </div>
                <Switch
                  checked={settingsFormData.show_empty_columns}
                  onCheckedChange={checked => handleSettingsChange('show_empty_columns', checked)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show Column Counts</Label>
                  <p className="text-sm text-gray-500">Display application count badges</p>
                </div>
                <Switch
                  checked={settingsFormData.show_column_counts}
                  onCheckedChange={checked => handleSettingsChange('show_column_counts', checked)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Advanced Settings</h3>

            <div className="space-y-2">
              <Label>Auto-Archive Applications</Label>
              <p className="text-sm text-gray-500 mb-2">
                Automatically archive rejected applications after this many days
              </p>
              <Slider
                min={0}
                max={90}
                step={7}
                value={[settingsFormData.auto_archive_days]}
                onValueChange={([value]) => handleSettingsChange('auto_archive_days', value)}
                disabled={isLoading}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Never</span>
                <span className="font-medium">{settingsFormData.auto_archive_days} days</span>
                <span>3 months</span>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Board Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Board ID:</span>
                <div className="font-mono text-xs mt-1">{board.id}</div>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <div className="font-medium">{new Date(board.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-gray-500">Default Board:</span>
                <div className="font-medium">
                  {board.is_default ? (
                    <Badge variant="secondary">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <div className="font-medium">{new Date(board.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

BoardSettings.displayName = 'BoardSettings'
