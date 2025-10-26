/**
 * Tests for Column Management Modal
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ColumnManageModal } from '../ColumnManageModal'
import { columnStorage } from '@/lib/storage/column-storage'

// Mock the storage
vi.mock('@/lib/storage/column-storage', () => ({
  columnStorage: {
    getColumns: vi.fn(),
    createCustomColumn: vi.fn(),
    updateCustomColumn: vi.fn(),
    deleteCustomColumn: vi.fn(),
    reorderColumns: vi.fn(),
  },
}))

// Mock the design tokens
vi.mock('@/lib/utils/column-colors', () => ({
  getAvailableColorOptions: () => [
    { value: 'blue', label: 'Blue', preview: 'bg-blue-500' },
    { value: 'green', label: 'Green', preview: 'bg-green-500' },
  ],
  DEFAULT_COLUMN_ICONS: ['📌', '⭐', '🔥'],
}))

describe('ColumnManageModal', () => {
  const mockOnClose = vi.fn()
  const mockOnColumnsChange = vi.fn()

  const mockColumns = [
    {
      id: 'saved' as const,
      name: '💾 Saved',
      description: 'Wishlist and saved positions',
      color: 'blue' as const,
      isCustom: false,
      order: 0,
      statuses: ['wishlist' as const],
    },
    {
      id: 'applied' as const,
      name: '📝 Applied',
      description: 'Applications submitted',
      color: 'purple' as const,
      isCustom: false,
      order: 1,
      statuses: ['applied' as const],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(columnStorage.getColumns).mockReturnValue(mockColumns)
  })

  it('renders modal when open', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        onColumnsChange={mockOnColumnsChange}
      />
    )

    expect(screen.getByText('Manage Columns')).toBeInTheDocument()
    expect(screen.getByText('Core Columns')).toBeInTheDocument()
    expect(screen.getByText('Custom Columns')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ColumnManageModal
        isOpen={false}
        onClose={mockOnClose}
        onColumnsChange={mockOnColumnsChange}
      />
    )

    expect(screen.queryByText('Manage Columns')).not.toBeInTheDocument()
  })

  it('displays core columns', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        onColumnsChange={mockOnColumnsChange}
      />
    )

    expect(screen.getByText('💾 Saved')).toBeInTheDocument()
    expect(screen.getByText('📝 Applied')).toBeInTheDocument()
    expect(screen.getByText('Wishlist and saved positions')).toBeInTheDocument()
  })

  it('shows add column form when Add Column button is clicked', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        onColumnsChange={mockOnColumnsChange}
      />
    )

    const addButton = screen.getByText('Add Column')
    fireEvent.click(addButton)

    expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Column description (optional)')).toBeInTheDocument()
  })

  it('creates new custom column when form is submitted', async () => {
    const mockCustomColumn = {
      id: 'custom_123',
      name: 'Test Column',
      description: 'Test description',
      color: 'green' as const,
      icon: '📌',
      isCustom: true,
      order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    vi.mocked(columnStorage.createCustomColumn).mockReturnValue(mockCustomColumn)

    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        onColumnsChange={mockOnColumnsChange}
      />
    )

    // Open add form
    const addButton = screen.getByText('Add Column')
    fireEvent.click(addButton)

    // Fill form
    const nameInput = screen.getByPlaceholderText('Column name')
    const descriptionInput = screen.getByPlaceholderText('Column description (optional)')

    fireEvent.change(nameInput, { target: { value: 'Test Column' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } })

    // Select first color (green)
    const colorButtons = screen
      .getAllByRole('button')
      .filter(button => button.classList.contains('bg-green-500'))
    if (colorButtons.length > 0) {
      fireEvent.click(colorButtons[0])
    }

    // Submit form
    const createButton = screen.getByText('Create Column')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(columnStorage.createCustomColumn).toHaveBeenCalledWith({
        name: 'Test Column',
        description: 'Test description',
        color: 'green',
        icon: '',
      })
    })

    expect(mockOnColumnsChange).toHaveBeenCalled()
  })

  it('shows empty state when no custom columns exist', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        onColumnsChange={mockOnColumnsChange}
      />
    )

    expect(screen.getByText('No custom columns yet')).toBeInTheDocument()
    expect(
      screen.getByText('Add custom columns to track additional application stages')
    ).toBeInTheDocument()
  })

  it('calls onClose when Done button is clicked', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        onColumnsChange={mockOnColumnsChange}
      />
    )

    const doneButton = screen.getByText('Done')
    fireEvent.click(doneButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
