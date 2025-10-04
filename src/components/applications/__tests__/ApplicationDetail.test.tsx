import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ApplicationDetail } from '../ApplicationDetail'
import type { Application } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'

const createMockApplication = (overrides?: Partial<Application>): Application => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user-123',
  company_name: 'TechCorp Inc',
  job_title: 'Senior Software Engineer',
  job_url: 'https://example.com/job',
  location: 'San Francisco, CA',
  salary_range: '$120k - $180k',
  status: 'applied',
  date_applied: '2025-10-01',
  notes: 'Great opportunity',
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2025-10-01T10:00:00Z',
  ...overrides,
})

describe('ApplicationDetail', () => {
  const mockOnUpdate = vi.fn<(id: string, data: ApplicationFormData) => Promise<void>>()
  const mockOnDelete = vi.fn<(id: string) => Promise<void>>()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnUpdate.mockResolvedValue(undefined)
    mockOnDelete.mockResolvedValue(undefined)
  })

  describe('View Mode - Default State', () => {
    it('renders in view mode by default', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Should display company name and job title in header
      expect(screen.getAllByText('TechCorp Inc').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Senior Software Engineer').length).toBeGreaterThan(0)

      // Should show Edit button (not Cancel)
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })

    it('displays all application fields with proper labels', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Check for field labels and values
      expect(screen.getByText(/company name/i)).toBeInTheDocument()
      expect(screen.getAllByText('TechCorp Inc').length).toBeGreaterThan(0)

      expect(screen.getByText(/job title/i)).toBeInTheDocument()
      expect(screen.getAllByText('Senior Software Engineer').length).toBeGreaterThan(0)

      expect(screen.getByText(/location/i)).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()

      expect(screen.getByText(/salary range/i)).toBeInTheDocument()
      expect(screen.getByText('$120k - $180k')).toBeInTheDocument()

      expect(screen.getByText(/status/i)).toBeInTheDocument()
      expect(screen.getAllByText('applied').length).toBeGreaterThan(0)

      expect(screen.getByText(/date applied/i)).toBeInTheDocument()

      expect(screen.getByText(/notes/i)).toBeInTheDocument()
      expect(screen.getByText('Great opportunity')).toBeInTheDocument()
    })

    it('displays status badge with correct color for applied status', () => {
      const application = createMockApplication({ status: 'applied' })
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const badges = screen.getAllByText('applied')
      const badge = badges.find((el) => el.className.includes('glass-light'))
      expect(badge).toBeInTheDocument()
    })

    it('displays formatted date in readable format', () => {
      const application = createMockApplication({ date_applied: '2025-10-15' })
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Should format date as "Oct 15, 2025"
      expect(screen.getByText(/Oct 15, 2025/i)).toBeInTheDocument()
    })

    it('handles null optional fields gracefully', () => {
      const application = createMockApplication({
        job_url: null,
        location: null,
        salary_range: null,
        notes: null,
      })
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Should render without errors
      expect(screen.getAllByText('TechCorp Inc').length).toBeGreaterThan(0)

      // Should show "N/A" or empty state for null fields
      const naTags = screen.getAllByText(/n\/a/i)
      expect(naTags.length).toBeGreaterThanOrEqual(3) // location, salary_range, notes
    })

    it('displays job URL as clickable link when present', () => {
      const application = createMockApplication({ job_url: 'https://example.com/job' })
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const link = screen.getByRole('link', { name: /view job posting/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/job')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('Edit Mode Toggle', () => {
    it('switches to edit mode when Edit button is clicked', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Should show Cancel button instead of Edit
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()

      // Should show form fields (ApplicationForm component)
      expect(screen.getByRole('textbox', { name: /company name/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /job title/i })).toBeInTheDocument()
    })

    it('shows ApplicationForm with initialData populated in edit mode', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Form fields should be populated with application data
      const companyInput = screen.getByRole('textbox', { name: /company name/i })
      expect(companyInput).toHaveValue('TechCorp Inc')

      const jobTitleInput = screen.getByRole('textbox', { name: /job title/i })
      expect(jobTitleInput).toHaveValue('Senior Software Engineer')
    })

    it('returns to view mode when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Switch to edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should be back in view mode
      expect(screen.getAllByRole('button', { name: /edit/i }).length).toBeGreaterThan(0)
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()

      // Should not show form inputs
      expect(screen.queryByRole('textbox', { name: /company name/i })).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('calls onUpdate with correct data when form is submitted', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Switch to edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Modify company name
      const companyInput = screen.getByRole('textbox', { name: /company name/i })
      await user.clear(companyInput)
      await user.type(companyInput, 'Updated Corp')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      // Should call onUpdate with application ID and updated data
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          application.id,
          expect.objectContaining({
            company_name: 'Updated Corp',
            job_title: 'Senior Software Engineer',
          })
        )
      })
    })

    it('shows loading state during form submission', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()

      // Make onUpdate take some time
      mockOnUpdate.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Switch to edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText(/submitting/i)).toBeInTheDocument()
    })

    it('returns to view mode after successful submission', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Switch to edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      // Should return to view mode
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i }).length).toBeGreaterThan(0)
        expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
      })
    })

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()

      // Make onUpdate reject
      mockOnUpdate.mockRejectedValue(new Error('Network error'))

      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Switch to edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update/i)).toBeInTheDocument()
      })

      // Should remain in edit mode
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('Delete Functionality', () => {
    it('shows confirmation dialog when Delete button is clicked', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Should show confirmation dialog
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    })

    it('calls onDelete when confirmation is confirmed', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm|delete/i })
      await user.click(confirmButton)

      // Should call onDelete with application ID
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(application.id)
      })
    })

    it('closes confirmation dialog when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })

      // Should NOT call onDelete
      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    it('calls onDelete and closes dialog on successful deletion', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()

      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Confirm dialog should be shown
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()

      const confirmButtons = screen.getAllByRole('button', { name: /delete/i })
      // Find the confirmation button (there might be multiple Delete buttons)
      const confirmButton = confirmButtons[confirmButtons.length - 1]
      await user.click(confirmButton)

      // Should call onDelete
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(application.id)
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('handles deletion errors gracefully', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()

      // Make onDelete reject
      mockOnDelete.mockRejectedValue(new Error('Network error'))

      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm|delete/i })
      await user.click(confirmButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to delete/i)).toBeInTheDocument()
      })
    })
  })

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      // The X button should be the first close button
      await user.click(closeButtons[0])

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Sheet Visibility', () => {
    it('shows Sheet when isOpen is true', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Sheet should be visible
      expect(screen.getAllByText('TechCorp Inc').length).toBeGreaterThan(0)
    })

    it('hides Sheet when isOpen is false', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={false}
        />
      )

      // Sheet content should not be visible
      expect(screen.queryByText('TechCorp Inc')).not.toBeInTheDocument()
    })
  })

  describe('Mobile-Friendly Design', () => {
    it('uses Sheet component for mobile-friendly modal', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Sheet component should be present (Portal rendered)
      const sheet = screen.getByRole('dialog')
      expect(sheet).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      expect(screen.getAllByRole('button', { name: /edit/i }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('button', { name: /close/i }).length).toBeGreaterThan(0)
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(
        <ApplicationDetail
          application={application}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          isOpen={true}
        />
      )

      // Tab should focus the first interactive element in the Sheet
      await user.tab()

      // Verify some button has focus (Sheet focuses first element automatically)
      const allButtons = screen.getAllByRole('button')
      const hasFocus = allButtons.some((button) => button === document.activeElement)
      expect(hasFocus).toBe(true)
    })
  })
})
