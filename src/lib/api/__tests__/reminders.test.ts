import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createReminder,
  getRemindersByApplication,
  getUpcomingReminders,
  updateReminder,
  markReminderComplete,
  deleteReminder,
} from '../reminders'
import type { Reminder } from '@/lib/types/database.types'

// Mock return values with proper types
let mockSelectReturn: { data: Reminder[] | null; error: { message: string } | null } = {
  data: [],
  error: null,
}
let mockInsertReturn: { data: Reminder | null; error: { message: string } | null } = {
  data: null,
  error: null,
}
let mockUpdateReturn: { data: Reminder | null; error: { message: string } | null } = {
  data: null,
  error: null,
}
let mockDeleteReturn: { error: { message: string } | null } = { error: null }

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => mockSelectReturn),
        eq: vi.fn(() => ({
          order: vi.fn(() => mockSelectReturn),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => mockSelectReturn),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => mockInsertReturn),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => mockUpdateReturn),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => mockDeleteReturn),
      })),
    })),
  })),
}))

const mockReminders: Reminder[] = [
  {
    id: 'reminder-1',
    user_id: 'user-1',
    application_id: 'app-1',
    title: 'Follow up on application',
    description: 'Send follow-up email to hiring manager',
    reminder_date: '2025-10-10T10:00:00Z',
    is_completed: false,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 'reminder-2',
    user_id: 'user-1',
    application_id: null,
    title: 'Prepare for interview',
    description: 'Review company research and prepare answers',
    reminder_date: '2025-10-15T14:00:00Z',
    is_completed: false,
    created_at: '2025-10-01T11:00:00Z',
    updated_at: '2025-10-01T11:00:00Z',
  },
]

describe('Reminders API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock return values to success states
    mockSelectReturn = { data: mockReminders, error: null }
    mockInsertReturn = { data: mockReminders[0], error: null }
    mockUpdateReturn = { data: { ...mockReminders[0], is_completed: true }, error: null }
    mockDeleteReturn = { error: null }
  })

  describe('createReminder', () => {
    it('should create a new reminder', async () => {
      const newReminder = {
        user_id: 'user-1',
        application_id: 'app-1',
        title: 'New reminder',
        description: 'Test description',
        reminder_date: '2025-10-20T10:00:00Z',
        is_completed: false,
      }

      const result = await createReminder(newReminder)
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })

    it('should create a reminder without application_id', async () => {
      mockInsertReturn = {
        data: { ...mockReminders[0], application_id: null },
        error: null,
      }

      const newReminder = {
        user_id: 'user-1',
        application_id: null,
        title: 'General reminder',
        description: null,
        reminder_date: '2025-10-20T10:00:00Z',
        is_completed: false,
      }

      const result = await createReminder(newReminder)
      expect(result).toBeDefined()
      expect(result.application_id).toBeNull()
    })
  })

  describe('getRemindersByApplication', () => {
    it('should fetch reminders for a specific application', async () => {
      const result = await getRemindersByApplication('app-1')
      expect(result).toEqual(mockReminders)
    })

    it('should handle errors when fetching reminders', async () => {
      mockSelectReturn = { data: null, error: { message: 'Database error' } }

      await expect(getRemindersByApplication('app-1')).rejects.toThrow(
        'Failed to fetch reminders: Database error'
      )
    })
  })

  describe('getUpcomingReminders', () => {
    it('should fetch upcoming reminders for a user', async () => {
      const result = await getUpcomingReminders('user-1')
      expect(result).toEqual(mockReminders)
    })

    it('should fetch reminders with custom days parameter', async () => {
      const result = await getUpcomingReminders('user-1', 14)
      expect(result).toEqual(mockReminders)
    })

    it('should handle errors when fetching upcoming reminders', async () => {
      mockSelectReturn = { data: null, error: { message: 'Database error' } }

      await expect(getUpcomingReminders('user-1')).rejects.toThrow(
        'Failed to fetch upcoming reminders: Database error'
      )
    })
  })

  describe('updateReminder', () => {
    it('should update a reminder', async () => {
      mockUpdateReturn = {
        data: { ...mockReminders[0], title: 'Updated title' },
        error: null,
      }

      const updates = {
        title: 'Updated title',
        description: 'Updated description',
      }

      const result = await updateReminder('reminder-1', updates)
      expect(result).toBeDefined()
    })

    it('should handle errors when updating', async () => {
      mockUpdateReturn = { data: null, error: { message: 'Update failed' } }

      await expect(updateReminder('reminder-1', { title: 'New' })).rejects.toThrow(
        'Failed to update reminder: Update failed'
      )
    })
  })

  describe('markReminderComplete', () => {
    it('should mark a reminder as complete', async () => {
      const result = await markReminderComplete('reminder-1')
      expect(result).toBeDefined()
      expect(result.is_completed).toBe(true)
    })

    it('should handle errors when marking complete', async () => {
      mockUpdateReturn = { data: null, error: { message: 'Update failed' } }

      await expect(markReminderComplete('reminder-1')).rejects.toThrow(
        'Failed to mark reminder complete: Update failed'
      )
    })
  })

  describe('deleteReminder', () => {
    it('should delete a reminder', async () => {
      await expect(deleteReminder('reminder-1')).resolves.toBeUndefined()
    })

    it('should handle errors when deleting', async () => {
      mockDeleteReturn = { error: { message: 'Delete failed' } }

      await expect(deleteReminder('reminder-1')).rejects.toThrow(
        'Failed to delete reminder: Delete failed'
      )
    })
  })
})
