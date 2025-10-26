import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { KanbanBoardV3 } from '../KanbanBoardV3'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'
import type { ColumnConfig } from '@/lib/types/column.types'
import { columnStorage } from '@/lib/storage/column-storage'

// Mock the column storage
vi.mock('@/lib/storage/column-storage', () => ({
  columnStorage: {
    getColumns: vi.fn(),
  },
}))

// Mock the column colors utility
vi.mock('@/lib/utils/column-colors', () => ({
  getColumnIcon: vi.fn((columnId: string) => {
    const icons: Record<string, string> = {
      saved: '💾',
      applied: '📝',
      interview: '🎯',
      offers: '🎉',
      closed: '❌',
    }
    return icons[columnId] || '📋'
  }),
  getColumnColorClass: vi.fn(
    (color: string) => `glass-light bg-${color}-500/5 border-${color}-300/20`
  ),
}))

// Mock ApplicationCard
vi.mock('../ApplicationCard', () => ({
  ApplicationCard: vi.fn(({ application, _isDragging, onClick, dragHandleProps }) => (
    <div data-testid={`application-card-${application.id}`} role="article">
      <span>{application.company_name}</span>
      {dragHandleProps && (
        <div data-testid="drag-handle" {...dragHandleProps}>
          Drag
        </div>
      )}
      <button onClick={onClick} data-testid={`click-application-${application.id}`}>
        View
      </button>
    </div>
  )),
}))

// Mock ColumnManageModal
vi.mock('../ColumnManageModal', () => ({
  ColumnManageModal: vi.fn(
    ({ isOpen, onClose, onColumnsChange }) =>
      isOpen && (
        <div data-testid="column-manage-modal">
          <button onClick={onClose}>Close</button>
          <button onClick={() => onColumnsChange([])}>Update</button>
        </div>
      )
  ),
}))

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

const mockDefaultColumns: ColumnConfig[] = [
  {
    id: 'saved',
    name: '💾 Saved',
    description: 'Wishlist and saved positions',
    color: 'blue',
    isCustom: false,
    order: 0,
    statuses: ['wishlist'],
  },
  {
    id: 'applied',
    name: '📝 Applied',
    description: 'Applications submitted',
    color: 'purple',
    isCustom: false,
    order: 1,
    statuses: ['applied'],
  },
  {
    id: 'interview',
    name: '🎯 Interview',
    description: 'Phone screens, technical interviews, final rounds',
    color: 'orange',
    isCustom: false,
    order: 2,
    statuses: ['phone_screen', 'assessment', 'take_home', 'interviewing', 'final_round'],
  },
  {
    id: 'offers',
    name: '🎉 Offers',
    description: 'Received offers',
    color: 'green',
    isCustom: false,
    order: 3,
    statuses: ['offered', 'accepted'],
  },
  {
    id: 'closed',
    name: '❌ Closed',
    description: 'Archived applications',
    color: 'slate',
    isCustom: false,
    order: 4,
    statuses: ['rejected', 'ghosted', 'withdrawn'],
  },
]

describe('KanbanBoardV3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(columnStorage.getColumns).mockReturnValue(mockDefaultColumns)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders all 5 default columns', async () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('💾 Saved')).toBeInTheDocument()
        expect(screen.getByText('📝 Applied')).toBeInTheDocument()
        expect(screen.getByText('🎯 Interview')).toBeInTheDocument()
        expect(screen.getByText('🎉 Offers')).toBeInTheDocument()
        expect(screen.getByText('❌ Closed')).toBeInTheDocument()
      })

      // Verify columns are rendered with correct test IDs
      expect(screen.getByTestId('column-saved')).toBeInTheDocument()
      expect(screen.getByTestId('column-applied')).toBeInTheDocument()
      expect(screen.getByTestId('column-interview')).toBeInTheDocument()
      expect(screen.getByTestId('column-offers')).toBeInTheDocument()
      expect(screen.getByTestId('column-closed')).toBeInTheDocument()
    })

    it('renders unified header with title and actions', async () => {
      const onNewApplication = vi.fn()
      render(
        <KanbanBoardV3
          applications={[]}
          onUpdateStatus={vi.fn()}
          onNewApplication={onNewApplication}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
        expect(screen.getByText('Manage Columns')).toBeInTheDocument()
        expect(screen.getByText('New Application')).toBeInTheDocument()
      })
    })

    it('renders search functionality when onSearchChange is provided', async () => {
      const onSearchChange = vi.fn()
      render(
        <KanbanBoardV3
          applications={[]}
          onUpdateStatus={vi.fn()}
          onSearchChange={onSearchChange}
          searchQuery="test query"
        />
      )

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by company or job title...')
        expect(searchInput).toBeInTheDocument()
        expect(searchInput).toHaveValue('test query')
      })
    })

    it('shows loading state when isLoading is true', () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} isLoading={true} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Application Grouping and Display', () => {
    it('groups applications correctly into columns', async () => {
      const applications = [
        createMockApplication({ id: '1', company_name: 'WishlistCo', status: 'wishlist' }),
        createMockApplication({ id: '2', company_name: 'AppliedCo', status: 'applied' }),
        createMockApplication({ id: '3', company_name: 'InterviewCo', status: 'interviewing' }),
        createMockApplication({ id: '4', company_name: 'OfferedCo', status: 'offered' }),
        createMockApplication({ id: '5', company_name: 'RejectedCo', status: 'rejected' }),
      ]

      render(<KanbanBoardV3 applications={applications} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        // Verify count badges
        expect(screen.getByTestId('count-badge-saved')).toHaveTextContent('1')
        expect(screen.getByTestId('count-badge-applied')).toHaveTextContent('1')
        expect(screen.getByTestId('count-badge-interview')).toHaveTextContent('1')
        expect(screen.getByTestId('count-badge-offers')).toHaveTextContent('1')
        expect(screen.getByTestId('count-badge-closed')).toHaveTextContent('1')
      })

      // Verify applications are in correct columns
      expect(screen.getByText('WishlistCo')).toBeInTheDocument()
      expect(screen.getByText('AppliedCo')).toBeInTheDocument()
      expect(screen.getByText('InterviewCo')).toBeInTheDocument()
      expect(screen.getByText('OfferedCo')).toBeInTheDocument()
      expect(screen.getByText('RejectedCo')).toBeInTheDocument()
    })

    it('groups multiple applications correctly', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'wishlist' }),
        createMockApplication({ id: '2', status: 'wishlist' }),
        createMockApplication({ id: '3', status: 'applied' }),
        createMockApplication({ id: '4', status: 'phone_screen' }),
        createMockApplication({ id: '5', status: 'interviewing' }),
      ]

      render(<KanbanBoardV3 applications={applications} onUpdateStatus={vi.fn()} />)

      expect(screen.getByTestId('count-badge-saved')).toHaveTextContent('2')
      expect(screen.getByTestId('count-badge-applied')).toHaveTextContent('1')
      expect(screen.getByTestId('count-badge-interview')).toHaveTextContent('2')
      expect(screen.getByTestId('count-badge-offers')).toHaveTextContent('0')
      expect(screen.getByTestId('count-badge-closed')).toHaveTextContent('0')
    })
  })

  describe('Empty States', () => {
    it('displays contextual empty state for saved column', async () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No saved jobs yet')).toBeInTheDocument()
        expect(
          screen.getByText(/Start by adding jobs you're interested in to your wishlist/)
        ).toBeInTheDocument()
      })
    })

    it('displays contextual empty state for applied column', async () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No applications submitted yet')).toBeInTheDocument()
        expect(screen.getByText('Applications you submit will appear here')).toBeInTheDocument()
      })
    })

    it('shows empty state only for columns without applications', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'applied' }),
        createMockApplication({ id: '2', status: 'interviewing' }),
      ]

      render(<KanbanBoardV3 applications={applications} onUpdateStatus={vi.fn()} />)

      // Applied and Interview have apps - should not show empty state texts
      expect(screen.queryByText('No applications submitted yet')).not.toBeInTheDocument()
      expect(screen.queryByText('No interviews scheduled')).not.toBeInTheDocument()

      // Other columns are empty - should show empty states
      expect(screen.getByText('No saved jobs yet')).toBeInTheDocument()
      expect(screen.getByText('No offers yet')).toBeInTheDocument()
      expect(screen.getByText('No archived applications')).toBeInTheDocument()
    })
  })

  describe('Column Management', () => {
    it('opens column management modal when Manage Columns is clicked', async () => {
      const user = userEvent.setup()
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Manage Columns')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Manage Columns'))

      expect(screen.getByTestId('column-manage-modal')).toBeInTheDocument()
    })

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Manage Columns')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Manage Columns'))
      await user.click(screen.getByText('Close'))

      expect(screen.queryByTestId('column-manage-modal')).not.toBeInTheDocument()
    })

    it('shows Custom badge for custom columns', async () => {
      const customColumn: ColumnConfig = {
        id: 'custom_test',
        name: 'Custom Column',
        description: 'A custom column',
        color: 'pink',
        isCustom: true,
        order: 5,
      }

      vi.mocked(columnStorage.getColumns).mockReturnValue([...mockDefaultColumns, customColumn])

      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('Custom Column')).toBeInTheDocument()
        expect(screen.getByText('Custom')).toBeInTheDocument()
      })
    })
  })

  describe('Interview Column Expansion', () => {
    it('shows expand button for interview column', async () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByTestId('toggle-expand-interview')).toBeInTheDocument()
        expect(screen.getByTestId('toggle-expand-interview')).toHaveAttribute(
          'aria-label',
          'Expand sub-stages'
        )
      })
    })

    it('toggles expansion when clicked', async () => {
      const user = userEvent.setup()
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        const expandButton = screen.getByTestId('toggle-expand-interview')
        expect(expandButton).toHaveAttribute('aria-label', 'Expand sub-stages')
      })

      await user.click(screen.getByTestId('toggle-expand-interview'))

      await waitFor(() => {
        expect(screen.getByTestId('toggle-expand-interview')).toHaveAttribute(
          'aria-label',
          'Collapse sub-stages'
        )
      })
    })

    it('other columns do not have expand buttons', () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      expect(screen.queryByTestId('toggle-expand-saved')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toggle-expand-applied')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toggle-expand-offers')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toggle-expand-closed')).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('calls onSearchChange when search input changes', async () => {
      const user = userEvent.setup()
      const onSearchChange = vi.fn()
      render(
        <KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} onSearchChange={onSearchChange} />
      )

      const searchInput = await screen.findByPlaceholderText('Search by company or job title...')
      expect(searchInput).toBeInTheDocument()

      await user.type(searchInput, 'Google')

      expect(onSearchChange).toHaveBeenCalled()
      expect(onSearchChange).toHaveBeenCalledWith(expect.any(String))
    })

    it('does not render search when onSearchChange is not provided', () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      expect(
        screen.queryByPlaceholderText('Search by company or job title...')
      ).not.toBeInTheDocument()
    })
  })

  describe('New Application Button', () => {
    it('calls onNewApplication when button is clicked', async () => {
      const user = userEvent.setup()
      const onNewApplication = vi.fn()
      render(
        <KanbanBoardV3
          applications={[]}
          onUpdateStatus={vi.fn()}
          onNewApplication={onNewApplication}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Application')).toBeInTheDocument()
      })

      await user.click(screen.getByText('New Application'))

      expect(onNewApplication).toHaveBeenCalledTimes(1)
    })

    it('does not render new application button when onNewApplication is not provided', () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      expect(screen.queryByText('New Application')).not.toBeInTheDocument()
    })
  })

  describe('Application Interactions', () => {
    it('calls onApplicationClick when application is clicked', async () => {
      const user = userEvent.setup()
      const onApplicationClick = vi.fn()
      const application = createMockApplication({ id: 'test-app', company_name: 'TestCo' })

      render(
        <KanbanBoardV3
          applications={[application]}
          onUpdateStatus={vi.fn()}
          onApplicationClick={onApplicationClick}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('TestCo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('click-application-test-app'))

      expect(onApplicationClick).toHaveBeenCalledWith(application)
    })
  })

  describe('Drag and Drop Setup', () => {
    it('renders DnD context with correct test ID', () => {
      const { container } = render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      const dndContext = container.querySelector('[data-testid="kanban-dnd-context"]')
      expect(dndContext).toBeInTheDocument()
    })

    it('renders drag handles for applications', () => {
      const applications = [createMockApplication({ company_name: 'DraggableCo' })]

      render(<KanbanBoardV3 applications={applications} onUpdateStatus={vi.fn()} />)

      expect(screen.getByTestId('drag-handle')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML with proper ARIA labels', () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'Job applications kanban board'
      )
    })

    it('provides screen reader announcements for status changes', () => {
      const { container } = render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      const liveRegion = container.querySelector('[aria-live="polite"][role="status"]')
      expect(liveRegion).toBeInTheDocument()
    })

    it('expand buttons have proper ARIA labels', async () => {
      render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        const expandButton = screen.getByTestId('toggle-expand-interview')
        expect(expandButton).toHaveAttribute('aria-label')
      })
    })
  })

  describe('Responsive Design', () => {
    it('uses horizontal scroll for mobile overflow', () => {
      const { container } = render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      const dndContext = container.querySelector('[data-testid="kanban-dnd-context"]')
      expect(dndContext).toHaveClass('overflow-x-auto')
    })

    it('columns have responsive sizing', () => {
      const { container } = render(<KanbanBoardV3 applications={[]} onUpdateStatus={vi.fn()} />)

      const columns = container.querySelectorAll('[data-testid^="column-"]')
      columns.forEach(column => {
        expect(column).toHaveClass('min-w-[280px]')
        expect(column).toHaveClass('md:min-w-[320px]')
      })
    })
  })

  describe('Performance', () => {
    it('handles large number of applications efficiently', () => {
      const manyApplications = Array.from({ length: 50 }, (_, i) =>
        createMockApplication({
          id: `app-${i}`,
          company_name: `Company ${i}`,
          status: ['wishlist', 'applied', 'interviewing', 'rejected'][i % 4] as ApplicationStatus,
        })
      )

      const { container } = render(
        <KanbanBoardV3 applications={manyApplications} onUpdateStatus={vi.fn()} />
      )

      expect(container).toBeTruthy()
      expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
    })
  })
})
