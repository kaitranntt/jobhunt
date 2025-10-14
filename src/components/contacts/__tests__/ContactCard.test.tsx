import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactCard from '../ContactCard'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Contact } from '@/lib/types/database.types'

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ContactCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  const mockContact: Contact = {
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
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
  })

  describe('Contact Information Display', () => {
    it('should render contact name', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should render contact email', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('should render contact phone', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText('555-1234')).toBeInTheDocument()
    })

    it('should render contact role', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText('HR Manager')).toBeInTheDocument()
    })

    it('should not display email when null', () => {
      const contactWithoutEmail = { ...mockContact, email: null }
      renderWithTheme(
        <ContactCard contact={contactWithoutEmail} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument()
    })

    it('should not display phone when null', () => {
      const contactWithoutPhone = { ...mockContact, phone: null }
      renderWithTheme(
        <ContactCard contact={contactWithoutPhone} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.queryByText('555-1234')).not.toBeInTheDocument()
    })

    it('should not display role when null', () => {
      const contactWithoutRole = { ...mockContact, role: null }
      renderWithTheme(
        <ContactCard contact={contactWithoutRole} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.queryByText('HR Manager')).not.toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render edit button', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toBeInTheDocument()
    })

    it('should render delete button', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      expect(deleteButton).toBeInTheDocument()
    })

    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Responsive Layout', () => {
    it('should render in a card layout with glass styling', () => {
      const { container } = renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const card = container.querySelector('.rounded-glass')
      expect(card).toBeInTheDocument()
    })

    it('should display all contact info in mobile-friendly format', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('555-1234')).toBeInTheDocument()
      expect(screen.getByText('HR Manager')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <ContactCard contact={mockContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      const deleteButton = screen.getByRole('button', { name: /delete/i })

      await user.tab()
      expect(editButton).toHaveFocus()

      await user.tab()
      expect(deleteButton).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle contact with minimal information', () => {
      const minimalContact: Contact = {
        id: '2',
        user_id: 'user-123',
        application_id: null,
        name: 'Jane Doe',
        email: null,
        phone: null,
        role: null,
        notes: null,
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-01T00:00:00Z',
      }

      renderWithTheme(
        <ContactCard contact={minimalContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('should handle long contact names', () => {
      const longNameContact = {
        ...mockContact,
        name: 'John Jacob Jingleheimer Schmidt-Anderson III',
      }

      renderWithTheme(
        <ContactCard contact={longNameContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText('John Jacob Jingleheimer Schmidt-Anderson III')).toBeInTheDocument()
    })

    it('should handle long email addresses', () => {
      const longEmailContact = {
        ...mockContact,
        email: 'john.jacob.jingleheimer.schmidt@verylongdomainname.example.com',
      }

      renderWithTheme(
        <ContactCard contact={longEmailContact} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(
        screen.getByText('john.jacob.jingleheimer.schmidt@verylongdomainname.example.com')
      ).toBeInTheDocument()
    })
  })
})
