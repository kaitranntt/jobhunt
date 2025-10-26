/**
 * Column Icon Utilities
 * Simplified utilities for column icons after color removal
 */

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

export function getColumnIcon(columnId: string, customIcon?: string): string {
  if (customIcon) return customIcon
  return COLUMN_ICON_MAP[columnId] || '📋'
}
