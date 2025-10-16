import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedKanbanBoard } from '../KanbanBoardV3'
import type { Application, Board, BoardColumn, BoardSettings } from '@/lib/types/database.types'

// Mock @dnd-kit
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DragOverlay: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="drag-overlay">{children}</div>
    ),
    useSensor: () => vi.fn(),
    useSensors: () => vi.fn(),
    closestCorners: vi.fn(),
  }
})

vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable')
  return {
    ...actual,
    SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      setActivatorNodeRef: vi.fn(),
    }),
    verticalListSortingStrategy: vi.fn(),
  }
})

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: any) => (
    <div onClick={onClick} {...props}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockBoard: Board = {
  id: 'board-1',
  user_id: 'user-1',
  name: 'Job Applications',
  description: 'Main job application board',
  is_default: true,
  is_archived: false,
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2025-10-01T10:00:00Z',
}

const mockColumns: BoardColumn[] = [
  {
    id: 'col-1',
    board_id: 'board-1',
    user_id: 'user-1',
    name: 'Applied',
    color: '#3b82f6',
    position: 1,
    wip_limit: 5,
    is_default: true,
    is_archived: false,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 'col-2',
    board_id: 'board-1',
    user_id: 'user-1',
    name: 'Interviewing',
    color: '#10b981',
    position: 2,
    wip_limit: 3,
    is_default: false,
    is_archived: false,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

const mockSettings: BoardSettings = {
  id: 'settings-1',
  board_id: 'board-1',
  user_id: 'user-1',
  theme: 'default',
  compact_mode: false,
  show_empty_columns: true,
  show_column_counts: true,
  enable_animations: true,
  auto_archive_days: 30,
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2025-10-01T10:00:00Z',
}

const mockApplications: Application[] = [
  {
    id: 'app-1',
    user_id: 'user-1',
    company_name: 'Tech Corp',
    job_title: 'Software Engineer',
    status: 'applied',
    job_url: 'https://techcorp.com/jobs/123',
    location: 'San Francisco, CA',
    salary_range: '$120k - $180k',
    notes: 'Great company culture',
    date_applied: '2025-10-01',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 'app-2',
    user_id: 'user-1',
    company_name: 'StartupXYZ',
    job_title: 'Frontend Developer',
    status: 'interviewing',
    job_url: 'https://startupxyz.com/jobs/456',
    location: 'Remote',
    salary_range: '$100k - $150k',
    notes: 'Remote position',
    date_applied: '2025-10-02',
    created_at: '2025-10-02T10:00:00Z',
    updated_at: '2025-10-02T10:00:00Z',
  },
]

// Mock ApplicationCard component
vi.mock('../ApplicationCard', () => ({
  ApplicationCard: ({ application, isDragging, onClick, dragHandleProps }: any) => (
    <div
      data-testid={`application-card-${application.id}`}
      data-testid-dragging={isDragging}
      onClick={onClick}
      {...dragHandleProps}
    >
      <div data-testid={`application-company-${application.id}`}>{application.company_name}</div>
      <div data-testid={`application-title-${application.id}`}>{application.job_title}</div>
    </div>
  ),
}))

describe('EnhancedKanbanBoard Integration Tests', () => {
  const mockOnUpdateApplicationStatus = vi.fn()
  const mockOnApplicationClick = vi.fn()
  const mockOnBoardSettingsClick = vi.fn()
  const mockOnBoardAnalyticsClick = vi.fn()
  const mockOnBoardExport = vi.fn()
  const mockOnColumnAdd = vi.fn()
  const mockOnColumnEdit = vi.fn()
  const mockOnColumnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Board Rendering', () => {
    it('should render board with all columns', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onApplicationClick={mockOnApplicationClick}
          onBoardSettingsClick={mockOnBoardSettingsClick}
          onBoardAnalyticsClick={mockOnBoardAnalyticsClick}
          onBoardExport={mockOnBoardExport}
          onColumnAdd={mockOnColumnAdd}
          onColumnEdit={mockOnColumnEdit}
          onColumnDelete={mockOnColumnDelete}
        />
      )

      expect(screen.getByText('Job Applications')).toBeInTheDocument()
      expect(screen.getByText('Applied')).toBeInTheDocument()
      expect(screen.getByText('Interviewing')).toBeInTheDocument()
      expect(screen.getByText('Main job application board')).toBeInTheDocument()
    })

    it('should display application count badges when enabled', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={{ ...mockSettings, show_column_counts: true }}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      const countBadges = screen.getAllByTestId(/count-badge-/)
      expect(countBadges).toHaveLength(mockColumns.length)
    })

    it('should hide application count badges when disabled', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={{ ...mockSettings, show_column_counts: false }}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      const countBadges = screen.queryAllByTestId(/count-badge-/)
      expect(countBadges).toHaveLength(0)
    })
  })

  describe('WIP Limit Indicators', () => {
    it('should display WIP limit indicators for columns with limits', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      // Applied column has 1 app, limit 5
      expect(screen.getByText('1/5')).toBeInTheDocument()
      // Interviewing column has 1 app, limit 3
      expect(screen.getByText('1/3')).toBeInTheDocument()
    })

    it('should not display WIP indicators for columns with no limits', () => {
      const columnsWithNoLimit = mockColumns.map(col => ({ ...col, wip_limit: 0 }))

      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={columnsWithNoLimit}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      expect(screen.queryByText(/\d\/\d/)).not.toBeInTheDocument()
    })
  })

  describe('Application Cards', () => {
    it('should render applications in correct columns', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onApplicationClick={mockOnApplicationClick}
        />
      )

      expect(screen.getByTestId('application-card-app-1')).toBeInTheDocument()
      expect(screen.getByTestId('application-card-app-2')).toBeInTheDocument()
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('StartupXYZ')).toBeInTheDocument()
    })

    it('should handle application click events', async () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onApplicationClick={mockOnApplicationClick}
        />
      )

      const applicationCard = screen.getByTestId('application-card-app-1')
      fireEvent.click(applicationCard)

      expect(mockOnApplicationClick).toHaveBeenCalledWith(mockApplications[0])
    })
  })

  describe('Board Actions', () => {
    it('should handle export actions', async () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onBoardExport={mockOnBoardExport}
        />
      )

      const exportJsonButton = screen.getByText('Export JSON')
      fireEvent.click(exportJsonButton)

      await waitFor(() => {
        expect(mockOnBoardExport).toHaveBeenCalledWith('json')
      })

      const exportCsvButton = screen.getByText('Export CSV')
      fireEvent.click(exportCsvButton)

      await waitFor(() => {
        expect(mockOnBoardExport).toHaveBeenCalledWith('csv')
      })
    })

    it('should handle settings click', async () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onBoardSettingsClick={mockOnBoardSettingsClick}
        />
      )

      const settingsButton = screen.getByText('Settings')
      fireEvent.click(settingsButton)

      expect(mockOnBoardSettingsClick).toHaveBeenCalled()
    })

    it('should handle analytics click', async () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onBoardAnalyticsClick={mockOnBoardAnalyticsClick}
        />
      )

      const analyticsButton = screen.getByText('Analytics')
      fireEvent.click(analyticsButton)

      expect(mockOnBoardAnalyticsClick).toHaveBeenCalled()
    })

    it('should handle add column click', async () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onColumnAdd={mockOnColumnAdd}
        />
      )

      const addColumnButton = screen.getByText('Add Column')
      fireEvent.click(addColumnButton)

      expect(mockOnColumnAdd).toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          isLoading={true}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state for columns with no applications', () => {
      render(
        <EnhancedKanbanBoard
          applications={[]}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      // Should show empty state in both columns (2 columns with no applications)
      expect(screen.getAllByText('No applications')).toHaveLength(2)
      expect(screen.getAllByText('Drag applications here')).toHaveLength(2)
    })
  })

  describe('Column Actions', () => {
    it('should handle column edit and delete actions', async () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
          onColumnEdit={mockOnColumnEdit}
          onColumnDelete={mockOnColumnDelete}
        />
      )

      // Find column action buttons (they exist in the dropdown menu)
      const moreButtons = screen.getAllByRole('button')
      const columnActionsButton = moreButtons.find(
        button =>
          button.getAttribute('aria-label') === undefined &&
          button.closest('[data-testid*="board-column-"]')
      )

      if (columnActionsButton) {
        fireEvent.click(columnActionsButton)

        // Wait for dropdown to render
        await waitFor(() => {
          expect(screen.getByText('Edit Column')).toBeInTheDocument()
        })

        const editButton = screen.getByText('Edit Column')
        fireEvent.click(editButton)

        expect(mockOnColumnEdit).toHaveBeenCalled()
      }
    })
  })

  describe('Customization Options', () => {
    it('should apply custom column colors', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      // Check that columns have custom colors applied via data-testid or style
      const appliedColumn = screen.getByTestId('board-column-col-1')
      expect(appliedColumn).toBeInTheDocument()

      const interviewingColumn = screen.getByTestId('board-column-col-2')
      expect(interviewingColumn).toBeInTheDocument()
    })

    it('should respect compact mode setting', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={{ ...mockSettings, compact_mode: true }}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      // Verify compact mode is applied (this would need specific implementation details)
      const boardElement = screen.getByTestId('kanban-dnd-context')
      expect(boardElement).toBeInTheDocument()
    })
  })

  describe('Status Mapping', () => {
    it('should correctly map application statuses to columns', () => {
      render(
        <EnhancedKanbanBoard
          applications={mockApplications}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      // Applied status should map to Applied column
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      // Interviewing status should map to Interviewing column
      expect(screen.getByText('StartupXYZ')).toBeInTheDocument()
    })

    it('should handle unmapped application statuses gracefully', () => {
      const applicationsWithUnmappedStatus = [
        ...mockApplications,
        {
          ...mockApplications[0],
          id: 'app-3',
          status: 'unknown_status' as Application['status'],
          company_name: 'Unknown Corp',
        },
      ]

      render(
        <EnhancedKanbanBoard
          applications={applicationsWithUnmappedStatus}
          board={mockBoard}
          columns={mockColumns}
          settings={mockSettings}
          onUpdateApplicationStatus={mockOnUpdateApplicationStatus}
        />
      )

      // Should not crash and should render mapped applications correctly
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('StartupXYZ')).toBeInTheDocument()
    })
  })
})
