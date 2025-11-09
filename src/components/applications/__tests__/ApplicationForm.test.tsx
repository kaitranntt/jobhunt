import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApplicationForm from '../ApplicationForm'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ApplicationForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  describe('Form Rendering', () => {
    it('should render form with all required fields', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/job title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/job url/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/salary range/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date applied/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })

    it('should mark required fields with required attribute', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)

      expect(companyInput).toBeRequired()
      expect(jobTitleInput).toBeRequired()
    })

    it('should render optional fields without required attribute', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const jobUrlInput = screen.getByLabelText(/job url/i)
      const locationInput = screen.getByLabelText(/location/i)
      const salaryInput = screen.getByLabelText(/salary range/i)
      const notesInput = screen.getByLabelText(/notes/i)

      expect(jobUrlInput).not.toBeRequired()
      expect(locationInput).not.toBeRequired()
      expect(salaryInput).not.toBeRequired()
      expect(notesInput).not.toBeRequired()
    })
  })

  describe('Validation - Required Fields', () => {
    it('should show error when company name is empty', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/company name is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when job title is empty', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      await user.type(companyInput, 'Test Company')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/job title is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Validation - URL Format', () => {
    it('should show error for invalid URL format', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)
      const jobUrlInput = screen.getByLabelText(/job url/i)

      await user.type(companyInput, 'Test Company')
      await user.type(jobTitleInput, 'Software Engineer')
      await user.type(jobUrlInput, 'not-a-valid-url')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should accept valid URL format', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)
      const jobUrlInput = screen.getByLabelText(/job url/i)

      await user.type(companyInput, 'Test Company')
      await user.type(jobTitleInput, 'Software Engineer')
      await user.type(jobUrlInput, 'https://example.com/job/123')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should allow empty URL field', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)

      await user.type(companyInput, 'Test Company')
      await user.type(jobTitleInput, 'Software Engineer')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Validation - Max Length', () => {
    it('should show error when company name exceeds 255 characters', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const longName = 'A'.repeat(256)

      await user.type(companyInput, longName)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/company name must be less than 255 characters/i)
        ).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when notes exceed 5000 characters', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)
      const notesInput = screen.getByLabelText(/notes/i)

      await user.type(companyInput, 'Test Company')
      await user.type(jobTitleInput, 'Software Engineer')

      const longNotes = 'A'.repeat(5001)
      fireEvent.change(notesInput, { target: { value: longNotes } })

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/notes must be less than 5000 characters/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid required fields only', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)

      await user.type(companyInput, 'Test Company')
      await user.type(jobTitleInput, 'Software Engineer')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'Test Company',
            job_title: 'Software Engineer',
          })
        )
      })
    })

    it('should submit form with all fields filled', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)
      const jobUrlInput = screen.getByLabelText(/job url/i)
      const locationInput = screen.getByLabelText(/location/i)
      const salaryInput = screen.getByLabelText(/salary range/i)
      const dateInput = screen.getByLabelText(/date applied/i)
      const notesInput = screen.getByLabelText(/notes/i)

      await user.type(companyInput, 'Test Company')
      await user.type(jobTitleInput, 'Software Engineer')
      await user.type(jobUrlInput, 'https://example.com/job')
      await user.type(locationInput, 'Remote')
      await user.type(salaryInput, '$100k-$150k')
      fireEvent.change(dateInput, { target: { value: '2025-10-03' } })
      await user.type(notesInput, 'This is a test note')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'Test Company',
            job_title: 'Software Engineer',
            job_url: 'https://example.com/job',
            location: 'Remote',
            salary_range: '$100k-$150k',
            date_applied: '2025-10-03',
            notes: 'This is a test note',
          })
        )
      })
    })

    it('should not submit form with invalid data', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/company name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/job title is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Initial Data (Edit Mode)', () => {
    it('should populate form with initial data', () => {
      const initialData: Partial<ApplicationFormData> = {
        company_name: 'Existing Company',
        job_title: 'Senior Developer',
        job_url: 'https://example.com/existing-job',
        location: 'San Francisco, CA',
        salary_range: '$120k-$160k',
        status: 'applied',
        date_applied: '2025-09-15',
        notes: 'Existing notes',
      }

      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} initialData={initialData} />)

      expect(screen.getByDisplayValue('Existing Company')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Senior Developer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://example.com/existing-job')).toBeInTheDocument()
      expect(screen.getByDisplayValue('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByDisplayValue('$120k-$160k')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2025-09-15')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing notes')).toBeInTheDocument()
    })

    it('should update existing data on edit', async () => {
      const user = userEvent.setup()
      const initialData: Partial<ApplicationFormData> = {
        company_name: 'Old Company',
        job_title: 'Junior Developer',
      }

      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} initialData={initialData} />)

      const companyInput = screen.getByLabelText(/company name/i)
      await user.clear(companyInput)
      await user.type(companyInput, 'New Company')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'New Company',
            job_title: 'Junior Developer',
          })
        )
      })
    })
  })

  describe('Loading State', () => {
    it('should disable submit button when loading', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} isLoading={true} />)

      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when not loading', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} isLoading={false} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should show loading text during submission', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} isLoading={true} />)

      expect(screen.getByText(/submitting/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyLabel = screen.getByText(/company name/i)
      const jobTitleLabel = screen.getByText(/job title/i)
      const jobUrlLabel = screen.getByText(/job url/i)
      const locationLabel = screen.getByText(/location/i)
      const salaryLabel = screen.getByText(/salary range/i)
      const statusLabel = screen.getByText(/status/i)
      const dateLabel = screen.getByText(/date applied/i)
      const notesLabel = screen.getByRole('textbox', { name: /notes/i })

      expect(companyLabel).toBeInTheDocument()
      expect(jobTitleLabel).toBeInTheDocument()
      expect(jobUrlLabel).toBeInTheDocument()
      expect(locationLabel).toBeInTheDocument()
      expect(salaryLabel).toBeInTheDocument()
      expect(statusLabel).toBeInTheDocument()
      expect(dateLabel).toBeInTheDocument()
      expect(notesLabel).toBeInTheDocument()
    })

    it('should have ARIA attributes on invalid fields', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        const companyInput = screen.getByLabelText(/company name/i)
        expect(companyInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)

      await user.click(companyInput)
      expect(companyInput).toHaveFocus()

      await user.tab()
      expect(jobTitleInput).toHaveFocus()
    })
  })

  describe('Cancel Button', () => {
    it('should not render cancel button when onCancel is not provided', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })

    it('should render cancel button when onCancel is provided', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should disable cancel button when loading', () => {
      renderWithTheme(
        <ApplicationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={true} />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeDisabled()
    })

    it('should render cancel and submit buttons on the same row', () => {
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const submitButton = screen.getByRole('button', { name: /submit/i })

      // Both buttons should be in the same parent container
      expect(cancelButton.parentElement).toBe(submitButton.parentElement)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty optional fields correctly', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)

      await user.type(companyInput, 'Test Company')
      await user.type(jobTitleInput, 'Software Engineer')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'Test Company',
            job_title: 'Software Engineer',
            job_url: '',
            location: '',
            salary_range: '',
            notes: '',
          })
        )
      })
    })

    it('should handle special characters in text fields', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const companyInput = screen.getByLabelText(/company name/i)
      const jobTitleInput = screen.getByLabelText(/job title/i)
      const notesInput = screen.getByLabelText(/notes/i)

      await user.type(companyInput, 'Test & Company <Inc.>')
      await user.type(jobTitleInput, 'Senior C++ Developer')
      await user.type(notesInput, 'Special chars: @#$%^&*()')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'Test & Company <Inc.>',
            job_title: 'Senior C++ Developer',
            notes: 'Special chars: @#$%^&*()',
          })
        )
      })
    })

    it('should clear validation errors when correcting input', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ApplicationForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/company name is required/i)).toBeInTheDocument()
      })

      const companyInput = screen.getByLabelText(/company name/i)
      await user.type(companyInput, 'Test Company')

      await waitFor(() => {
        expect(screen.queryByText(/company name is required/i)).not.toBeInTheDocument()
      })
    })
  })
})
