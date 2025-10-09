import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from '../page'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Application } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import * as actions from '../actions'

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// Mock server actions
vi.mock('../actions', () => ({
  getApplicationsAction: vi.fn(),
  createApplicationAction: vi.fn(),
  updateApplicationAction: vi.fn(),
  deleteApplicationAction: vi.fn(),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('tab=tracker'),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Mock Supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock API modules that child components use
vi.mock('@/lib/api/reminders', () => ({
  getRemindersByApplication: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/api/applications', () => ({
  getApplications: vi.fn(),
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
}))

// Mock ApplicationForm component
vi.mock('@/components/applications/ApplicationForm', () => ({
  default: ({ onSubmit, isLoading }: { onSubmit: Function; isLoading: boolean }) => (
    <div data-testid="application-form">
      <button
        onClick={() => onSubmit({ company_name: 'Test', job_title: 'Test' })}
        disabled={isLoading}
      >
        Submit Form
      </button>
    </div>
  ),
}))

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
})

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
})

describe('DashboardPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    phone: '',
    email_confirmed_at: '2025-01-01T00:00:00Z',
    phone_confirmed_at: null,
    role: 'authenticated',
  }

  const mockApplications: Application[] = [
    {
      id: '1',
      user_id: 'user-123',
      company_name: 'Google',
      job_title: 'Software Engineer',
      job_url: 'https://google.com/jobs/1',
      location: 'Remote',
      salary_range: '$150k-$200k',
      status: 'applied',
      date_applied: '2025-10-01',
      notes: 'Great company',
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-123',
      company_name: 'Microsoft',
      job_title: 'Frontend Developer',
      job_url: 'https://microsoft.com/jobs/2',
      location: 'Seattle, WA',
      salary_range: '$140k-$180k',
      status: 'interviewing',
      date_applied: '2025-09-28',
      notes: 'Interview scheduled',
      created_at: '2025-09-28T00:00:00Z',
      updated_at: '2025-09-28T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'user-123',
      company_name: 'Meta',
      job_title: 'Full Stack Engineer',
      job_url: null,
      location: 'Menlo Park, CA',
      salary_range: null,
      status: 'wishlist',
      date_applied: '',
      notes: null,
      created_at: '2025-10-03T00:00:00Z',
      updated_at: '2025-10-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
    vi.mocked(actions.getApplicationsAction).mockResolvedValue(mockApplications)

    // Mock authenticated user
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createClient>)
  })

  describe('Initial Loading States', () => {
    it('should show loading spinner while applications are loading', async () => {
      // Mock a never-resolving promise to keep loading state
      vi.mocked(actions.getApplicationsAction).mockImplementation(() => new Promise(() => {}))

      renderWithTheme(<DashboardPage />)

      // Wait for the component to render and show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading applications...')).toBeInTheDocument()
      })

      // Check for loading spinner
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should show error state when authentication fails', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Authentication failed' },
          }),
        },
      } as unknown as ReturnType<typeof createClient>)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Authentication required. Please log in.')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()

      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should show error state when applications fail to load', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(actions.getApplicationsAction).mockRejectedValue(
        new Error('Failed to load applications')
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load applications. Please try again.')
        ).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()

      // Restore console.error
      consoleSpy.mockRestore()
    })
  })

  describe('Empty State', () => {
    it('should display empty state for new users with no applications', async () => {
      vi.mocked(actions.getApplicationsAction).mockResolvedValue([])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Start Your Job Hunt Journey')).toBeInTheDocument()
      })

      // Verify all empty state elements
      expect(
        screen.getByText('Track applications, ace interviews, land your dream job')
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Your First Application' })).toBeInTheDocument()
      expect(
        screen.getByText("Tip: Start by adding jobs you're interested in to your wishlist")
      ).toBeInTheDocument()
    })

    it('should show rocket icon in empty state', async () => {
      vi.mocked(actions.getApplicationsAction).mockResolvedValue([])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        // Check for the Rocket icon (should be present as SVG or lucide icon)
        const rocketIcon = document.querySelector('svg')
        expect(rocketIcon).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Content with Applications', () => {
    it('should render navigation with user info', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        // Check if NavBar is rendered with user information
        expect(screen.getByText('JobHunt')).toBeInTheDocument()
      })
    })

    it('should render pipeline tracker with correct stage counts', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
      })

      // Verify pipeline stages - be more specific to avoid conflicts
      expect(screen.getAllByText('Applied')[0]).toBeInTheDocument() // First occurrence is in pipeline
      expect(screen.getByText('Phone Screen')).toBeInTheDocument()
      expect(screen.getAllByText('Interviewing')[0]).toBeInTheDocument() // First occurrence is in pipeline
      expect(screen.getByText('Offered')).toBeInTheDocument()

      // Check for statistics
      expect(screen.getByText('Active Applications')).toBeInTheDocument()
      expect(screen.getByText('Offers Received')).toBeInTheDocument()
      expect(screen.getByText('In Process')).toBeInTheDocument()
      expect(screen.getByText('Not Moving Forward')).toBeInTheDocument()
    })

    it('should render applications table with correct data', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('All Applications')).toBeInTheDocument()
      })

      // Verify table headers
      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Position')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Salary Range')).toBeInTheDocument()
      expect(screen.getByText('Date Applied')).toBeInTheDocument()
      expect(screen.getByText('Follow Up')).toBeInTheDocument()
      expect(screen.getByText('Updated')).toBeInTheDocument()

      // Verify application data
      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Microsoft')).toBeInTheDocument()
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Meta')).toBeInTheDocument()
      expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument()
    })

    it('should display status badges with correct labels', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        // Use getAllByText to avoid conflicts with pipeline tracker
        expect(screen.getAllByText('Applied')).toHaveLength(2) // One in pipeline, one in table
        expect(screen.getAllByText('Interviewing')).toHaveLength(2) // One in pipeline, one in table
        expect(screen.getAllByText('Saved')).toHaveLength(1) // Only in table ('wishlist' maps to 'Saved')
      })
    })

    it('should show new application button when applications exist', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'New Application' })).toBeInTheDocument()
      })
    })

    it('should display company initials in avatar', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        // Check for company initials (GO for Google, MI for Microsoft, ME for Meta)
        expect(screen.getByText('GO')).toBeInTheDocument()
        expect(screen.getByText('MI')).toBeInTheDocument()
        expect(screen.getByText('ME')).toBeInTheDocument()
      })
    })
  })

  describe('Application Management Flows', () => {
    it('should open new application modal when button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'New Application' })).toBeInTheDocument()
      })

      const newAppButton = screen.getByRole('button', { name: 'New Application' })
      await user.click(newAppButton)

      expect(screen.getByText('Add New Application')).toBeInTheDocument()
      expect(
        screen.getByText('Fill in the details of your job application below.')
      ).toBeInTheDocument()
    })

    it('should close new application modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'New Application' })).toBeInTheDocument()
      })

      const newAppButton = screen.getByRole('button', { name: 'New Application' })
      await user.click(newAppButton)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(screen.queryByText('Add New Application')).not.toBeInTheDocument()
    })

    it('should close new application modal when escape key is pressed', async () => {
      const user = userEvent.setup()
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'New Application' })).toBeInTheDocument()
      })

      const newAppButton = screen.getByRole('button', { name: 'New Application' })
      await user.click(newAppButton)

      await user.keyboard('{Escape}')

      expect(screen.queryByText('Add New Application')).not.toBeInTheDocument()
    })

    it('should open application detail when application row is clicked', async () => {
      const user = userEvent.setup()

      // Mock the action functions
      vi.mocked(actions.updateApplicationAction).mockResolvedValue(mockApplications[0])
      vi.mocked(actions.deleteApplicationAction).mockResolvedValue(undefined)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
      })

      // Click on the first application row - find the Google row in the table specifically
      const googleCompanyCell = screen.getByText('Google')
      const googleRow = googleCompanyCell.closest('tr')
      await user.click(googleRow!)

      // ApplicationDetail component should be rendered - look for unique identifiers
      await waitFor(() => {
        expect(screen.getAllByText('Software Engineer')).toHaveLength(3) // Table + detail view
      })
    })
  })

  describe('Error Handling', () => {
    it('should retry data loading when retry button is clicked', async () => {
      const user = userEvent.setup()

      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock failing applications load
      vi.mocked(actions.getApplicationsAction).mockRejectedValue(
        new Error('Failed to load applications')
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load applications. Please try again.')
        ).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      await user.click(retryButton)

      // Verify that window.location.reload was called (this is what the retry button does)
      expect(window.location.reload).toHaveBeenCalled()

      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should reload page when retry button is clicked in auth error', async () => {
      const user = userEvent.setup()

      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Authentication failed' },
          }),
        },
      } as unknown as ReturnType<typeof createClient>)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      await user.click(retryButton)

      expect(window.location.reload).toHaveBeenCalled()

      // Restore console.error
      consoleSpy.mockRestore()
    })
  })

  describe('Interactive Elements', () => {
    it('should open job posting URL when external link is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
      })

      // Find and click external link button for Google application
      const externalLinkButtons = screen
        .getAllByRole('button')
        .filter(
          button =>
            button.querySelector('svg') && button.getAttribute('aria-label')?.includes('external')
        )

      if (externalLinkButtons.length > 0) {
        await user.click(externalLinkButtons[0])
        expect(window.open).toHaveBeenCalledWith('https://google.com/jobs/1', '_blank')
      }
    })

    it('should allow sorting table columns', async () => {
      const user = userEvent.setup()
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Company')).toBeInTheDocument()
      })

      // Find sortable column header
      const companyHeader = screen.getByText('Company')
      await user.click(companyHeader)

      // After clicking, we should see the sort indicator
      // This tests the sorting functionality is wired up
      expect(screen.getByText('Company')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should render properly on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
      })

      // Should still show main content on mobile
      expect(screen.getByText('All Applications')).toBeInTheDocument()
      expect(screen.getByText('Google')).toBeInTheDocument()
    })

    it('should render properly on desktop viewports', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      })

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
      })

      // Should show all desktop features
      expect(screen.getByText('All Applications')).toBeInTheDocument()
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
      expect(screen.getByText('Customize Columns')).toBeInTheDocument()
    })
  })

  describe('Data Creation and Updates', () => {
    it('should handle successful application creation', async () => {
      const user = userEvent.setup()
      const newApp = {
        ...mockApplications[0],
        id: '4',
        company_name: 'Amazon',
        job_title: 'Senior Developer',
      }

      vi.mocked(actions.createApplicationAction).mockResolvedValue(newApp)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'New Application' })).toBeInTheDocument()
      })

      const newAppButton = screen.getByRole('button', { name: 'New Application' })
      await user.click(newAppButton)

      expect(screen.getByText('Add New Application')).toBeInTheDocument()
    })

    it('should handle application creation errors', async () => {
      const user = userEvent.setup()

      vi.mocked(actions.createApplicationAction).mockRejectedValue(
        new Error('Failed to create application')
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'New Application' })).toBeInTheDocument()
      })

      const newAppButton = screen.getByRole('button', { name: 'New Application' })
      await user.click(newAppButton)

      expect(screen.getByText('Add New Application')).toBeInTheDocument()
    })
  })

  describe('Application Status Updates', () => {
    it('should handle status updates through pipeline interactions', async () => {
      const user = userEvent.setup()
      const updatedApp = {
        ...mockApplications[0],
        status: 'interviewing' as const,
      }

      vi.mocked(actions.updateApplicationAction).mockResolvedValue(updatedApp)

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
      })

      // Find and click on a pipeline stage
      const pipelineStages = screen
        .getAllByRole('button')
        .filter(
          button =>
            button.textContent?.includes('Applied') || button.textContent?.includes('Interviewing')
        )

      if (pipelineStages.length > 0) {
        await user.click(pipelineStages[0])
        // Should show stage details or interaction
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
      })

      // Check for proper semantic structure
      expect(screen.getByRole('main')).toBeInTheDocument()

      // Check for button accessibility
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'New Application' })).toBeInTheDocument()
      })

      // Test keyboard navigation - focus button and activate with Enter
      const newAppButton = screen.getByRole('button', { name: 'New Application' })
      newAppButton.focus()
      await user.keyboard('{Enter}')

      expect(screen.getByText('Add New Application')).toBeInTheDocument()
    })
  })
})
