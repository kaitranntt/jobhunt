/**
 * Test utilities for ColumnStorageManager isolation
 * Provides complete test isolation to prevent state leakage between tests
 */

import { ColumnStorageManager } from '@/lib/storage/column-storage'
import type { CreateColumnData, UpdateColumnData } from '@/lib/types/column.types'

// Type for singleton class with private instance property (for test manipulation only)
export interface SingletonClass {
  instance: ColumnStorageManager | null
}

// Type for manager with test cleanup function
export interface ManagerWithCleanup extends ColumnStorageManager {
  _testCleanup?: () => void
}

/**
 * Creates a completely isolated ColumnStorageManager instance for testing
 * This ensures no state leakage between tests by using a simple in-memory approach
 */
export function createIsolatedStorageManager(): ColumnStorageManager {
  // First, completely reset any existing localStorage state
  resetLocalStorage()

  // Reset singleton completely before creating new instance
  const SingletonManager = ColumnStorageManager as unknown as SingletonClass
  const originalInstance = SingletonManager.instance
  SingletonManager.instance = null

  // Clear localStorage to ensure clean state
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.clear()
  }

  // Create new instance
  const manager = ColumnStorageManager.getInstance() as ManagerWithCleanup

  // Force it to reset to defaults immediately
  manager._testReset()

  // Store cleanup function on the manager
  manager._testCleanup = () => {
    // Reset singleton to original
    SingletonManager.instance = originalInstance

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
  const SingletonManager = ColumnStorageManager as unknown as SingletonClass
  const originalInstance = SingletonManager.instance

  // Clear localStorage and reset singleton
  if (typeof window !== 'undefined') {
    localStorage.clear()
  }
  SingletonManager.instance = null

  const storageManager = ColumnStorageManager.getInstance()
  storageManager.resetToDefaults()

  const cleanup = () => {
    // Restore original state
    SingletonManager.instance = originalInstance
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
    // Define localStorage mock interface separately
    interface MockLocalStorage {
      getItem: (key: string) => string | null
      setItem: (key: string, value: string) => void
      removeItem: (key: string) => void
      clear: () => void
      length: number
      key: (index: number) => string | null
    }

    // Create typed localStorage mock
    const mockLocalStorage: MockLocalStorage = {
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
    }

    // Define minimal window interface for global extension
    interface GlobalWithWindow {
      window?: {
        localStorage: MockLocalStorage
      }
    }

    // Extend global with minimal window interface
    ;(global as GlobalWithWindow).window = {
      localStorage: mockLocalStorage,
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
    description: 'Test Description',
  } as CreateColumnData,

  withIcon: {
    name: 'Icon Column',
    icon: '📝',
  } as CreateColumnData,

  updateData: {
    name: 'Updated Column',
    description: 'Updated Description',
  } as UpdateColumnData,
}
