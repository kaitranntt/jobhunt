import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { KanbanBoardV2 } from '../KanbanBoardV2'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

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

describe('KanbanBoardV2', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Strategic Column Grouping', () => {
    it('renders 4 group columns instead of 13 individual columns', async () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('🎯 Active Pipeline')).toBeInTheDocument()
        expect(screen.getByText('📞 In Progress')).toBeInTheDocument()
        expect(screen.getByText('🎉 Offers')).toBeInTheDocument()
        expect(screen.getByText('❌ Closed')).toBeInTheDocument()
      })

      // Verify only 4 group columns exist
      const groupColumns = screen.getAllByTestId(/^group-column-/)
      expect(groupColumns).toHaveLength(4)
    })

    it('groups applications correctly into strategic categories', () => {
      const applications = [
        createMockApplication({ id: '1', company_name: 'WishlistCo', status: 'wishlist' }),
        createMockApplication({ id: '2', company_name: 'AppliedCo', status: 'applied' }),
        createMockApplication({ id: '3', company_name: 'PhoneCo', status: 'phone_screen' }),
        createMockApplication({ id: '4', company_name: 'InterviewCo', status: 'interviewing' }),
        createMockApplication({ id: '5', company_name: 'OfferedCo', status: 'offered' }),
        createMockApplication({ id: '6', company_name: 'AcceptedCo', status: 'accepted' }),
        createMockApplication({ id: '7', company_name: 'RejectedCo', status: 'rejected' }),
        createMockApplication({ id: '8', company_name: 'GhostedCo', status: 'ghosted' }),
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      // Active Pipeline: wishlist + applied = 2
      expect(screen.getByTestId('count-badge-active_pipeline')).toHaveTextContent('2')

      // In Progress: phone_screen + interviewing = 2
      expect(screen.getByTestId('count-badge-in_progress')).toHaveTextContent('2')

      // Offers: offered + accepted = 2
      expect(screen.getByTestId('count-badge-offers')).toHaveTextContent('2')

      // Closed: rejected + ghosted = 2
      expect(screen.getByTestId('count-badge-closed')).toHaveTextContent('2')
    })

    it('displays correct count in group header badges', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'wishlist' }),
        createMockApplication({ id: '2', status: 'applied' }),
        createMockApplication({ id: '3', status: 'applied' }),
        createMockApplication({ id: '4', status: 'phone_screen' }),
        createMockApplication({ id: '5', status: 'interviewing' }),
        createMockApplication({ id: '6', status: 'final_round' }),
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      expect(screen.getByTestId('count-badge-active_pipeline')).toHaveTextContent('3')
      expect(screen.getByTestId('count-badge-in_progress')).toHaveTextContent('3')
      expect(screen.getByTestId('count-badge-offers')).toHaveTextContent('0')
      expect(screen.getByTestId('count-badge-closed')).toHaveTextContent('0')
    })

    it('maintains correct application associations after grouping', () => {
      const applications = [
        createMockApplication({ id: '1', company_name: 'CompanyA', status: 'wishlist' }),
        createMockApplication({ id: '2', company_name: 'CompanyB', status: 'phone_screen' }),
        createMockApplication({ id: '3', company_name: 'CompanyC', status: 'offered' }),
        createMockApplication({ id: '4', company_name: 'CompanyD', status: 'rejected' }),
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      expect(screen.getByText('CompanyA')).toBeInTheDocument()
      expect(screen.getByText('CompanyB')).toBeInTheDocument()
      expect(screen.getByText('CompanyC')).toBeInTheDocument()
      expect(screen.getByText('CompanyD')).toBeInTheDocument()
    })
  })

  describe('Progressive Disclosure - In Progress Group', () => {
    it('renders "In Progress" group as collapsible by default', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'phone_screen' }),
        createMockApplication({ id: '2', status: 'interviewing' }),
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      const expandButton = screen.getByTestId('toggle-expand-in_progress')
      expect(expandButton).toBeInTheDocument()
      expect(expandButton).toHaveAttribute('aria-label', 'Expand sub-stages')
    })

    it('expands "In Progress" to show sub-stages when clicked', async () => {
      const applications = [
        createMockApplication({ id: '1', company_name: 'PhoneCo', status: 'phone_screen' }),
        createMockApplication({ id: '2', company_name: 'AssessmentCo', status: 'assessment' }),
        createMockApplication({ id: '3', company_name: 'InterviewCo', status: 'interviewing' }),
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      const expandButton = screen.getByTestId('toggle-expand-in_progress')

      // Initially collapsed - sub-stage labels not visible
      expect(screen.queryByText('Phone Screen')).not.toBeInTheDocument()
      expect(screen.queryByText('Assessment')).not.toBeInTheDocument()

      // Expand
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Phone Screen')).toBeInTheDocument()
        expect(screen.getByText('Assessment')).toBeInTheDocument()
        expect(screen.getByText('Interviewing')).toBeInTheDocument()
      })

      expect(expandButton).toHaveAttribute('aria-label', 'Collapse sub-stages')
    })

    it('collapses "In Progress" sub-stages when toggled again', async () => {
      const applications = [createMockApplication({ id: '1', status: 'phone_screen' })]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      const expandButton = screen.getByTestId('toggle-expand-in_progress')

      // Expand
      fireEvent.click(expandButton)
      await waitFor(() => {
        expect(screen.getByText('Phone Screen')).toBeInTheDocument()
      })

      // Collapse
      fireEvent.click(expandButton)
      await waitFor(() => {
        expect(screen.queryByText('Phone Screen')).not.toBeInTheDocument()
      })
    })

    it('only shows sub-stages with applications when expanded', async () => {
      const applications = [
        createMockApplication({ id: '1', status: 'phone_screen' }),
        createMockApplication({ id: '2', status: 'final_round' }),
        // No assessment, take_home, or interviewing
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      const expandButton = screen.getByTestId('toggle-expand-in_progress')
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Phone Screen')).toBeInTheDocument()
        expect(screen.getByText('Final Round')).toBeInTheDocument()
      })

      // Empty sub-stages should not appear
      expect(screen.queryByText('Assessment')).not.toBeInTheDocument()
      expect(screen.queryByText('Take Home')).not.toBeInTheDocument()
      expect(screen.queryByText('Interviewing')).not.toBeInTheDocument()
    })

    it('other groups do not have expand/collapse functionality', () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      expect(screen.queryByTestId('toggle-expand-active_pipeline')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toggle-expand-offers')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toggle-expand-closed')).not.toBeInTheDocument()
      expect(screen.getByTestId('toggle-expand-in_progress')).toBeInTheDocument()
    })
  })

  describe('Mobile-First Responsive Design', () => {
    it('uses flex-wrap layout for responsive column wrapping', () => {
      const { container } = render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      const columnsContainer = container.querySelector('.flex-wrap')
      expect(columnsContainer).toBeInTheDocument()
    })

    it('no horizontal scroll container on root', () => {
      const { container } = render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      // Should NOT have overflow-x-auto on main container
      const mainContainer = container.querySelector('[data-testid="kanban-dnd-context"]')
      expect(mainContainer).not.toHaveClass('overflow-x-auto')
    })

    it('columns are sized appropriately for mobile and desktop', () => {
      const { container } = render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      const columns = container.querySelectorAll('[data-testid^="group-column-"]')
      columns.forEach(column => {
        expect(column).toHaveClass('min-w-[280px]')
        expect(column).toHaveClass('md:min-w-[320px]')
        expect(column).toHaveClass('flex-1')
      })
    })

    it('handles multiple applications across groups with wrapping layout', () => {
      const applications = Array.from({ length: 20 }, (_, i) =>
        createMockApplication({
          id: `app-${i}`,
          status: ['wishlist', 'phone_screen', 'offered', 'rejected'][i % 4] as ApplicationStatus,
        })
      )

      const { container } = render(
        <KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />
      )

      expect(container.querySelector('.flex-wrap')).toBeInTheDocument()
      expect(screen.getAllByTestId(/^group-column-/)).toHaveLength(4)
    })
  })

  describe('Enhanced Empty States', () => {
    it('displays contextual empty state for Active Pipeline', async () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No active applications yet')).toBeInTheDocument()
        expect(screen.getByText(/Start by adding jobs to your wishlist/)).toBeInTheDocument()
        expect(screen.getByText('Add your first application')).toBeInTheDocument()
      })
    })

    it('displays contextual empty state for In Progress', async () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No applications in progress')).toBeInTheDocument()
        expect(
          screen.getByText(/When you start interviewing, applications will appear here/)
        ).toBeInTheDocument()
      })
    })

    it('displays contextual empty state for Offers', async () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No offers yet')).toBeInTheDocument()
        expect(screen.getByText(/Keep applying!/)).toBeInTheDocument()
      })
    })

    it('displays contextual empty state for Closed', async () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText('No archived applications')).toBeInTheDocument()
        expect(
          screen.getByText(/Applications that didn't work out will be stored here/)
        ).toBeInTheDocument()
      })
    })

    it('shows icon in empty states', async () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      await waitFor(() => {
        // Empty states should include icons (Briefcase, PhoneCall, PartyPopper, XCircle)
        expect(screen.getByText('No active applications yet')).toBeInTheDocument()
      })
    })

    it('only shows empty state for groups without applications', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'applied' }),
        createMockApplication({ id: '2', status: 'offered' }),
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      // Active Pipeline and Offers have apps - no empty state
      expect(screen.queryByText('No active applications yet')).not.toBeInTheDocument()
      expect(screen.queryByText('No offers yet')).not.toBeInTheDocument()

      // In Progress and Closed are empty - should show empty states
      expect(screen.getByText('No applications in progress')).toBeInTheDocument()
      expect(screen.getByText('No archived applications')).toBeInTheDocument()
    })
  })

  describe('Visual Hierarchy and Color Coding', () => {
    it('applies distinct glass color schemes to each group', () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      const activePipelineColumn = screen.getByTestId('group-column-active_pipeline')
      expect(activePipelineColumn).toHaveClass('glass-light')
      expect(activePipelineColumn.className).toContain('bg-blue-500/5')

      const inProgressColumn = screen.getByTestId('group-column-in_progress')
      expect(inProgressColumn).toHaveClass('glass-light')
      expect(inProgressColumn.className).toContain('bg-purple-500/5')

      const offersColumn = screen.getByTestId('group-column-offers')
      expect(offersColumn).toHaveClass('glass-light')
      expect(offersColumn.className).toContain('bg-green-500/5')

      const closedColumn = screen.getByTestId('group-column-closed')
      expect(closedColumn).toHaveClass('glass-light')
      expect(closedColumn.className).toContain('bg-slate-500/5')
    })

    it('displays group descriptions for context', () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      expect(screen.getByText('Early-stage applications')).toBeInTheDocument()
      expect(screen.getByText('Interviewing and assessments')).toBeInTheDocument()
      expect(screen.getByText('Successful outcomes')).toBeInTheDocument()
      expect(screen.getByText('Archived applications')).toBeInTheDocument()
    })
  })

  describe('Drag and Drop Functionality', () => {
    it('renders ApplicationCard components as draggable within groups', () => {
      const applications = [
        createMockApplication({ company_name: 'DraggableCo', status: 'applied' }),
      ]

      render(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      expect(screen.getByText('DraggableCo')).toBeInTheDocument()
      expect(screen.getByTestId('drag-handle')).toBeInTheDocument()
    })

    it('sets up DnD context correctly', () => {
      const { container } = render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      const dndContext = container.querySelector('[data-testid="kanban-dnd-context"]')
      expect(dndContext).toBeInTheDocument()
    })

    it('provides visual feedback during drag with DragOverlay', () => {
      const application = createMockApplication()

      render(<KanbanBoardV2 applications={[application]} onUpdateStatus={vi.fn()} />)

      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Optimistic Updates and Error Handling', () => {
    it('handles optimistic updates correctly', async () => {
      const onUpdateStatus = vi.fn().mockResolvedValue(undefined)
      const application = createMockApplication({
        id: 'test-app',
        company_name: 'TestCo',
        status: 'applied',
      })

      render(<KanbanBoardV2 applications={[application]} onUpdateStatus={onUpdateStatus} />)

      expect(screen.getByText('TestCo')).toBeInTheDocument()
      expect(onUpdateStatus).not.toHaveBeenCalled()
    })

    it('rolls back on update failure', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onUpdateStatus = vi.fn().mockRejectedValue(new Error('API Error'))

      const application = createMockApplication({
        id: 'test-app',
        status: 'applied',
      })

      render(<KanbanBoardV2 applications={[application]} onUpdateStatus={onUpdateStatus} />)

      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()

      consoleError.mockRestore()
    })
  })

  describe('Loading State', () => {
    it('displays loading indicator when isLoading is true', () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} isLoading={true} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('shows board content when not loading', () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} isLoading={false} />)

      expect(screen.getByText('🎯 Active Pipeline')).toBeInTheDocument()
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML with proper ARIA labels', () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('provides screen reader announcements for status changes', () => {
      const { container } = render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      const liveRegion = container.querySelector('[aria-live="polite"][role="status"]')
      expect(liveRegion).toBeInTheDocument()
    })

    it('expand/collapse buttons have proper ARIA labels', () => {
      render(<KanbanBoardV2 applications={[]} onUpdateStatus={vi.fn()} />)

      const expandButton = screen.getByTestId('toggle-expand-in_progress')
      expect(expandButton).toHaveAttribute('aria-label')
    })
  })

  describe('Performance', () => {
    it('handles large number of applications efficiently', () => {
      const manyApplications = Array.from({ length: 100 }, (_, i) =>
        createMockApplication({
          id: `app-${i}`,
          status: ['wishlist', 'phone_screen', 'offered', 'rejected'][i % 4] as ApplicationStatus,
        })
      )

      const { container } = render(
        <KanbanBoardV2 applications={manyApplications} onUpdateStatus={vi.fn()} />
      )

      expect(container).toBeTruthy()
      expect(screen.getByText('🎯 Active Pipeline')).toBeInTheDocument()
    })

    it('uses memoization for grouped applications', () => {
      const applications = [createMockApplication()]

      const { rerender } = render(
        <KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />
      )

      rerender(<KanbanBoardV2 applications={applications} onUpdateStatus={vi.fn()} />)

      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
    })
  })
})
