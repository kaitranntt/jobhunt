import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReminderForm from '../ReminderForm'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Reminder } from '@/lib/types/database.types'
import * as remindersApi from '@/lib/api/reminders'

// Mock the reminders API
vi.mock('@/lib/api/reminders')

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ReminderForm', () => {
  const mockOnSuccess = vi.fn()
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  const futureDateString = futureDate.toISOString().slice(0, 16) // datetime-local format

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()

    // Mock successful API calls by default
    vi.mocked(remindersApi.createReminder).mockResolvedValue({
      id: 'new-reminder',
      user_id: 'user-placeholder',
      application_id: null,
      title: 'Test',
      description: null,
      reminder_date: futureDate.toISOString(),
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    vi.mocked(remindersApi.updateReminder).mockResolvedValue({
      id: '123',
      user_id: 'user-1',
      application_id: null,
      title: 'Updated',
      description: null,
      reminder_date: futureDate.toISOString(),
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  })

  describe('Form Rendering', () => {
    it('should render form with all required fields', () => {
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reminder date/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create reminder/i })
      ).toBeInTheDocument()
    })

    it('should mark title as required', () => {
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      expect(titleInput).toBeRequired()
    })

    it('should mark description as optional', () => {
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const descriptionInput = screen.getByLabelText(/description/i)
      expect(descriptionInput).not.toBeRequired()
    })

    it('should mark reminder_date as required', () => {
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const dateInput = screen.getByLabelText(/reminder date/i)
      expect(dateInput).toBeRequired()
    })
  })

  describe('Validation - Required Fields', () => {
    it('should show error when title is empty', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when reminder_date is empty', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Follow up email')

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/reminder date is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when reminder_date is in the past', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      const dateInput = screen.getByLabelText(/reminder date/i)

      await user.type(titleInput, 'Follow up email')

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const pastDateString = pastDate.toISOString().slice(0, 16)

      // Use fireEvent.change for datetime-local input
      fireEvent.change(dateInput, { target: { value: pastDateString } })

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/reminder date must be in the future/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Validation - Max Length', () => {
    it('should show error when title exceeds 255 characters', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      const longTitle = 'A'.repeat(256)

      await user.type(titleInput, longTitle)

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/title must be less than 255 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('should show error when description exceeds 1000 characters', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const dateInput = screen.getByLabelText(/reminder date/i)

      await user.type(titleInput, 'Follow up')
      fireEvent.change(dateInput, { target: { value: futureDateString } })

      const longDescription = 'A'.repeat(1001)
      fireEvent.change(descriptionInput, { target: { value: longDescription } })

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/description must be less than 1000 characters/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid required fields only', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      const dateInput = screen.getByLabelText(/reminder date/i)

      await user.type(titleInput, 'Follow up email')
      fireEvent.change(dateInput, { target: { value: futureDateString } })

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should submit form with all fields filled', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const dateInput = screen.getByLabelText(/reminder date/i)

      await user.type(titleInput, 'Follow up email')
      await user.type(descriptionInput, 'Send follow-up email to hiring manager')
      fireEvent.change(dateInput, { target: { value: futureDateString } })

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should not submit form with invalid data', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Initial Data (Edit Mode)', () => {
    it('should populate form with initial data', () => {
      const initialData: Reminder = {
        id: '123',
        user_id: 'user-1',
        application_id: 'app-1',
        title: 'Existing Reminder',
        description: 'Existing description',
        reminder_date: futureDate.toISOString(),
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      renderWithTheme(
        <ReminderForm
          applicationId={null}
          onSuccess={mockOnSuccess}
          initialData={initialData}
        />
      )

      expect(screen.getByDisplayValue('Existing Reminder')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument()
    })

    it('should update existing data on edit', async () => {
      const user = userEvent.setup()
      const initialData: Reminder = {
        id: '123',
        user_id: 'user-1',
        application_id: 'app-1',
        title: 'Old Title',
        description: 'Old description',
        reminder_date: futureDate.toISOString(),
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      renderWithTheme(
        <ReminderForm
          applicationId={null}
          onSuccess={mockOnSuccess}
          initialData={initialData}
        />
      )

      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')

      const submitButton = screen.getByRole('button', { name: /update reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should show "Update Reminder" button in edit mode', () => {
      const initialData: Reminder = {
        id: '123',
        user_id: 'user-1',
        application_id: 'app-1',
        title: 'Existing Reminder',
        description: null,
        reminder_date: futureDate.toISOString(),
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      renderWithTheme(
        <ReminderForm
          applicationId={null}
          onSuccess={mockOnSuccess}
          initialData={initialData}
        />
      )

      expect(
        screen.getByRole('button', { name: /update reminder/i })
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      expect(screen.getByText(/title/i)).toBeInTheDocument()
      expect(screen.getByText(/description/i)).toBeInTheDocument()
      expect(screen.getByText(/reminder date/i)).toBeInTheDocument()
    })

    it('should have ARIA attributes on invalid fields', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i)
        expect(titleInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      await user.click(titleInput)
      expect(titleInput).toHaveFocus()

      await user.tab()
      expect(descriptionInput).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty optional description field', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByLabelText(/title/i)
      const dateInput = screen.getByLabelText(/reminder date/i)

      await user.type(titleInput, 'Follow up')
      fireEvent.change(dateInput, { target: { value: futureDateString } })

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should clear validation errors when correcting input', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ReminderForm applicationId={null} onSuccess={mockOnSuccess} />
      )

      const submitButton = screen.getByRole('button', { name: /create reminder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Follow up')

      await waitFor(() => {
        expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument()
      })
    })
  })
})
