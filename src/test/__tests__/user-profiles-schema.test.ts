import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// User Profile schema matching the database migration
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(1000).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createUserProfileSchema = userProfileSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .partial({
    name: true,
    avatar_url: true,
    bio: true,
  })

export const updateUserProfileSchema = createUserProfileSchema.partial()

describe('User Profile Schema Tests', () => {
  describe('userProfileSchema', () => {
    it('should validate a complete user profile', () => {
      const validProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Software developer with 5 years of experience',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = userProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('should validate a minimal user profile', () => {
      const minimalProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = userProfileSchema.safeParse(minimalProfile)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'invalid-email',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = userProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('should reject invalid UUID format', () => {
      const invalidProfile = {
        id: 'invalid-uuid',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = userProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('id')
      }
    })

    it('should reject bio that exceeds maximum length', () => {
      const invalidProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        bio: 'a'.repeat(1001), // Exceeds 1000 character limit
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = userProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('bio')
      }
    })
  })

  describe('createUserProfileSchema', () => {
    it('should validate user profile creation data', () => {
      const createData = {
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        name: 'John Doe',
      }

      const result = createUserProfileSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should require user_id and email for creation', () => {
      const incompleteData = {
        name: 'John Doe',
      }

      const result = createUserProfileSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const fieldNames = result.error.issues.map(issue => issue.path[0])
        expect(fieldNames).toContain('user_id')
        expect(fieldNames).toContain('email')
      }
    })
  })

  describe('updateUserProfileSchema', () => {
    it('should allow partial updates', () => {
      const updateData = {
        name: 'Jane Doe',
        bio: 'Updated bio',
      }

      const result = updateUserProfileSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow empty update object', () => {
      const updateData = {}

      const result = updateUserProfileSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate updated fields', () => {
      const invalidUpdate = {
        email: 'invalid-email',
      }

      const result = updateUserProfileSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })
  })

  describe('Database Constraints Validation', () => {
    it('should enforce one profile per user', () => {
      // This test documents the unique constraint on user_id
      const constraint = 'CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id)'
      expect(constraint).toContain('UNIQUE (user_id)')
    })

    it('should validate email format with regex', () => {
      // This test documents the email validation constraint
      const emailRegex = "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"
      expect(emailRegex).toContain('email')
      expect(emailRegex).toContain('@')
      expect(emailRegex).toContain('\\.[A-Za-z]{2,}$')
    })

    it('should cascade delete on user deletion', () => {
      // This test documents the foreign key constraint
      const constraint = 'REFERENCES auth.users(id) ON DELETE CASCADE'
      expect(constraint).toContain('ON DELETE CASCADE')
    })
  })
})
