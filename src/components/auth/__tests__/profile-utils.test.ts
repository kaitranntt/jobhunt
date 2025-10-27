import { describe, it, expect } from 'vitest'
import {
  getUserInitials,
  getUserDisplayName,
  getUserAvatarUrl,
  formatUserEmail,
} from '../utils/profile-utils'
import type { User } from '@supabase/supabase-js'

describe('Profile Utils', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  } as User

  describe('getUserInitials', () => {
    it('should return initials from email', () => {
      const result = getUserInitials(mockUser)
      expect(result).toBe('TE')
    })

    it('should handle complex email addresses', () => {
      const user = { ...mockUser, email: 'john.doe.smith@company.com' }
      const result = getUserInitials(user)
      expect(result).toBe('JO')
    })

    it('should handle short email addresses', () => {
      const user = { ...mockUser, email: 'a@b.com' }
      const result = getUserInitials(user)
      expect(result).toBe('A')
    })

    it('should handle empty email', () => {
      const user = { ...mockUser, email: undefined }
      const result = getUserInitials(user)
      expect(result).toBe('')
    })

    it('should handle email with only special characters', () => {
      const user = { ...mockUser, email: '@example.com' }
      const result = getUserInitials(user)
      expect(result).toBe('')
    })
  })

  describe('getUserDisplayName', () => {
    it('should return display name from metadata', () => {
      const result = getUserDisplayName(mockUser)
      expect(result).toBe('Test User')
    })

    it('should return email prefix when no display name', () => {
      const user = { ...mockUser, user_metadata: {} }
      const result = getUserDisplayName(user)
      expect(result).toBe('test')
    })

    it('should return "User" when no email or display name', () => {
      const user = { ...mockUser, email: undefined, user_metadata: {} }
      const result = getUserDisplayName(user)
      expect(result).toBe('User')
    })

    it('should handle empty display name', () => {
      const user = { ...mockUser, user_metadata: { display_name: '' } }
      const result = getUserDisplayName(user)
      expect(result).toBe('test')
    })

    it('should handle email with complex prefix', () => {
      const user = { ...mockUser, email: 'john.doe.smith@company.com', user_metadata: {} }
      const result = getUserDisplayName(user)
      expect(result).toBe('john.doe.smith')
    })
  })

  describe('getUserAvatarUrl', () => {
    it('should return avatar URL from metadata', () => {
      const result = getUserAvatarUrl(mockUser)
      expect(result).toBe('https://example.com/avatar.jpg')
    })

    it('should return null when no avatar URL', () => {
      const user = { ...mockUser, user_metadata: {} }
      const result = getUserAvatarUrl(user)
      expect(result).toBeNull()
    })

    it('should return null when user_metadata is empty', () => {
      const user = { ...mockUser, user_metadata: {} }
      const result = getUserAvatarUrl(user)
      expect(result).toBeNull()
    })

    it('should return null when avatar_url is empty string', () => {
      const user = { ...mockUser, user_metadata: { avatar_url: '' } }
      const result = getUserAvatarUrl(user)
      expect(result).toBe(null)
    })

    it('should handle avatar_url with special characters', () => {
      const url = 'https://example.com/avatar-image_123.png?size=large'
      const user = { ...mockUser, user_metadata: { avatar_url: url } }
      const result = getUserAvatarUrl(user)
      expect(result).toBe(url)
    })
  })

  describe('formatUserEmail', () => {
    it('should return formatted email', () => {
      const result = formatUserEmail(mockUser)
      expect(result).toBe('test@example.com')
    })

    it('should handle undefined email', () => {
      const user = { ...mockUser, email: undefined }
      const result = formatUserEmail(user)
      expect(result).toBe('unknown@example.com')
    })

    it('should handle empty string email', () => {
      const user = { ...mockUser, email: '' }
      const result = formatUserEmail(user)
      expect(result).toBe('unknown@example.com')
    })

    it('should handle complex email addresses', () => {
      const user = { ...mockUser, email: 'john.doe.smith@sub.company.co.uk' }
      const result = formatUserEmail(user)
      expect(result).toBe('john.doe.smith@sub.company.co.uk')
    })

    it('should handle email with special characters', () => {
      const user = { ...mockUser, email: 'user+tag@example.com' }
      const result = formatUserEmail(user)
      expect(result).toBe('user+tag@example.com')
    })
  })

  describe('Edge Cases and Integration', () => {
    it('should handle completely empty user object', () => {
      const emptyUser = {
        id: '',
        email: undefined,
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '',
      } as User

      expect(getUserInitials(emptyUser)).toBe('')
      expect(getUserDisplayName(emptyUser)).toBe('User')
      expect(getUserAvatarUrl(emptyUser)).toBeNull()
      expect(formatUserEmail(emptyUser)).toBe('unknown@example.com')
    })

    it('should handle user with only id', () => {
      const minimalUser = {
        id: 'user-123',
        email: undefined,
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '',
      } as User

      expect(getUserInitials(minimalUser)).toBe('')
      expect(getUserDisplayName(minimalUser)).toBe('User')
      expect(getUserAvatarUrl(minimalUser)).toBeNull()
      expect(formatUserEmail(minimalUser)).toBe('unknown@example.com')
    })

    it('should handle user with nested metadata', () => {
      const userWithNestedMeta = {
        ...mockUser,
        user_metadata: {
          display_name: 'John Doe',
          avatar_url: 'https://example.com/avatar.jpg',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      }

      expect(getUserDisplayName(userWithNestedMeta)).toBe('John Doe')
      expect(getUserAvatarUrl(userWithNestedMeta)).toBe('https://example.com/avatar.jpg')
    })

    it('should be consistent across multiple calls', () => {
      const result1 = getUserInitials(mockUser)
      const result2 = getUserInitials(mockUser)
      expect(result1).toBe(result2)

      const name1 = getUserDisplayName(mockUser)
      const name2 = getUserDisplayName(mockUser)
      expect(name1).toBe(name2)

      const avatar1 = getUserAvatarUrl(mockUser)
      const avatar2 = getUserAvatarUrl(mockUser)
      expect(avatar1).toBe(avatar2)

      const email1 = formatUserEmail(mockUser)
      const email2 = formatUserEmail(mockUser)
      expect(email1).toBe(email2)
    })
  })
})
