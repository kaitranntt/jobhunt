/**
 * Column Color Utilities
 * Maps color names to CSS classes using the existing design system
 */

import type { ColumnColor } from '@/lib/types/column.types'

export const COLUMN_COLOR_MAP: Record<ColumnColor, string> = {
  blue: 'glass-light bg-blue-500/5 border-blue-300/20 dark:border-blue-600/20',
  purple: 'glass-light bg-purple-500/5 border-purple-300/20 dark:border-purple-600/20',
  pink: 'glass-light bg-pink-500/5 border-pink-300/20 dark:border-pink-600/20',
  red: 'glass-light bg-red-500/5 border-red-300/20 dark:border-red-600/20',
  orange: 'glass-light bg-orange-500/5 border-orange-300/20 dark:border-orange-600/20',
  yellow: 'glass-light bg-yellow-500/5 border-yellow-300/20 dark:border-yellow-600/20',
  green: 'glass-light bg-green-500/5 border-green-300/20 dark:border-green-600/20',
  teal: 'glass-light bg-teal-500/5 border-teal-300/20 dark:border-teal-600/20',
  indigo: 'glass-light bg-indigo-500/5 border-indigo-300/20 dark:border-indigo-600/20',
  slate: 'glass-light bg-slate-500/5 border-slate-300/20 dark:border-slate-600/20',
}

export const COLUMN_ICON_MAP: Record<string, string> = {
  saved: '💾',
  applied: '📝',
  interview: '🎯',
  offers: '🎉',
  closed: '❌',
}

export const DEFAULT_COLUMN_ICONS: string[] = [
  '📌',
  '🔥',
  '⭐',
  '📊',
  '🎯',
  '💡',
  '🔍',
  '📋',
  '📝',
  '✅',
  '🚀',
  '💎',
  '🏆',
  '🎪',
  '🌟',
  '⚡',
  '🔔',
  '📌',
  '💼',
  '🎨',
]

export function getColumnColorClass(color: ColumnColor): string {
  return COLUMN_COLOR_MAP[color]
}

export function getColumnIcon(columnId: string, customIcon?: string): string {
  if (customIcon) return customIcon
  return COLUMN_ICON_MAP[columnId] || '📋'
}

export function getAvailableColorOptions(): Array<{
  value: ColumnColor
  label: string
  preview: string
}> {
  return [
    { value: 'blue', label: 'Blue', preview: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', preview: 'bg-purple-500' },
    { value: 'pink', label: 'Pink', preview: 'bg-pink-500' },
    { value: 'red', label: 'Red', preview: 'bg-red-500' },
    { value: 'orange', label: 'Orange', preview: 'bg-orange-500' },
    { value: 'yellow', label: 'Yellow', preview: 'bg-yellow-500' },
    { value: 'green', label: 'Green', preview: 'bg-green-500' },
    { value: 'teal', label: 'Teal', preview: 'bg-teal-500' },
    { value: 'indigo', label: 'Indigo', preview: 'bg-indigo-500' },
    { value: 'slate', label: 'Slate', preview: 'bg-slate-500' },
  ]
}
