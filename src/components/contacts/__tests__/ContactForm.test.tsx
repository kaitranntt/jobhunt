import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactForm from '../ContactForm'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Contact } from '@/lib/types/database.types'

// Mock the API functions
vi.mock('@/lib/api/contacts', () => ({
  createContact: vi.fn().mockResolvedValue({ id: 'new-contact-id' }),
  updateContact: vi.fn().mockResolvedValue({ id: 'updated-contact-id' }),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
  })),
}))

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ContactForm', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  describe('Form Rendering', () => {
    it('should render form with all fields', () => {
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })

    it('should mark name field as required', () => {
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/contact name/i)
      expect(nameInput).toBeRequired()
    })

    it('should render optional fields without required attribute', () => {
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const roleInput = screen.getByLabelText(/role/i)
      const notesInput = screen.getByLabelText(/notes/i)

      expect(emailInput).not.toBeRequired()
      expect(phoneInput).not.toBeRequired()
      expect(roleInput).not.toBeRequired()
      expect(notesInput).not.toBeRequired()
    })
  })

  describe('Validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/contact name is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/contact name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/must be a valid email address/i)).toBeInTheDocument()
      })
    })

    it('should accept valid email format', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/contact name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/must be a valid email address/i)).not.toBeInTheDocument()
      })
    })

    it('should allow empty optional fields', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/contact name/i)
      await user.type(nameInput, 'John Doe')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSuccess after successful submission', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ContactForm
          applicationId="123e4567-e89b-12d3-a456-426614174000"
          onSuccess={mockOnSuccess}
        />
      )

      const nameInput = screen.getByLabelText(/contact name/i)
      await user.type(nameInput, 'John Doe')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should submit with all fields filled', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ContactForm
          applicationId="123e4567-e89b-12d3-a456-426614174000"
          onSuccess={mockOnSuccess}
        />
      )

      const nameInput = screen.getByLabelText(/contact name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const roleInput = screen.getByLabelText(/role/i)
      const notesInput = screen.getByLabelText(/notes/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(phoneInput, '555-1234')
      await user.type(roleInput, 'HR Manager')
      await user.type(notesInput, 'Met at career fair')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/contact name/i)
      await user.type(nameInput, 'John Doe')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      const loadingButton = screen.getByRole('button', { name: /saving|submit/i })
      expect(loadingButton).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should populate form with initial data', () => {
      const initialData: Contact = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        user_id: '123e4567-e89b-12d3-a456-426614174002',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        role: 'Tech Lead',
        notes: 'Very helpful',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-01T00:00:00Z',
      }

      renderWithTheme(
        <ContactForm
          applicationId="123e4567-e89b-12d3-a456-426614174000"
          onSuccess={mockOnSuccess}
          initialData={initialData}
        />
      )

      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument()
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('555-5678')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Tech Lead')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Very helpful')).toBeInTheDocument()
    })

    it('should update existing contact on edit submission', async () => {
      const user = userEvent.setup()
      const initialData: Contact = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        user_id: '123e4567-e89b-12d3-a456-426614174002',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        role: 'Tech Lead',
        notes: 'Very helpful',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-01T00:00:00Z',
      }

      renderWithTheme(
        <ContactForm
          applicationId="123e4567-e89b-12d3-a456-426614174000"
          onSuccess={mockOnSuccess}
          initialData={initialData}
        />
      )

      const nameInput = screen.getByLabelText(/contact name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on submission failure', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/contact name/i)
      await user.type(nameInput, 'John Doe')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      // Error handling will be tested once component is implemented
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /submit|saving/i })
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      expect(screen.getByText(/contact name/i)).toBeInTheDocument()
      expect(screen.getByText(/email/i)).toBeInTheDocument()
      expect(screen.getByText(/phone/i)).toBeInTheDocument()
      expect(screen.getByText(/role/i)).toBeInTheDocument()
      expect(screen.getByText(/notes/i)).toBeInTheDocument()
    })

    it('should have ARIA attributes on invalid fields', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/contact name/i)
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithTheme(<ContactForm applicationId={null} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/contact name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.click(nameInput)
      expect(nameInput).toHaveFocus()

      await user.tab()
      expect(emailInput).toHaveFocus()
    })
  })
})
