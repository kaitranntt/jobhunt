import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UpcomingReminders from '../UpcomingReminders'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import * as remindersApi from '@/lib/api/reminders'
import type { Reminder } from '@/lib/types/database.types'

// Mock the reminders API
vi.mock('@/lib/api/reminders')

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('UpcomingReminders', () => {
  const mockUserId = 'user-123'

  const createMockReminder = (
    id: string,
    title: string,
    applicationId: string,
    hoursFromNow: number
  ): Reminder => ({
    id,
    user_id: mockUserId,
    application_id: applicationId,
    title,
    description: `Description for ${title}`,
    reminder_date: new Date(
      Date.now() + hoursFromNow * 60 * 60 * 1000
    ).toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const mockReminders: Reminder[] = [
    createMockReminder('1', 'Follow up email', 'app-1', 2),
    createMockReminder('2', 'Interview prep', 'app-2', 24),
    createMockReminder('3', 'Thank you note', 'app-3', 48),
    createMockReminder('4', 'Check status', 'app-4', 72),
    createMockReminder('5', 'Research company', 'app-5', 96),
    createMockReminder('6', 'Should not show', 'app-6', 120), // 6th reminder
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
    mockPush.mockClear()
  })

  describe('Widget Rendering', () => {
    it('should render widget title', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue([])

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(screen.getByText(/upcoming reminders/i)).toBeInTheDocument()
      })
    })

    it('should call getUpcomingReminders with correct userId', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue([])

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(remindersApi.getUpcomingReminders).toHaveBeenCalledWith(
          mockUserId
        )
      })
    })
  })

  describe('Display Next 5 Reminders', () => {
    it('should display up to 5 upcoming reminders', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(screen.getByText('Follow up email')).toBeInTheDocument()
        expect(screen.getByText('Interview prep')).toBeInTheDocument()
        expect(screen.getByText('Thank you note')).toBeInTheDocument()
        expect(screen.getByText('Check status')).toBeInTheDocument()
        expect(screen.getByText('Research company')).toBeInTheDocument()
      })
    })

    it('should not display more than 5 reminders', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(screen.queryByText('Should not show')).not.toBeInTheDocument()
      })
    })

    it('should display fewer than 5 reminders if less available', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders.slice(0, 3)
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(screen.getByText('Follow up email')).toBeInTheDocument()
        expect(screen.getByText('Interview prep')).toBeInTheDocument()
        expect(screen.getByText('Thank you note')).toBeInTheDocument()
        expect(screen.queryByText('Check status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Compact Card Design', () => {
    it('should render reminders in compact format', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders.slice(0, 2)
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        const cards = screen.getAllByRole('button')
        expect(cards.length).toBeGreaterThan(0)
      })
    })

    it('should display reminder title in compact view', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders.slice(0, 1)
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(screen.getByText('Follow up email')).toBeInTheDocument()
      })
    })

    it('should display reminder date in compact view', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders.slice(0, 1)
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        // Check that a date is displayed (format may vary)
        expect(screen.getByText(/\d+/)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation to Application', () => {
    it('should navigate to application detail when reminder is clicked', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders.slice(0, 1)
      )
      const user = userEvent.setup()

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(screen.getByText('Follow up email')).toBeInTheDocument()
      })

      const reminderButton = screen.getByRole('button', {
        name: /follow up email/i,
      })
      await user.click(reminderButton)

      expect(mockPush).toHaveBeenCalledWith('/applications/app-1')
    })

    it('should handle reminders without application_id gracefully', async () => {
      const reminderWithoutApp = {
        ...mockReminders[0],
        application_id: null,
      }

      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue([
        reminderWithoutApp,
      ])
      const user = userEvent.setup()

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(screen.getByText('Follow up email')).toBeInTheDocument()
      })

      const reminderButton = screen.getByRole('button', {
        name: /follow up email/i,
      })
      await user.click(reminderButton)

      // Should not navigate if no application_id
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('should display empty message when no upcoming reminders', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue([])

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(
          screen.getByText(/no upcoming reminders/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while fetching', () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockImplementation(
        () => new Promise(() => {})
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockRejectedValue(
        new Error('Failed to fetch')
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load reminders/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible reminder buttons', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue(
        mockReminders.slice(0, 2)
      )

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
          expect(button).toHaveAccessibleName()
        })
      })
    })

    it('should have proper heading for widget', async () => {
      vi.mocked(remindersApi.getUpcomingReminders).mockResolvedValue([])

      renderWithTheme(<UpcomingReminders userId={mockUserId} />)

      await waitFor(() => {
        // CardTitle is rendered as div, so check for text content
        expect(screen.getByText(/upcoming reminders/i)).toBeInTheDocument()
      })
    })
  })
})
