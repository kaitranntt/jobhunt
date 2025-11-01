import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationsByStatus,
} from '../applications'
import type { Application } from '@/lib/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockApplications: Application[] = [
  {
    id: '1',
    user_id: 'user-1',
    company_id: null,
    company_name: 'Tech Corp',
    job_title: 'Software Engineer',
    status: 'applied',
    job_url: 'https://techcorp.com/jobs/123',
    location: 'San Francisco, CA',
    salary_range: '$120k - $180k',
    job_description: null,
    company_logo_url: null,
    source: 'manual',
    notes: 'Great company culture',
    date_applied: '2025-10-01',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

// Create mock Supabase client
const createMockSupabaseClient = () => {
  const mockData = {
    data: mockApplications,
    error: null,
  }

  const mockSingleData = {
    data: mockApplications[0],
    error: null,
  }

  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(mockSingleData),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      then: vi.fn(resolve => resolve(mockData)),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
  }
}

describe('Applications API', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient() as unknown as SupabaseClient
  })

  describe('getApplications', () => {
    it('should fetch all applications', async () => {
      const result = await getApplications(mockSupabase)
      expect(result).toEqual(mockApplications)
    })
  })

  describe('getApplication', () => {
    it('should fetch a single application by id', async () => {
      const result = await getApplication(mockSupabase, '1')
      expect(result).toEqual(mockApplications[0])
    })
  })

  describe('createApplication', () => {
    it('should create a new application', async () => {
      const newApp = {
        company_id: null,
        company_name: 'New Corp',
        job_title: 'Developer',
        status: 'wishlist' as const,
        job_url: null,
        location: null,
        salary_range: null,
        job_description: null,
        company_logo_url: null,
        source: 'manual',
        notes: null,
        date_applied: '2025-10-02',
      }

      const result = await createApplication(mockSupabase, newApp)
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })
  })

  describe('updateApplication', () => {
    it('should update an existing application', async () => {
      const updates = {
        status: 'phone_screen' as const,
        notes: 'Phone screen scheduled',
      }

      const result = await updateApplication(mockSupabase, '1', updates)
      expect(result).toBeDefined()
    })
  })

  describe('deleteApplication', () => {
    it('should delete an application', async () => {
      await expect(deleteApplication(mockSupabase, '1')).resolves.toBeUndefined()
    })
  })

  describe('getApplicationsByStatus', () => {
    it('should fetch applications by status', async () => {
      const result = await getApplicationsByStatus(mockSupabase, 'applied')
      expect(result).toEqual(mockApplications)
    })
  })
})
