import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfile, createProfile, updateProfile } from '../profiles'
import type { UserProfile } from '@/lib/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

const mockSupabase = {
  from: mockFrom,
} as unknown as SupabaseClient

const mockProfile: UserProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  full_name: 'John Doe',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  job_role: 'Software Engineer',
  desired_roles: ['Senior Software Engineer', 'Tech Lead'],
  desired_industries: ['Technology', 'FinTech'],
  experience_years: 5,
  linkedin_url: 'https://linkedin.com/in/johndoe',
  portfolio_url: 'https://johndoe.dev',
  created_at: '2025-10-04T10:00:00Z',
  updated_at: '2025-10-04T10:00:00Z',
}

describe('Profiles API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    })
  })

  describe('getProfile', () => {
    it('should fetch user profile by user_id', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const result = await getProfile(mockSupabase, 'user-1')

      expect(mockFrom).toHaveBeenCalledWith('user_profiles')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSingle).toHaveBeenCalled()
      expect(result).toEqual(mockProfile)
    })

    it('should return null when profile not found (PGRST116 error)', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await getProfile(mockSupabase, 'user-1')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const errorMessage = 'Database connection error'
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      await expect(getProfile(mockSupabase, 'user-1')).rejects.toThrow(`Failed to fetch profile: ${errorMessage}`)
    })
  })

  describe('createProfile', () => {
    it('should create a new user profile with all fields', async () => {
      const newProfile = {
        user_id: 'user-2',
        full_name: 'Jane Smith',
        phone: '+1 (555) 987-6543',
        location: 'New York, NY',
        job_role: 'Product Manager',
        desired_roles: ['Senior PM', 'Director of Product'],
        desired_industries: ['SaaS', 'E-commerce'],
        experience_years: 8,
        linkedin_url: 'https://linkedin.com/in/janesmith',
        portfolio_url: 'https://janesmith.com',
      }

      mockInsert.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: {
          ...newProfile,
          id: 'profile-2',
          created_at: '2025-10-04T12:00:00Z',
          updated_at: '2025-10-04T12:00:00Z',
        },
        error: null,
      })

      const result = await createProfile(mockSupabase, newProfile)

      expect(mockFrom).toHaveBeenCalledWith('user_profiles')
      expect(mockInsert).toHaveBeenCalledWith(newProfile)
      expect(mockSelect).toHaveBeenCalled()
      expect(mockSingle).toHaveBeenCalled()
      expect(result).toHaveProperty('id')
      expect(result.full_name).toBe(newProfile.full_name)
      expect(result.user_id).toBe(newProfile.user_id)
    })

    it('should create a profile with minimal required fields', async () => {
      const minimalProfile = {
        user_id: 'user-3',
        full_name: 'Bob Johnson',
        phone: null,
        location: null,
        job_role: null,
        desired_roles: null,
        desired_industries: null,
        experience_years: null,
        linkedin_url: null,
        portfolio_url: null,
      }

      mockInsert.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: {
          ...minimalProfile,
          id: 'profile-3',
          created_at: '2025-10-04T13:00:00Z',
          updated_at: '2025-10-04T13:00:00Z',
        },
        error: null,
      })

      const result = await createProfile(mockSupabase, minimalProfile)

      expect(result.full_name).toBe(minimalProfile.full_name)
      expect(result.phone).toBeNull()
      expect(result.linkedin_url).toBeNull()
    })

    it('should handle errors when creating profile', async () => {
      const errorMessage = 'Unique constraint violation'
      const newProfile = {
        user_id: 'user-1',
        full_name: 'Test User',
        phone: null,
        location: null,
        job_role: null,
        desired_roles: null,
        desired_industries: null,
        experience_years: null,
        linkedin_url: null,
        portfolio_url: null,
      }

      mockInsert.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      await expect(createProfile(mockSupabase, newProfile)).rejects.toThrow(`Failed to create profile: ${errorMessage}`)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile fields', async () => {
      const updates = {
        job_role: 'Senior Software Engineer',
        experience_years: 6,
        location: 'Austin, TX',
      }

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: { ...mockProfile, ...updates },
        error: null,
      })

      const result = await updateProfile(mockSupabase, 'user-1', updates)

      expect(mockFrom).toHaveBeenCalledWith('user_profiles')
      expect(mockUpdate).toHaveBeenCalledWith(updates)
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSelect).toHaveBeenCalled()
      expect(mockSingle).toHaveBeenCalled()
      expect(result.job_role).toBe(updates.job_role)
      expect(result.experience_years).toBe(updates.experience_years)
    })

    it('should handle errors when updating profile', async () => {
      const errorMessage = 'Update failed'
      const updates = { full_name: 'Updated Name' }

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      await expect(updateProfile(mockSupabase, 'user-1', updates)).rejects.toThrow(
        `Failed to update profile: ${errorMessage}`
      )
    })
  })
})
