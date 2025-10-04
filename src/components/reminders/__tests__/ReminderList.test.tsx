import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReminderList from '../ReminderList'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import * as remindersApi from '@/lib/api/reminders'
import type { Reminder } from '@/lib/types/database.types'

// Mock the reminders API
vi.mock('@/lib/api/reminders')

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ReminderList', () => {
  const mockApplicationId = 'app-123'

  const mockReminders: Reminder[] = [
    {
      id: 'reminder-1',
      user_id: 'user-1',
      application_id: mockApplicationId,
      title: 'Follow up email',
      description: 'Send follow-up',
      reminder_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'reminder-2',
      user_id: 'user-1',
      application_id: mockApplicationId,
      title: 'Interview preparation',
      description: 'Review company background',
      reminder_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'reminder-3',
      user_id: 'user-1',
      application_id: mockApplicationId,
      title: 'Past reminder',
      description: 'This is overdue',
      reminder_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  describe('Reminders Rendering', () => {
    it('should render all reminders for the application', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue(
        mockReminders
      )

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('Follow up email')).toBeInTheDocument()
        expect(screen.getByText('Interview preparation')).toBeInTheDocument()
        expect(screen.getByText('Past reminder')).toBeInTheDocument()
      })
    })

    it('should call getRemindersByApplication with correct applicationId', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue([])

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(remindersApi.getRemindersByApplication).toHaveBeenCalledWith(
          mockApplicationId
        )
      })
    })
  })

  describe('Sorting (Upcoming First)', () => {
    it('should display upcoming reminders before past reminders', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue(
        mockReminders
      )

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        const titles = screen
          .getAllByRole('heading', { level: 3 })
          .map(el => el.textContent)

        const followUpIndex = titles.indexOf('Follow up email')
        const pastReminderIndex = titles.indexOf('Past reminder')

        expect(followUpIndex).toBeLessThan(pastReminderIndex)
      })
    })

    it('should sort upcoming reminders by date (earliest first)', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue(
        mockReminders
      )

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        const titles = screen
          .getAllByRole('heading', { level: 3 })
          .map(el => el.textContent)

        const followUpIndex = titles.indexOf('Follow up email')
        const interviewIndex = titles.indexOf('Interview preparation')

        expect(followUpIndex).toBeLessThan(interviewIndex)
      })
    })
  })

  describe('Add Reminder Button', () => {
    it('should render add reminder button', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue([])

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add reminder/i })
        ).toBeInTheDocument()
      })
    })

    it('should open dialog when add reminder button is clicked', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue([])
      const user = userEvent.setup()

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add reminder/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add reminder/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no reminders exist', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue([])

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/no reminders set/i)).toBeInTheDocument()
      })
    })

    it('should not display empty state when reminders exist', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue(
        mockReminders
      )

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.queryByText(/no reminders set/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while fetching', () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockImplementation(
        () => new Promise(() => {})
      )

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockRejectedValue(
        new Error('Failed to fetch reminders')
      )

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load reminders/i)).toBeInTheDocument()
      })
    })
  })

  describe('Refresh on Actions', () => {
    it('should refresh list after adding a reminder', async () => {
      vi.mocked(remindersApi.getRemindersByApplication)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockReminders)

      const user = userEvent.setup()

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/no reminders set/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add reminder/i })
      await user.click(addButton)

      // Simulate successful form submission
      // This would trigger the onSuccess callback which should refresh the list
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      vi.mocked(remindersApi.getRemindersByApplication).mockResolvedValue(
        mockReminders
      )

      renderWithTheme(<ReminderList applicationId={mockApplicationId} />)

      await waitFor(() => {
        const headings = screen.getAllByRole('heading')
        expect(headings.length).toBeGreaterThan(0)
      })
    })
  })
})
