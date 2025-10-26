/**
 * Custom Column Configuration Types
 * Extends the existing kanban board to support user-defined columns
 */

import type { ApplicationStatus } from './database.types'

// Re-export ApplicationStatus for convenience
export type { ApplicationStatus }

export type ColumnType =
  | 'saved'
  | 'applied'
  | 'interview'
  | 'offers'
  | 'closed'
  | `custom_${string}`

export interface CustomColumn {
  id: string
  name: string
  description?: string
  icon?: string
  isCustom: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface ColumnConfig {
  id: ColumnType
  name: string
  description?: string
  icon?: string
  isCustom: boolean
  order: number
  statuses?: ApplicationStatus[] // For custom columns, can map to specific statuses
}

export interface CreateColumnData {
  name: string
  description?: string
  icon?: string
}

export interface UpdateColumnData {
  name?: string
  description?: string
  icon?: string
  order?: number
}

export interface ColumnStorage {
  columns: ColumnConfig[]
  customColumns: CustomColumn[]
  lastUpdated: string
}

// Core columns that cannot be deleted or reordered beyond their initial positions
export const CORE_COLUMNS: ColumnType[] = ['saved', 'applied', 'interview', 'offers', 'closed']
