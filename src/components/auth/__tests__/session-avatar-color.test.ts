import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getSessionAvatarColor,
  clearSessionAvatarColor,
  hasSessionAvatarColor,
  type AvatarColorData,
} from '../utils/avatar-color'
import type { User } from '@supabase/supabase-js'

// Mock sessionStorage
const sessionStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {}
  }),
}

// Setup and cleanup mocks
beforeEach(() => {
  vi.stubGlobal('sessionStorage', sessionStorageMock)
  sessionStorageMock.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Session-Based Avatar Color System', () => {
  // Test user for consistent testing
  const testUser: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  } as User

  const testUser2: User = {
    id: 'test-user-456',
    email: 'test2@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  } as User

  describe('getSessionAvatarColor', () => {
    it('should generate new color for user without stored color', () => {
      const color = getSessionAvatarColor(testUser)

      expect(color).toHaveProperty('primary')
      expect(color).toHaveProperty('secondary')
      expect(color).toHaveProperty('gradient')
      expect(color).toHaveProperty('generatedAt')
      expect(typeof color.primary).toBe('string')
      expect(typeof color.secondary).toBe('string')
      expect(typeof color.gradient).toBe('string')
      expect(typeof color.generatedAt).toBe('number')

      // Should store in sessionStorage
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'jobhunt-avatar-color-test-user-123',
        expect.stringContaining('"primary"')
      )
    })

    it('should retrieve existing color from sessionStorage', () => {
      // First call generates and stores
      const color1 = getSessionAvatarColor(testUser)
      const storedData = JSON.stringify(color1)

      // Mock sessionStorage to return the stored color
      sessionStorageMock.store['jobhunt-avatar-color-test-user-123'] = storedData
      sessionStorageMock.getItem.mockReturnValue(storedData)

      // Second call should retrieve from storage
      const color2 = getSessionAvatarColor(testUser)

      expect(color1).toEqual(color2)
      expect(color1.primary).toBe(color2.primary)
      expect(color1.secondary).toBe(color2.secondary)
      expect(color1.gradient).toBe(color2.gradient)
    })

    it('should handle users without ID', () => {
      const userWithoutId = { ...testUser, id: '' }
      const color = getSessionAvatarColor(userWithoutId)

      expect(color).toHaveProperty('primary')
      expect(color).toHaveProperty('secondary')
      expect(color).toHaveProperty('gradient')
      expect(color).toHaveProperty('generatedAt')

      // Should not attempt to store in sessionStorage
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('should handle corrupted sessionStorage data', () => {
      // Store corrupted data
      sessionStorageMock.store['jobhunt-avatar-color-test-user-123'] = 'invalid-json'
      sessionStorageMock.getItem.mockReturnValue('invalid-json')

      const color = getSessionAvatarColor(testUser)

      // Should generate new color
      expect(color).toHaveProperty('primary')
      expect(color).toHaveProperty('secondary')
      expect(color).toHaveProperty('gradient')
      expect(color).toHaveProperty('generatedAt')

      // Should remove corrupted data
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'jobhunt-avatar-color-test-user-123'
      )
    })

    it('should handle expired colors (older than 24 hours)', () => {
      // Create expired color data
      const expiredColor: AvatarColorData = {
        primary: '#FF0000',
        secondary: '#00FF00',
        gradient: 'linear-gradient(135deg, #FF0000 0%, #00FF00 100%)',
        generatedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      }

      sessionStorageMock.store['jobhunt-avatar-color-test-user-123'] = JSON.stringify(expiredColor)
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(expiredColor))

      const color = getSessionAvatarColor(testUser)

      // Should generate new color (not the expired one)
      expect(color.gradient).not.toBe(expiredColor.gradient)
      expect(color.generatedAt).toBeGreaterThan(expiredColor.generatedAt)

      // Should remove expired data
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'jobhunt-avatar-color-test-user-123'
      )
    })

    it('should generate colors from vibrant presets', () => {
      const colors = Array.from({ length: 20 }, () => getSessionAvatarColor(testUser))

      // Expected CSS variable colors from macOS 26 design system
      const expectedColorPatterns = [
        'rgb(var(--tint-purple))',
        'rgb(var(--tint-blue))',
        'rgb(var(--tint-orange))',
        'rgb(var(--tint-red))',
        'rgb(var(--tint-teal))',
        'rgb(var(--tint-green))',
        'rgb(var(--tint-pink))',
        'rgb(var(--tint-yellow))',
        'rgb(var(--tint-indigo))',
      ]

      colors.forEach(color => {
        const hasExpectedColor = expectedColorPatterns.some(expectedColor =>
          color.gradient.includes(expectedColor)
        )
        expect(hasExpectedColor).toBe(true)
      })
    })

    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage to throw an error
      sessionStorageMock.setItem.mockImplementation(() => {
        throw new Error('SessionStorage is full')
      })

      // Should not throw and should still return a color
      expect(() => {
        const color = getSessionAvatarColor(testUser)
        expect(color).toHaveProperty('primary')
      }).not.toThrow()
    })
  })

  describe('clearSessionAvatarColor', () => {
    it('should clear avatar color from sessionStorage', () => {
      // First, store a color
      getSessionAvatarColor(testUser)

      // Clear the color
      clearSessionAvatarColor(testUser)

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'jobhunt-avatar-color-test-user-123'
      )
    })

    it('should handle users without ID', () => {
      const userWithoutId = { ...testUser, id: '' }

      expect(() => {
        clearSessionAvatarColor(userWithoutId)
      }).not.toThrow()

      expect(sessionStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('should handle sessionStorage errors gracefully', () => {
      sessionStorageMock.removeItem.mockImplementation(() => {
        throw new Error('SessionStorage error')
      })

      expect(() => {
        clearSessionAvatarColor(testUser)
      }).not.toThrow()
    })
  })

  describe('hasSessionAvatarColor', () => {
    it('should return false when no color is stored', () => {
      const hasColor = hasSessionAvatarColor(testUser)
      expect(hasColor).toBe(false)
    })

    it('should return true when valid color is stored', () => {
      // Store a valid color manually (without calling getSessionAvatarColor)
      const sessionKey = `jobhunt-avatar-color-${testUser.id}`
      const validColor = {
        primary: '#FFA500',
        secondary: '#FF4500',
        gradient: 'linear-gradient(135deg, #FFA500 0%, #FF4500 100%)',
        generatedAt: Date.now(),
      }

      sessionStorageMock.store[sessionKey] = JSON.stringify(validColor)
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(validColor))

      const hasColor = hasSessionAvatarColor(testUser)
      expect(hasColor).toBe(true)
    })

    it('should return false when stored color is corrupted', () => {
      sessionStorageMock.store['jobhunt-avatar-color-test-user-123'] = 'invalid-json'
      sessionStorageMock.getItem.mockReturnValue('invalid-json')

      const hasColor = hasSessionAvatarColor(testUser)
      expect(hasColor).toBe(false)
    })

    it('should return false when stored color is expired', () => {
      const expiredColor: AvatarColorData = {
        primary: '#FF0000',
        secondary: '#00FF00',
        gradient: 'linear-gradient(135deg, #FF0000 0%, #00FF00 100%)',
        generatedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      }

      sessionStorageMock.store['jobhunt-avatar-color-test-user-123'] = JSON.stringify(expiredColor)
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(expiredColor))

      const hasColor = hasSessionAvatarColor(testUser)
      expect(hasColor).toBe(false)
    })

    it('should handle users without ID', () => {
      const userWithoutId = { ...testUser, id: '' }
      const hasColor = hasSessionAvatarColor(userWithoutId)
      expect(hasColor).toBe(false)
    })

    it('should return different results for different users', () => {
      // Store color for first user manually
      const sessionKey1 = `jobhunt-avatar-color-${testUser.id}`
      const validColor = {
        primary: '#FFA500',
        secondary: '#FF4500',
        gradient: 'linear-gradient(135deg, #FFA500 0%, #FF4500 100%)',
        generatedAt: Date.now(),
      }

      sessionStorageMock.store[sessionKey1] = JSON.stringify(validColor)
      sessionStorageMock.getItem.mockImplementation(key => {
        if (key === sessionKey1) return JSON.stringify(validColor)
        return null
      })

      const hasColor1 = hasSessionAvatarColor(testUser)
      const hasColor2 = hasSessionAvatarColor(testUser2)

      expect(hasColor1).toBe(true)
      expect(hasColor2).toBe(false)
    })
  })

  describe('Session Storage Key Format', () => {
    it('should use correct session storage key format', () => {
      const user = { id: 'user-abc-123', email: 'test@example.com' } as User

      getSessionAvatarColor(user)

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'jobhunt-avatar-color-user-abc-123',
        expect.any(String)
      )
    })

    it('should handle special characters in user ID', () => {
      const userWithSpecialChars = {
        id: 'user@#$%^&*()_+-=[]{}|;:,.<>?',
        email: 'test@example.com',
      } as User

      getSessionAvatarColor(userWithSpecialChars)

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'jobhunt-avatar-color-user@#$%^&*()_+-=[]{}|;:,.<>?',
        expect.any(String)
      )
    })
  })

  describe('Data Structure Validation', () => {
    it('should validate stored data structure', () => {
      // Store invalid data (missing required fields)
      const invalidData = {
        primary: '#FF0000',
        // Missing secondary and gradient
      }

      sessionStorageMock.store['jobhunt-avatar-color-test-user-123'] = JSON.stringify(invalidData)
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData))

      const color = getSessionAvatarColor(testUser)

      // Should generate new color due to validation failure
      expect(color).toHaveProperty('secondary')
      expect(color).toHaveProperty('gradient')
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'jobhunt-avatar-color-test-user-123'
      )
    })
  })
})
