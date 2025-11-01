/**
 * Custom Column Storage Utilities
 * Handles localStorage and Supabase persistence for custom columns
 */

import type {
  CustomColumn,
  ColumnConfig,
  ColumnStorage,
  CreateColumnData,
  UpdateColumnData,
  ColumnType,
} from '@/lib/types/column.types'

const STORAGE_KEY = 'jobhunt-custom-columns'

// Default column configuration
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'saved',
    name: 'Saved',
    description: 'Wishlist and saved positions',
    isCustom: false,
    order: 0,
    statuses: ['wishlist'],
  },
  {
    id: 'applied',
    name: 'Applied',
    description: 'Applications submitted',
    isCustom: false,
    order: 1,
    statuses: ['applied'],
  },
  {
    id: 'interview',
    name: 'Interview',
    description: 'Phone screens, technical interviews, final rounds',
    isCustom: false,
    order: 2,
    statuses: ['phone_screen', 'assessment', 'take_home', 'interviewing', 'final_round'],
  },
  {
    id: 'offers',
    name: 'Offers',
    description: 'Received offers',
    isCustom: false,
    order: 3,
    statuses: ['offered', 'accepted'],
  },
  {
    id: 'closed',
    name: 'Closed',
    description: 'Rejected, withdrawn, ghosted',
    isCustom: false,
    order: 4,
    statuses: ['rejected', 'withdrawn', 'ghosted'],
  },
]

export class ColumnStorageManager {
  private static instance: ColumnStorageManager
  private storage: ColumnStorage

  private constructor() {
    this.storage = this.loadStorage()
  }

  static getInstance(): ColumnStorageManager {
    if (!ColumnStorageManager.instance) {
      ColumnStorageManager.instance = new ColumnStorageManager()
    }
    return ColumnStorageManager.instance
  }

  private loadStorage(): ColumnStorage {
    if (typeof window === 'undefined') {
      return {
        columns: [...DEFAULT_COLUMNS], // Create a copy to avoid reference issues
        customColumns: [],
        lastUpdated: new Date().toISOString(),
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnStorage
        // Validate and merge with defaults
        return {
          columns: this.mergeColumnsWithDefaults(parsed.columns),
          customColumns: parsed.customColumns || [],
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        }
      }
    } catch (error) {
      console.error('Failed to load column storage:', error)
    }

    return {
      columns: [...DEFAULT_COLUMNS], // Create a copy to avoid reference issues
      customColumns: [],
      lastUpdated: new Date().toISOString(),
    }
  }

  private mergeColumnsWithDefaults(storedColumns: ColumnConfig[]): ColumnConfig[] {
    // Start with default columns as base
    const merged = [...DEFAULT_COLUMNS]
    const existingIds = new Set(merged.map(col => col.id))

    // Add custom columns from storage that don't already exist
    const customColumns = storedColumns.filter(col => col.isCustom && !existingIds.has(col.id))
    merged.push(...customColumns)

    // Sort by order
    merged.sort((a, b) => a.order - b.order)

    // Re-index orders to ensure no gaps
    merged.forEach((col, index) => {
      col.order = index
    })

    return merged
  }

  private saveStorage(): void {
    if (typeof window === 'undefined') return

    try {
      this.storage.lastUpdated = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storage))
    } catch (error) {
      console.error('Failed to save column storage:', error)
    }
  }

  getColumns(): ColumnConfig[] {
    return [...this.storage.columns]
  }

  getCustomColumns(): CustomColumn[] {
    return [...this.storage.customColumns]
  }

  getColumnById(id: string): ColumnConfig | undefined {
    return this.storage.columns.find(col => col.id === id)
  }

  createCustomColumn(data: CreateColumnData): CustomColumn {
    const customColumn: CustomColumn = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      icon: data.icon,
      isCustom: true,
      order: this.storage.columns.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.storage.customColumns.push(customColumn)

    const columnConfig: ColumnConfig = {
      id: customColumn.id as ColumnType,
      name: customColumn.name,
      description: customColumn.description,
      icon: customColumn.icon,
      isCustom: true,
      order: customColumn.order,
    }

    this.storage.columns.push(columnConfig)
    this.saveStorage()

    return customColumn
  }

  updateCustomColumn(id: string, data: UpdateColumnData): CustomColumn | null {
    const customColumnIndex = this.storage.customColumns.findIndex(col => col.id === id)
    if (customColumnIndex === -1) return null

    const customColumn = this.storage.customColumns[customColumnIndex]
    const updatedCustomColumn = {
      ...customColumn,
      ...data,
      updated_at: new Date().toISOString(),
    }

    this.storage.customColumns[customColumnIndex] = updatedCustomColumn

    // Update corresponding column config
    const columnConfigIndex = this.storage.columns.findIndex(col => col.id === id)
    if (columnConfigIndex !== -1) {
      this.storage.columns[columnConfigIndex] = {
        ...this.storage.columns[columnConfigIndex],
        ...data,
      }
    }

    this.saveStorage()
    return updatedCustomColumn
  }

  deleteCustomColumn(id: string): boolean {
    const customColumnIndex = this.storage.customColumns.findIndex(col => col.id === id)
    if (customColumnIndex === -1) return false

    this.storage.customColumns.splice(customColumnIndex, 1)

    const columnConfigIndex = this.storage.columns.findIndex(col => col.id === id)
    if (columnConfigIndex !== -1) {
      this.storage.columns.splice(columnConfigIndex, 1)
    }

    // Re-index orders
    this.storage.columns.forEach((col, index) => {
      col.order = index
    })

    this.saveStorage()
    return true
  }

  reorderColumns(newOrder: ColumnType[]): boolean {
    try {
      const columnMap = new Map(this.storage.columns.map(col => [col.id, col]))
      const reorderedColumns: ColumnConfig[] = []

      newOrder.forEach(id => {
        const column = columnMap.get(id)
        if (column) {
          reorderedColumns.push(column)
        }
      })

      // Add any missing columns at the end
      this.storage.columns.forEach(col => {
        if (!newOrder.includes(col.id)) {
          reorderedColumns.push(col)
        }
      })

      // Update orders
      reorderedColumns.forEach((col, index) => {
        col.order = index
      })

      this.storage.columns = reorderedColumns
      this.saveStorage()
      return true
    } catch (error) {
      console.error('Failed to reorder columns:', error)
      return false
    }
  }

  resetToDefaults(): void {
    this.storage = {
      columns: DEFAULT_COLUMNS,
      customColumns: [],
      lastUpdated: new Date().toISOString(),
    }
    this.saveStorage()
  }

  exportData(): string {
    return JSON.stringify(this.storage, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData) as ColumnStorage

      // Validate structure
      if (!imported.columns || !Array.isArray(imported.columns)) {
        throw new Error('Invalid data structure')
      }

      // Ensure core columns exist
      const merged = this.mergeColumnsWithDefaults(imported.columns)

      this.storage = {
        columns: merged,
        customColumns: imported.customColumns || [],
        lastUpdated: new Date().toISOString(),
      }

      this.saveStorage()
      return true
    } catch (error) {
      console.error('Failed to import column data:', error)
      return false
    }
  }

  /**
   * Complete reset for testing purposes
   * Clears all state and resets to defaults, used for test isolation
   */
  _testReset(): void {
    this.storage = {
      columns: [...DEFAULT_COLUMNS], // Create a copy to avoid reference issues
      customColumns: [],
      lastUpdated: new Date().toISOString(),
    }

    // Clear localStorage if available - be thorough
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(STORAGE_KEY)
        // Also try to clear everything as backup
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('column') || key.includes('jobhunt')) {
            localStorage.removeItem(key)
          }
        })
      } catch (_error) {
        // Ignore localStorage errors in test environment
      }
    }
  }
}

// Export singleton instance
export const columnStorage = ColumnStorageManager.getInstance()
