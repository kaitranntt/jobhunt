import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PipelineTracker } from '../PipelineTracker'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Application } from '@/lib/types/database.types'

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// Create comprehensive mock data covering all pipeline stages
const createMockApplications = (): Application[] => [
  {
    id: '1',
    user_id: 'user-123',
    company_name: 'Google',
    job_title: 'Senior Software Engineer',
    job_url: 'https://google.com/jobs/1',
    location: 'Remote',
    salary_range: '$150k-$200k',
    status: 'wishlist',
    date_applied: '2025-01-15',
    notes: 'Dream company, great culture',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user-123',
    company_name: 'Microsoft',
    job_title: 'Frontend Developer',
    job_url: 'https://microsoft.com/jobs/1',
    location: 'Seattle, WA',
    salary_range: '$120k-$180k',
    status: 'applied',
    date_applied: '2025-01-20',
    notes: 'Good work-life balance',
    created_at: '2025-01-20T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'user-123',
    company_name: 'Apple',
    job_title: 'iOS Developer',
    job_url: 'https://apple.com/jobs/1',
    location: 'Cupertino, CA',
    salary_range: '$160k-$220k',
    status: 'phone_screen',
    date_applied: '2025-01-25',
    notes: 'Great products and benefits',
    created_at: '2025-01-25T00:00:00Z',
    updated_at: '2025-01-25T00:00:00Z',
  },
  {
    id: '4',
    user_id: 'user-123',
    company_name: 'Meta',
    job_title: 'React Developer',
    job_url: 'https://meta.com/jobs/1',
    location: 'Menlo Park, CA',
    salary_range: '$140k-$190k',
    status: 'interviewing',
    date_applied: '2025-01-30',
    notes: 'Interesting technical challenges',
    created_at: '2025-01-30T00:00:00Z',
    updated_at: '2025-01-30T00:00:00Z',
  },
  {
    id: '5',
    user_id: 'user-123',
    company_name: 'Amazon',
    job_title: 'Full Stack Engineer',
    job_url: 'https://amazon.com/jobs/1',
    location: 'Seattle, WA',
    salary_range: '$130k-$180k',
    status: 'offered',
    date_applied: '2025-02-01',
    notes: 'Strong offer received',
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2025-02-01T00:00:00Z',
  },
  {
    id: '6',
    user_id: 'user-123',
    company_name: 'StartupXYZ',
    job_title: 'Software Engineer',
    job_url: 'https://startupxyz.com/jobs/1',
    location: 'Remote',
    salary_range: '$100k-$150k',
    status: 'rejected',
    date_applied: '2025-01-10',
    notes: 'Not a good fit',
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-12T00:00:00Z',
  },
]

describe('PipelineTracker', () => {
  let mockApplications: Application[]

  beforeEach(() => {
    setupMatchMedia()
    mockApplications = createMockApplications()
  })

  describe('Basic Rendering', () => {
    it('should render pipeline tracker with title and description', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      expect(screen.getByRole('heading', { name: 'Application Pipeline' })).toBeInTheDocument()
      expect(
        screen.getByText('Track your job search progress through each stage')
      ).toBeInTheDocument()
    })

    it('should render all pipeline stages with correct labels', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      // Check that all stage labels are present
      expect(
        screen.getByRole('button', { name: /Bookmarked.*Jobs you're interested in/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Applied.*Applications submitted/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Phone Screen.*Initial conversations/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Interviewing.*Active interviews/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Offered.*Job offers received/ })
      ).toBeInTheDocument()
    })

    it('should display correct application counts for each stage', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      // Each stage should show the count - we need to be more specific to avoid ambiguity
      const bookmarkedButton = screen.getByRole('button', {
        name: /Bookmarked.*Jobs you're interested in/,
      })
      expect(bookmarkedButton).toHaveTextContent('1')

      const appliedButton = screen.getByRole('button', { name: /Applied.*Applications submitted/ })
      expect(appliedButton).toHaveTextContent('1')

      const phoneScreenButton = screen.getByRole('button', {
        name: /Phone Screen.*Initial conversations/,
      })
      expect(phoneScreenButton).toHaveTextContent('1')

      const interviewingButton = screen.getByRole('button', {
        name: /Interviewing.*Active interviews/,
      })
      expect(interviewingButton).toHaveTextContent('1')

      const offeredButton = screen.getByRole('button', { name: /Offered.*Job offers received/ })
      expect(offeredButton).toHaveTextContent('1')
    })

    it('should render summary statistics section', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      expect(screen.getByText('Active Applications')).toBeInTheDocument()
      expect(screen.getByText('Offers Received')).toBeInTheDocument()
      expect(screen.getByText('In Process')).toBeInTheDocument()
      expect(screen.getByText('Not Moving Forward')).toBeInTheDocument()
    })
  })

  describe('Stage Selection and Details', () => {
    it('should show stage details when clicking on a stage', async () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      const bookmarkedButton = screen.getByRole('button', {
        name: /Bookmarked.*Jobs you're interested in/,
      })
      fireEvent.click(bookmarkedButton)

      await waitFor(() => {
        expect(screen.getByText('Bookmarked Applications')).toBeInTheDocument()
      })

      expect(screen.getByText('1 application in this stage')).toBeInTheDocument()
    })

    it('should display applications in selected stage', async () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      const appliedButton = screen.getByRole('button', { name: /Applied.*Applications submitted/ })
      fireEvent.click(appliedButton)

      await waitFor(() => {
        expect(screen.getByText('Applied Applications')).toBeInTheDocument()
      })

      // Should show the application details
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Microsoft')).toBeInTheDocument()
      expect(screen.getByText('1/20/2025')).toBeInTheDocument()
    })

    it('should close stage details when clicking close button', async () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      const interviewingButton = screen.getByRole('button', {
        name: /Interviewing.*Active interviews/,
      })
      fireEvent.click(interviewingButton)

      await waitFor(() => {
        expect(screen.getByText('Interviewing Applications')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: '✕' })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Interviewing Applications')).not.toBeInTheDocument()
      })
    })

    it('should toggle stage selection when clicking the same stage twice', async () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      const offeredButton = screen.getByRole('button', { name: /Offered.*Job offers received/ })

      // First click - should show details
      fireEvent.click(offeredButton)
      await waitFor(() => {
        expect(screen.getByText('Offered Applications')).toBeInTheDocument()
      })

      // Second click - should hide details
      fireEvent.click(offeredButton)
      await waitFor(() => {
        expect(screen.queryByText('Offered Applications')).not.toBeInTheDocument()
      })
    })

    it('should show "View all" link when more than 5 applications in stage', async () => {
      // Create many applications for the same stage
      const manyApplications = Array(7)
        .fill(null)
        .map((_, index) => ({
          ...mockApplications[0],
          id: `app-${index}`,
          company_name: `Company ${index}`,
          job_title: `Software Engineer ${index}`,
        }))

      renderWithTheme(<PipelineTracker applications={manyApplications} />)

      const bookmarkedButton = screen.getByRole('button', {
        name: /Bookmarked.*Jobs you're interested in/,
      })
      fireEvent.click(bookmarkedButton)

      await waitFor(() => {
        expect(screen.getByText(/View all 7 applications/)).toBeInTheDocument()
      })
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate correct active applications count', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      // Active applications include: applied, phone_screen, interviewing
      // Should be 3 (1 each from applied, phone_screen, interviewing)
      const activeAppsContainer = screen.getByText('Active Applications').parentElement
      expect(activeAppsContainer).toHaveTextContent('3')
    })

    it('should calculate correct offers received count', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      // Should be 1 (one offered application)
      const offersContainer = screen.getByText('Offers Received').parentElement
      expect(offersContainer).toHaveTextContent('1')
    })

    it('should calculate correct in-process count', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      // In-process includes: phone_screen, interviewing
      // Should be 2 (1 each from phone_screen, interviewing)
      const inProcessContainer = screen.getByText('In Process').parentElement
      expect(inProcessContainer).toHaveTextContent('2')
    })

    it('should calculate correct not moving forward count', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      // Not moving forward includes: rejected, withdrawn, ghosted
      // Should be 1 (one rejected application)
      const notMovingContainer = screen.getByText('Not Moving Forward').parentElement
      expect(notMovingContainer).toHaveTextContent('1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty applications array', () => {
      renderWithTheme(<PipelineTracker applications={[]} />)

      expect(screen.getByRole('heading', { name: 'Application Pipeline' })).toBeInTheDocument()

      // All stages should show 0 count - check specific stage buttons
      expect(
        screen.getByRole('button', { name: /Bookmarked.*Jobs you're interested in/ })
      ).toHaveTextContent('0')
      expect(
        screen.getByRole('button', { name: /Applied.*Applications submitted/ })
      ).toHaveTextContent('0')
      expect(
        screen.getByRole('button', { name: /Phone Screen.*Initial conversations/ })
      ).toHaveTextContent('0')
      expect(
        screen.getByRole('button', { name: /Interviewing.*Active interviews/ })
      ).toHaveTextContent('0')
      expect(
        screen.getByRole('button', { name: /Offered.*Job offers received/ })
      ).toHaveTextContent('0')

      // Statistics should all be 0
      const activeAppsContainer = screen.getByText('Active Applications').parentElement
      expect(activeAppsContainer).toHaveTextContent('0')

      const offersContainer = screen.getByText('Offers Received').parentElement
      expect(offersContainer).toHaveTextContent('0')

      const inProcessContainer = screen.getByText('In Process').parentElement
      expect(inProcessContainer).toHaveTextContent('0')

      const notMovingContainer = screen.getByText('Not Moving Forward').parentElement
      expect(notMovingContainer).toHaveTextContent('0')
    })

    it('should handle applications with null optional fields', () => {
      const applicationsWithNulls: Application[] = [
        {
          id: '1',
          user_id: 'user-123',
          company_name: 'Test Company',
          job_title: 'Test Role',
          job_url: null,
          location: null,
          salary_range: null,
          status: 'wishlist',
          date_applied: '2025-01-15',
          notes: null,
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
        },
      ]

      renderWithTheme(<PipelineTracker applications={applicationsWithNulls} />)

      expect(screen.getByRole('heading', { name: 'Application Pipeline' })).toBeInTheDocument()
      const bookmarkedButton = screen.getByRole('button', {
        name: /Bookmarked.*Jobs you're interested in/,
      })
      expect(bookmarkedButton).toHaveTextContent('1')
    })

    it('should show no date when date_applied is null', async () => {
      const applicationWithoutDate: Application[] = [
        {
          id: '1',
          user_id: 'user-123',
          company_name: 'Test Company',
          job_title: 'Test Role',
          job_url: null,
          location: 'Remote',
          salary_range: '$100k',
          status: 'applied',
          date_applied: '',
          notes: 'Test notes',
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
        },
      ]

      renderWithTheme(<PipelineTracker applications={applicationWithoutDate} />)

      const appliedButton = screen.getByRole('button', { name: /Applied.*Applications submitted/ })
      fireEvent.click(appliedButton)

      await waitFor(() => {
        expect(screen.getByText('Applied Applications')).toBeInTheDocument()
      })

      // Should show the application but no date
      expect(screen.getByText('Test Role')).toBeInTheDocument()
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })
  })

  describe('Component Configuration', () => {
    it('should apply custom className when provided', () => {
      const { container } = renderWithTheme(
        <PipelineTracker applications={mockApplications} className="custom-test-class" />
      )

      expect(container.querySelector('.custom-test-class')).toBeInTheDocument()
    })

    it('should handle undefined className', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      expect(screen.getByRole('heading', { name: 'Application Pipeline' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles for stage selection', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      // All pipeline stages should be buttons
      expect(
        screen.getByRole('button', { name: /Bookmarked.*Jobs you're interested in/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Applied.*Applications submitted/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Phone Screen.*Initial conversations/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Interviewing.*Active interviews/ })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Offered.*Job offers received/ })
      ).toBeInTheDocument()
    })

    it('should have accessible close button', async () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      const bookmarkedButton = screen.getByRole('button', {
        name: /Bookmarked.*Jobs you're interested in/,
      })
      fireEvent.click(bookmarkedButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument()
      })
    })

    it('should have accessible heading', () => {
      renderWithTheme(<PipelineTracker applications={mockApplications} />)

      expect(screen.getByRole('heading', { name: 'Application Pipeline' })).toBeInTheDocument()
    })
  })
})
