import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactList from '../ContactList'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Contact } from '@/lib/types/database.types'

// Mock the API functions
vi.mock('@/lib/api/contacts', () => ({
  getContactsByApplication: vi.fn(),
  deleteContact: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
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

describe('ContactList', () => {
  const mockContacts: Contact[] = [
    {
      id: '1',
      user_id: 'user-123',
      application_id: 'app-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      role: 'HR Manager',
      notes: 'Met at career fair',
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-123',
      application_id: 'app-123',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-5678',
      role: 'Tech Lead',
      notes: 'Very helpful',
      created_at: '2025-10-02T00:00:00Z',
      updated_at: '2025-10-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  describe('Contact List Rendering', () => {
    it('should render list of contacts', async () => {
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should display empty state when no contacts', async () => {
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue([])

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument()
      })
    })

    it('should display contact information correctly', async () => {
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('555-1234')).toBeInTheDocument()
        expect(screen.getByText('HR Manager')).toBeInTheDocument()
      })
    })
  })

  describe('Add Contact Button', () => {
    it('should render add contact button', async () => {
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue([])

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add contact/i })
        expect(addButton).toBeInTheDocument()
      })
    })

    it('should open dialog when add contact button clicked', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue([])

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add contact/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edit Contact', () => {
    it('should open edit dialog when edit button clicked', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
    })

    it('should populate form with contact data in edit mode', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Contact', () => {
    it('should show confirmation dialog when delete button clicked', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })
    })

    it('should delete contact when confirmed', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication, deleteContact } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)
      vi.mocked(deleteContact).mockResolvedValue(undefined)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /continue|delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(deleteContact).toHaveBeenCalledWith('1')
      })
    })

    it('should not delete contact when cancelled', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication, deleteContact } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)
      vi.mocked(deleteContact).mockResolvedValue(undefined)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(deleteContact).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading state while fetching contacts', async () => {
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithTheme(<ContactList applicationId="app-123" />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message on fetch failure', async () => {
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockRejectedValue(
        new Error('Failed to fetch contacts')
      )

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load contacts/i)).toBeInTheDocument()
      })
    })

    it('should display error message on delete failure', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication, deleteContact } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)
      vi.mocked(deleteContact).mockRejectedValue(new Error('Failed to delete'))

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /continue|delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to delete/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should support keyboard navigation between contacts', async () => {
      const user = userEvent.setup()
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /edit/i })

      await user.tab()
      expect(screen.getByRole('button', { name: /add contact/i })).toHaveFocus()

      await user.tab()
      expect(editButtons[0]).toHaveFocus()
    })

    it('should have proper ARIA labels', async () => {
      const { getContactsByApplication } = await import('@/lib/api/contacts')
      vi.mocked(getContactsByApplication).mockResolvedValue(mockContacts)

      renderWithTheme(<ContactList applicationId="app-123" />)

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2)
        expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2)
      })
    })
  })
})
