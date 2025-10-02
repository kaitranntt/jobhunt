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

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockApplications,
          error: null,
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: mockApplications[0],
            error: null,
          })),
          order: vi.fn(() => ({
            data: mockApplications,
            error: null,
          })),
          data: [mockApplications[0]],
          error: null,
        })),
        single: vi.fn(() => ({
          data: mockApplications[0],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: mockApplications[0],
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockApplications[0],
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
  })),
}))

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
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

describe('Applications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getApplications', () => {
    it('should fetch all applications', async () => {
      const result = await getApplications()
      expect(result).toEqual(mockApplications)
    })
  })

  describe('getApplication', () => {
    it('should fetch a single application by id', async () => {
      const result = await getApplication('1')
      expect(result).toEqual(mockApplications[0])
    })
  })

  describe('createApplication', () => {
    it('should create a new application', async () => {
      const newApp = {
        user_id: 'user-1',
        company_name: 'New Corp',
        job_title: 'Developer',
        status: 'wishlist' as const,
        job_url: null,
        location: null,
        salary_range: null,
        notes: null,
        date_applied: '2025-10-02',
      }

      const result = await createApplication(newApp)
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

      const result = await updateApplication('1', updates)
      expect(result).toBeDefined()
    })
  })

  describe('deleteApplication', () => {
    it('should delete an application', async () => {
      await expect(deleteApplication('1')).resolves.toBeUndefined()
    })
  })

  describe('getApplicationsByStatus', () => {
    it('should fetch applications by status', async () => {
      const result = await getApplicationsByStatus('applied')
      expect(result).toEqual(mockApplications)
    })
  })
})
