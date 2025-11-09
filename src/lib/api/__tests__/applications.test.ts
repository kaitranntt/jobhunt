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
    company_name: 'Tech Corp',
    job_title: 'Software Engineer',
    status: 'applied',
    job_url: 'https://techcorp.com/jobs/123',
    location: 'San Francisco, CA',
    salary_range: '$120k - $180k',
    notes: 'Great company culture',
    date_applied: '2025-10-01',
    position: 1,
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

  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(mockSingleData),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      // Make the query builder thenable so it can be awaited
      then: (resolve: (value: typeof mockData) => void) => {
        resolve(mockData)
      },
    }
    return builder
  }

  return {
    from: vi.fn(() => createQueryBuilder()),
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
        company_name: 'New Corp',
        job_title: 'Developer',
        status: 'wishlist' as const,
        job_url: null,
        location: null,
        salary_range: null,
        notes: null,
        date_applied: '2025-10-02',
        position: 1,
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
