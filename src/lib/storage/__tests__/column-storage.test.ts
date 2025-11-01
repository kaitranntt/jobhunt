/**
 * Tests for Column Storage Manager
 * Uses complete test isolation to prevent state leakage between tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ColumnStorageManager } from '../column-storage'
import {
  createIsolatedStorageManager,
  expectCleanState,
  testColumnData,
  type SingletonClass,
  type ManagerWithCleanup,
} from '@/test/utils/column-storage-test-utils'
import type { ColumnType } from '@/lib/types/column.types'

describe('ColumnStorageManager', () => {
  let storageManager: ColumnStorageManager

  beforeEach(() => {
    // Create completely isolated storage manager for each test
    storageManager = createIsolatedStorageManager()
  })

  afterEach(() => {
    // Complete cleanup after each test
    try {
      // Use the cleanup function if available on the manager
      const managerWithCleanup = storageManager as ManagerWithCleanup
      if (managerWithCleanup._testCleanup) {
        managerWithCleanup._testCleanup()
      }

      // Reset singleton
      const SingletonManager = ColumnStorageManager as unknown as SingletonClass
      SingletonManager.instance = null

      // Clear localStorage completely
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage)
        keys.forEach(key => localStorage.removeItem(key))
        localStorage.clear()
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  })

  it('should return default columns initially', () => {
    // Verify clean state
    expectCleanState(storageManager)

    const columns = storageManager.getColumns()
    expect(columns[0].id).toBe('saved')
    expect(columns[1].id).toBe('applied')
    expect(columns[2].id).toBe('interview')
    expect(columns[3].id).toBe('offers')
    expect(columns[4].id).toBe('closed')
  })

  it('should create custom column', () => {
    const customColumn = storageManager.createCustomColumn(testColumnData.basic)

    expect(customColumn).toBeTruthy()
    expect(customColumn.name).toBe(testColumnData.basic.name)
    expect(customColumn.isCustom).toBe(true)

    // Verify it's reflected in getColumns
    const columns = storageManager.getColumns()
    expect(columns).toHaveLength(6)
    expect(columns.find(col => col.id === customColumn.id)).toBeDefined()
  })

  it('should update custom column', () => {
    // Create a column first
    const customColumn = storageManager.createCustomColumn(testColumnData.basic)

    // Update it
    const updated = storageManager.updateCustomColumn(customColumn.id, testColumnData.updateData)
    expect(updated).toBeTruthy()
    expect(updated!.name).toBe(testColumnData.updateData.name)
    expect(updated!.description).toBe(testColumnData.updateData.description)

    // Verify the change is reflected in getColumns
    const columns = storageManager.getColumns()
    const column = columns.find(col => col.id === customColumn.id)
    expect(column!.name).toBe(testColumnData.updateData.name)
    expect(column!.description).toBe(testColumnData.updateData.description)
  })

  it('should delete custom column', () => {
    // Create a column first
    const customColumn = storageManager.createCustomColumn(testColumnData.basic)

    // Verify it was created
    let columns = storageManager.getColumns()
    expect(columns).toHaveLength(6)

    // Delete the column
    const deleted = storageManager.deleteCustomColumn(customColumn.id)
    expect(deleted).toBe(true)

    // Verify it was deleted
    columns = storageManager.getColumns()
    expect(columns).toHaveLength(5)
    expect(columns.find(col => col.id === customColumn.id)).toBeUndefined()

    // Verify we're back to clean state
    expectCleanState(storageManager)
  })

  it('should not delete core columns', () => {
    // Try to delete a core column
    const deleted = storageManager.deleteCustomColumn('saved')
    expect(deleted).toBe(false)

    // Should still be in clean state
    expectCleanState(storageManager)
  })

  it('should reorder columns', () => {
    // Create a custom column
    const customColumn = storageManager.createCustomColumn(testColumnData.basic)

    // Reorder columns
    const newOrder: ColumnType[] = [
      'applied',
      'saved',
      'interview',
      'offers',
      'closed',
      customColumn.id as ColumnType,
    ]
    const reordered = storageManager.reorderColumns(newOrder)

    expect(reordered).toBe(true)
    const columns = storageManager.getColumns()
    expect(columns[0].id).toBe('applied')
    expect(columns[1].id).toBe('saved')
  })

  it('should maintain proper order indices after reordering', () => {
    // Create a custom column
    const customColumn = storageManager.createCustomColumn(testColumnData.basic)

    // Reorder columns
    const newOrder: ColumnType[] = [
      'applied',
      'saved',
      'interview',
      'offers',
      'closed',
      customColumn.id as ColumnType,
    ]
    storageManager.reorderColumns(newOrder)

    const columns = storageManager.getColumns()
    columns.forEach((column, index) => {
      expect(column.order).toBe(index)
    })
  })

  it('should reset to defaults', () => {
    // Add some custom columns
    storageManager.createCustomColumn(testColumnData.basic)
    storageManager.createCustomColumn({ name: 'Custom 2' })

    expect(storageManager.getColumns()).toHaveLength(7)

    // Reset
    storageManager.resetToDefaults()

    // Verify clean state
    expectCleanState(storageManager)
  })

  it('should export and import data', () => {
    // Create a custom column for export
    storageManager.createCustomColumn({
      name: 'Test Export',
      description: 'For export testing',
    })

    // Export data
    const exportedData = storageManager.exportData()
    expect(exportedData).toBeTruthy()

    // Parse the exported JSON string to get the object
    const exportedObj = JSON.parse(exportedData)
    expect(exportedObj.columns).toHaveLength(6)
    expect(exportedObj.customColumns).toHaveLength(1)

    // Reset and import
    storageManager.resetToDefaults()
    expectCleanState(storageManager)

    const imported = storageManager.importData(exportedData)
    expect(imported).toBe(true)

    // Verify imported data
    const columns = storageManager.getColumns()
    expect(columns).toHaveLength(6)
    expect(columns.find(col => col.name === 'Test Export')).toBeTruthy()
  })

  it('should handle invalid import data', () => {
    // Test with invalid JSON - intentionally passing invalid data
    const result = storageManager.importData('invalid json')
    expect(result).toBe(false)

    // Test with invalid data structure - intentionally passing object instead of string
    const result2 = storageManager.importData(JSON.stringify({}))
    expect(result2).toBe(false)

    // Should still be in clean state
    expectCleanState(storageManager)
  })

  it('should return singleton instance', () => {
    // Clear singleton first
    const SingletonManager = ColumnStorageManager as unknown as SingletonClass
    const originalInstance = SingletonManager.instance
    SingletonManager.instance = null

    const instance1 = ColumnStorageManager.getInstance()
    const instance2 = ColumnStorageManager.getInstance()
    expect(instance1).toBe(instance2)

    // Restore original instance
    SingletonManager.instance = originalInstance
  })
})
