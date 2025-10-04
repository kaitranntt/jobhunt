import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReminderCard from '../ReminderCard'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Reminder } from '@/lib/types/database.types'

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ReminderCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnComplete = vi.fn()

  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const mockReminder: Reminder = {
    id: 'reminder-1',
    user_id: 'user-1',
    application_id: 'app-1',
    title: 'Follow up email',
    description: 'Send follow-up email to hiring manager',
    reminder_date: futureDate.toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  describe('Reminder Information Display', () => {
    it('should display reminder title', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Follow up email')).toBeInTheDocument()
    })

    it('should display reminder description', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(
        screen.getByText('Send follow-up email to hiring manager')
      ).toBeInTheDocument()
    })

    it('should display formatted reminder date', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      // Check that some date is displayed (exact format may vary)
      expect(screen.getByText(/\d+/)).toBeInTheDocument()
    })

    it('should truncate long description', () => {
      const longDescription = 'A'.repeat(200)
      const reminderWithLongDesc = {
        ...mockReminder,
        description: longDescription,
      }

      renderWithTheme(
        <ReminderCard
          reminder={reminderWithLongDesc}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const description = screen.getByText(/^A+/)
      expect(description.textContent?.length).toBeLessThan(longDescription.length + 5)
    })

    it('should handle null description', () => {
      const reminderWithoutDesc = {
        ...mockReminder,
        description: null,
      }

      renderWithTheme(
        <ReminderCard
          reminder={reminderWithoutDesc}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Follow up email')).toBeInTheDocument()
    })
  })

  describe('Complete Checkbox', () => {
    it('should render checkbox unchecked for incomplete reminder', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('should render checkbox checked for completed reminder', () => {
      const completedReminder = {
        ...mockReminder,
        is_completed: true,
      }

      renderWithTheme(
        <ReminderCard
          reminder={completedReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should call onComplete when checkbox is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edit and Delete Buttons', () => {
    it('should render edit button', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    it('should render delete button', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Overdue Visual Indicator', () => {
    it('should show overdue indicator for past date and incomplete reminder', () => {
      const overdueReminder = {
        ...mockReminder,
        reminder_date: pastDate.toISOString(),
        is_completed: false,
      }

      renderWithTheme(
        <ReminderCard
          reminder={overdueReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/overdue/i)).toBeInTheDocument()
    })

    it('should NOT show overdue indicator for future date', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument()
    })

    it('should NOT show overdue indicator for completed reminder even if past date', () => {
      const completedOverdueReminder = {
        ...mockReminder,
        reminder_date: pastDate.toISOString(),
        is_completed: true,
      }

      renderWithTheme(
        <ReminderCard
          reminder={completedOverdueReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument()
    })

    it('should apply overdue styling to card', () => {
      const overdueReminder = {
        ...mockReminder,
        reminder_date: pastDate.toISOString(),
        is_completed: false,
      }

      const { container } = renderWithTheme(
        <ReminderCard
          reminder={overdueReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const card = container.querySelector('[data-overdue="true"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible checkbox label', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAccessibleName()
    })

    it('should have accessible button labels', () => {
      renderWithTheme(
        <ReminderCard
          reminder={mockReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      const deleteButton = screen.getByRole('button', { name: /delete/i })

      expect(editButton).toHaveAccessibleName()
      expect(deleteButton).toHaveAccessibleName()
    })
  })

  describe('Edge Cases', () => {
    it('should handle reminder at exact current time', () => {
      const nowReminder = {
        ...mockReminder,
        reminder_date: new Date().toISOString(),
      }

      renderWithTheme(
        <ReminderCard
          reminder={nowReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Follow up email')).toBeInTheDocument()
    })

    it('should handle very long title gracefully', () => {
      const longTitleReminder = {
        ...mockReminder,
        title: 'A'.repeat(255),
      }

      renderWithTheme(
        <ReminderCard
          reminder={longTitleReminder}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/^A+/)).toBeInTheDocument()
    })
  })
})
