/**
 * Test utilities for ColumnStorageManager isolation
 * Provides complete test isolation to prevent state leakage between tests
 */

import { ColumnStorageManager } from '@/lib/storage/column-storage'
import type { CreateColumnData, UpdateColumnData } from '@/lib/types/column.types'

/**
 * Creates a completely isolated ColumnStorageManager instance for testing
 * This ensures no state leakage between tests by using a simple in-memory approach
 */
export function createIsolatedStorageManager(): ColumnStorageManager {
  // First, completely reset any existing localStorage state
  resetLocalStorage()

  // Reset singleton completely before creating new instance
  const originalInstance = (ColumnStorageManager as any).instance
  ;(ColumnStorageManager as any).instance = null

  // Clear localStorage to ensure clean state
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.clear()
  }

  // Create new instance
  const manager = ColumnStorageManager.getInstance()

  // Force it to reset to defaults immediately
  manager._testReset()

  // Store cleanup function on the manager
  ;(manager as any)._testCleanup = () => {
    // Reset singleton to original
    ;(ColumnStorageManager as any).instance = originalInstance

    // Clear localStorage completely
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear()
    }

    // Additional cleanup
    resetLocalStorage()
  }

  return manager
}

/**
 * Creates a test context with complete isolation setup and cleanup
 */
export function createTestContext(): {
  storageManager: ColumnStorageManager
  cleanup: () => void
} {
  const originalInstance = (ColumnStorageManager as any).instance

  // Clear localStorage and reset singleton
  if (typeof window !== 'undefined') {
    localStorage.clear()
  }
  ;(ColumnStorageManager as any).instance = null

  const storageManager = ColumnStorageManager.getInstance()
  storageManager.resetToDefaults()

  const cleanup = () => {
    // Restore original state
    ;(ColumnStorageManager as any).instance = originalInstance
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  }

  return { storageManager, cleanup }
}

/**
 * Mock localStorage for testing in non-browser environments
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  if (typeof window === 'undefined') {
    // @ts-ignore - mocking for Node.js environment
    global.window = {
      localStorage: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          Object.keys(store).forEach(key => delete store[key])
        },
        length: 0,
        key: (index: number) => Object.keys(store)[index] || null,
      },
    }
  } else {
    // Clear existing localStorage if in browser environment
    localStorage.clear()
  }
}

/**
 * Completely reset localStorage and all storage keys
 */
export function resetLocalStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Get all keys and remove them individually
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (_error) {
          // Ignore individual removal errors
        }
      })

      // Use clear() as main method
      localStorage.clear()

      // Verify it's actually cleared by checking again
      const remainingKeys = Object.keys(localStorage)
      remainingKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (_error) {
          // Ignore errors
        }
      })

      // Final clear attempt
      localStorage.clear()

      // Set a marker to verify clearing worked
      localStorage.setItem('_test_clear_marker', 'test')
      localStorage.removeItem('_test_clear_marker')
    } catch (_error) {
      // If localStorage is completely broken, ignore
    }
  }
}

/**
 * Validates that a storage manager has clean default state
 */
export function expectCleanState(manager: ColumnStorageManager): void {
  const columns = manager.getColumns()
  expect(columns).toHaveLength(5)
  expect(columns.map(col => col.id)).toEqual(['saved', 'applied', 'interview', 'offers', 'closed'])

  const customColumns = manager.getCustomColumns()
  expect(customColumns).toHaveLength(0)
}

/**
 * Creates test data for custom columns
 */
export const testColumnData = {
  basic: {
    name: 'Test Column',
    color: 'blue' as const,
    description: 'Test Description',
  } as CreateColumnData,

  withIcon: {
    name: 'Icon Column',
    color: 'green' as const,
    icon: '📝',
  } as CreateColumnData,

  updateData: {
    name: 'Updated Column',
    description: 'Updated Description',
    color: 'purple' as const,
  } as UpdateColumnData,
}
