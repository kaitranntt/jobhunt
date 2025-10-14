import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTimelineActivities } from '../timeline'
import type { TimelineActivity, TimelineFilters } from '@/lib/types/timeline.types'

// Mock the Supabase client
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

const mockApplicationActivities: TimelineActivity[] = [
  {
    id: 'app-1',
    type: 'application',
    action: 'created',
    title: 'Applied to TechCorp',
    description: 'New application created for Senior Software Engineer position',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-04T10:00:00Z',
    metadata: {
      company_name: 'TechCorp',
      job_title: 'Senior Software Engineer',
      status: 'applied',
    },
  },
  {
    id: 'app-2',
    type: 'application',
    action: 'status_changed',
    title: 'Status changed to Interviewing',
    description: 'Application status updated to interviewing',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-03T15:00:00Z',
    metadata: {
      old_status: 'applied',
      new_status: 'interviewing',
    },
  },
]

const mockContactActivities: TimelineActivity[] = [
  {
    id: 'contact-1',
    type: 'contact',
    action: 'created',
    title: 'New contact: John Doe',
    description: 'Added contact John Doe (Recruiter)',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-02T14:00:00Z',
    metadata: {
      contact_name: 'John Doe',
      role: 'Recruiter',
    },
  },
]

const mockDocumentActivities: TimelineActivity[] = [
  {
    id: 'doc-1',
    type: 'document',
    action: 'uploaded',
    title: 'Uploaded resume.pdf',
    description: 'Uploaded document resume.pdf',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-01T09:00:00Z',
    metadata: {
      file_name: 'resume.pdf',
      file_size: 102400,
    },
  },
]

const mockReminderActivities: TimelineActivity[] = [
  {
    id: 'reminder-1',
    type: 'reminder',
    action: 'created',
    title: 'Follow up with recruiter',
    description: 'Reminder created for 2025-10-10',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-05T08:00:00Z',
    metadata: {
      reminder_date: '2025-10-10T10:00:00Z',
      is_completed: false,
    },
  },
  {
    id: 'reminder-2',
    type: 'reminder',
    action: 'completed',
    title: 'Completed: Prepare for interview',
    description: 'Reminder marked as completed',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-06T16:00:00Z',
    metadata: {
      is_completed: true,
    },
  },
]

describe('Timeline API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTimelineActivities', () => {
    it('should fetch all timeline activities for a user', async () => {
      const allActivities = [
        ...mockApplicationActivities,
        ...mockContactActivities,
        ...mockDocumentActivities,
        ...mockReminderActivities,
      ]

      // Mock applications query
      mockFrom.mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            select: vi.fn().mockImplementation((columns: string) => {
              // For main query
              if (columns === '*') {
                return {
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: mockApplicationActivities.map(a => ({
                        id: a.id,
                        company_name: a.metadata?.company_name,
                        job_title: a.metadata?.job_title,
                        status: a.metadata?.status || a.metadata?.new_status,
                        created_at: a.created_at,
                        updated_at: a.created_at,
                      })),
                      error: null,
                    }),
                  }),
                }
              }
              // For nested lookup queries
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      company_name: 'TechCorp',
                      job_title: 'Senior Software Engineer',
                    },
                    error: null,
                  }),
                }),
              }
            }),
          }
        }
        if (table === 'contacts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockContactActivities.map(a => ({
                    id: a.id,
                    name: a.metadata?.contact_name,
                    role: a.metadata?.role,
                    application_id: 'app-1',
                    created_at: a.created_at,
                  })),
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockDocumentActivities.map(a => ({
                    id: a.id,
                    file_name: a.metadata?.file_name,
                    file_size: a.metadata?.file_size,
                    application_id: 'app-1',
                    created_at: a.created_at,
                  })),
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'reminders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockReminderActivities.map(a => ({
                    id: a.id,
                    title: a.title.replace('Reminder created for ', '').replace('Completed: ', ''),
                    is_completed: a.metadata?.is_completed,
                    application_id: 'app-1',
                    created_at: a.created_at,
                    updated_at: a.created_at,
                  })),
                  error: null,
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const result = await getTimelineActivities('user-1')

      expect(result).toHaveLength(allActivities.length)
      expect(result[0].type).toBe('reminder') // Most recent (2025-10-06)
      expect(result[result.length - 1].type).toBe('document') // Oldest (2025-10-01)
    })

    it('should filter activities by type', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockApplicationActivities.map(a => ({
                    id: a.id,
                    company_name: a.metadata?.company_name,
                    job_title: a.metadata?.job_title,
                    status: a.metadata?.status || a.metadata?.new_status,
                    created_at: a.created_at,
                    updated_at: a.created_at,
                  })),
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      const filters: TimelineFilters = {
        types: ['application'],
      }

      const result = await getTimelineActivities('user-1', filters)

      expect(result).toHaveLength(mockApplicationActivities.length)
      expect(result.every(a => a.type === 'application')).toBe(true)
    })

    it('should filter activities by date range', async () => {
      const filteredActivities = mockApplicationActivities.filter(
        a => a.created_at >= '2025-10-03T00:00:00Z' && a.created_at <= '2025-10-04T23:59:59Z'
      )

      mockFrom.mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: filteredActivities.map(a => ({
                    id: a.id,
                    company_name: a.metadata?.company_name,
                    job_title: a.metadata?.job_title,
                    status: a.metadata?.status || a.metadata?.new_status,
                    created_at: a.created_at,
                    updated_at: a.created_at,
                  })),
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      const filters: TimelineFilters = {
        dateFrom: '2025-10-03T00:00:00Z',
        dateTo: '2025-10-04T23:59:59Z',
      }

      const result = await getTimelineActivities('user-1', filters)

      expect(result.length).toBeLessThanOrEqual(2)
      result.forEach(activity => {
        expect(activity.created_at >= filters.dateFrom!).toBe(true)
        expect(activity.created_at <= filters.dateTo!).toBe(true)
      })
    })

    it('should sort activities by newest first by default', async () => {
      mockFrom.mockImplementation((table: string) => {
        const dataMap = {
          applications: mockApplicationActivities,
          contacts: mockContactActivities,
          documents: mockDocumentActivities,
          reminders: mockReminderActivities,
        }

        const data = dataMap[table as keyof typeof dataMap] || []

        if (table === 'applications') {
          return {
            select: vi.fn().mockImplementation((columns: string) => {
              // For main query
              if (columns === '*') {
                return {
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: data.map(a => ({
                        id: a.id,
                        created_at: a.created_at,
                        company_name: a.metadata?.company_name,
                        job_title: a.metadata?.job_title,
                        status: a.metadata?.status || a.metadata?.new_status,
                        updated_at: a.created_at,
                      })),
                      error: null,
                    }),
                  }),
                }
              }
              // For nested lookup queries
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      company_name: 'TechCorp',
                      job_title: 'Senior Software Engineer',
                    },
                    error: null,
                  }),
                }),
              }
            }),
          }
        }

        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: data.map(a => ({
                  id: a.id,
                  created_at: a.created_at,
                  ...(table === 'contacts' && {
                    name: a.metadata?.contact_name,
                    role: a.metadata?.role,
                    application_id: 'app-1',
                  }),
                  ...(table === 'documents' && {
                    file_name: a.metadata?.file_name,
                    file_size: a.metadata?.file_size,
                    application_id: 'app-1',
                  }),
                  ...(table === 'reminders' && {
                    title: a.title,
                    is_completed: a.metadata?.is_completed,
                    application_id: 'app-1',
                    updated_at: a.created_at,
                  }),
                })),
                error: null,
              }),
            }),
          }),
        }
      })

      const result = await getTimelineActivities('user-1')

      // Verify newest first (descending order)
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].created_at)
        const next = new Date(result[i + 1].created_at)
        expect(current >= next).toBe(true)
      }
    })

    it('should sort activities by oldest first when specified', async () => {
      mockFrom.mockImplementation((table: string) => {
        const dataMap = {
          applications: mockApplicationActivities,
          contacts: mockContactActivities,
          documents: mockDocumentActivities,
          reminders: mockReminderActivities,
        }

        const data = dataMap[table as keyof typeof dataMap] || []

        if (table === 'applications') {
          return {
            select: vi.fn().mockImplementation((columns: string) => {
              // For main query
              if (columns === '*') {
                return {
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: data.map(a => ({
                        id: a.id,
                        created_at: a.created_at,
                        company_name: a.metadata?.company_name,
                        job_title: a.metadata?.job_title,
                        status: a.metadata?.status || a.metadata?.new_status,
                        updated_at: a.created_at,
                      })),
                      error: null,
                    }),
                  }),
                }
              }
              // For nested lookup queries
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      company_name: 'TechCorp',
                      job_title: 'Senior Software Engineer',
                    },
                    error: null,
                  }),
                }),
              }
            }),
          }
        }

        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: data.map(a => ({
                  id: a.id,
                  created_at: a.created_at,
                  ...(table === 'contacts' && {
                    name: a.metadata?.contact_name,
                    role: a.metadata?.role,
                    application_id: 'app-1',
                  }),
                  ...(table === 'documents' && {
                    file_name: a.metadata?.file_name,
                    file_size: a.metadata?.file_size,
                    application_id: 'app-1',
                  }),
                  ...(table === 'reminders' && {
                    title: a.title,
                    is_completed: a.metadata?.is_completed,
                    application_id: 'app-1',
                    updated_at: a.created_at,
                  }),
                })),
                error: null,
              }),
            }),
          }),
        }
      })

      const result = await getTimelineActivities('user-1', {}, 'oldest')

      // Verify oldest first (ascending order)
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].created_at)
        const next = new Date(result[i + 1].created_at)
        expect(current <= next).toBe(true)
      }
    })

    it('should handle errors from database queries', async () => {
      const errorMessage = 'Database connection failed'

      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: errorMessage },
            }),
          }),
        }),
      }))

      await expect(getTimelineActivities('user-1')).rejects.toThrow(errorMessage)
    })

    it('should return empty array when no activities exist', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }))

      const result = await getTimelineActivities('user-1')

      expect(result).toEqual([])
    })

    it('should combine multiple filter types and date range', async () => {
      const filteredData = mockApplicationActivities.filter(
        a => a.created_at >= '2025-10-03T00:00:00Z'
      )

      mockFrom.mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: filteredData.map(a => ({
                    id: a.id,
                    company_name: a.metadata?.company_name,
                    job_title: a.metadata?.job_title,
                    status: a.metadata?.status || a.metadata?.new_status,
                    created_at: a.created_at,
                    updated_at: a.created_at,
                  })),
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      const filters: TimelineFilters = {
        types: ['application'],
        dateFrom: '2025-10-03T00:00:00Z',
      }

      const result = await getTimelineActivities('user-1', filters)

      expect(result.every(a => a.type === 'application')).toBe(true)
      expect(result.every(a => a.created_at >= filters.dateFrom!)).toBe(true)
    })
  })
})
