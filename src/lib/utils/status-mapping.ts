/**
 * Status Mapping Utilities
 * Handles mapping between application statuses and custom columns
 */

import type { ApplicationStatus, ColumnConfig } from '@/lib/types/column.types'

export interface StatusMapping {
  columnId: string
  status: ApplicationStatus
}

export interface CustomStatusConfig {
  id: string
  name: string
  color: string
  description?: string
}

export function createStatusMapping(columns: ColumnConfig[]): Record<string, ApplicationStatus[]> {
  const statusMap: Record<string, ApplicationStatus[]> = {}

  columns.forEach(column => {
    if (column.statuses) {
      // Core columns with predefined statuses
      statusMap[column.id] = column.statuses
    } else {
      // Custom columns - initially empty, can be configured later
      statusMap[column.id] = []
    }
  })

  return statusMap
}

export function mapApplicationToColumn(
  application: ApplicationStatus,
  columns: ColumnConfig[]
): string | null {
  // First try to find a core column that contains this status
  for (const column of columns) {
    if (column.statuses && column.statuses.includes(application)) {
      return column.id
    }
  }

  // If no core column matches, return null (application doesn't have a valid column)
  return null
}

export function getDefaultStatusForColumn(
  columnId: string,
  columns: ColumnConfig[]
): ApplicationStatus | null {
  const column = columns.find(col => col.id === columnId)
  if (column?.statuses && column.statuses.length > 0) {
    return column.statuses[0]
  }
  return null
}

export function getValidStatusesForDrop(
  columnId: string,
  columns: ColumnConfig[]
): ApplicationStatus[] {
  const column = columns.find(col => col.id === columnId)
  return column?.statuses || []
}

export function canDropApplicationOnColumn(
  application: ApplicationStatus,
  targetColumnId: string,
  columns: ColumnConfig[]
): boolean {
  const validStatuses = getValidStatusesForDrop(targetColumnId, columns)
  return validStatuses.length > 0
}

export function getNewStatusForDrop(
  application: ApplicationStatus,
  targetColumnId: string,
  columns: ColumnConfig[]
): ApplicationStatus | null {
  if (!canDropApplicationOnColumn(application, targetColumnId, columns)) {
    return null
  }

  const validStatuses = getValidStatusesForDrop(targetColumnId, columns)

  // If current status is valid for this column, keep it
  if (validStatuses.includes(application)) {
    return application
  }

  // Otherwise, use the first valid status for this column
  return validStatuses[0]
}

export function createCustomStatusForColumn(
  columnId: string,
  statusName: string,
  _columns: ColumnConfig[]
): void {
  // This would be used to create custom application statuses
  // For now, we'll focus on core statuses
  console.log(`Creating custom status "${statusName}" for column ${columnId}`)
}

export function getApplicationStatusTransition(
  fromStatus: ApplicationStatus,
  toStatus: ApplicationStatus
): 'forward' | 'backward' | 'lateral' {
  const statusOrder: ApplicationStatus[] = [
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

  const fromIndex = statusOrder.indexOf(fromStatus)
  const toIndex = statusOrder.indexOf(toStatus)

  if (fromIndex === -1 || toIndex === -1) {
    return 'lateral'
  }

  if (toIndex > fromIndex) {
    return 'forward'
  } else if (toIndex < fromIndex) {
    return 'backward'
  } else {
    return 'lateral'
  }
}
