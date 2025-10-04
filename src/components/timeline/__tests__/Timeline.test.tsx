import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import Timeline from '../Timeline'
import type { TimelineActivity } from '@/lib/types/timeline.types'

// Mock the timeline API
vi.mock('@/lib/api/timeline', () => ({
  getTimelineActivities: vi.fn(),
}))

import { getTimelineActivities } from '@/lib/api/timeline'

const mockActivities: TimelineActivity[] = [
  {
    id: 'app-1',
    type: 'application',
    action: 'created',
    title: 'Applied to TechCorp',
    description: 'New application created',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-04T10:00:00Z',
    metadata: {},
  },
  {
    id: 'contact-1',
    type: 'contact',
    action: 'created',
    title: 'New contact: John Doe',
    description: 'Added contact',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-03T14:00:00Z',
    metadata: {},
  },
  {
    id: 'doc-1',
    type: 'document',
    action: 'uploaded',
    title: 'Uploaded resume.pdf',
    description: 'Uploaded document',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-02T09:00:00Z',
    metadata: {},
  },
  {
    id: 'reminder-1',
    type: 'reminder',
    action: 'created',
    title: 'Follow up',
    description: 'Reminder created',
    application_name: 'TechCorp - Senior Software Engineer',
    created_at: '2025-10-01T08:00:00Z',
    metadata: {},
  },
]

describe('Timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Loading', () => {
    it('shows loading state initially', () => {
      vi.mocked(getTimelineActivities).mockImplementation(() => new Promise(() => {}))
      render(<Timeline userId="user-1" />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('displays activities after loading', async () => {
      vi.mocked(getTimelineActivities).mockResolvedValue(mockActivities)
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })
      expect(screen.getByText('New contact: John Doe')).toBeInTheDocument()
      expect(screen.getByText('Uploaded resume.pdf')).toBeInTheDocument()
      expect(screen.getByText('Follow up')).toBeInTheDocument()
    })

    it('displays error message when API fails', async () => {
      vi.mocked(getTimelineActivities).mockRejectedValue(new Error('API Error'))
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
      })
    })

    it('displays empty state when no activities exist', async () => {
      vi.mocked(getTimelineActivities).mockResolvedValue([])
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText(/no activities/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      vi.mocked(getTimelineActivities).mockResolvedValue(mockActivities)
    })

    it('shows all activity types by default', async () => {
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      expect(screen.getByText('New contact: John Doe')).toBeInTheDocument()
      expect(screen.getByText('Uploaded resume.pdf')).toBeInTheDocument()
      expect(screen.getByText('Follow up')).toBeInTheDocument()
    })

    it('filters activities by application type', async () => {
      const user = userEvent.setup()
      vi.mocked(getTimelineActivities).mockResolvedValue([mockActivities[0]])

      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      await user.click(filterButton)

      const applicationFilter = screen.getByRole('checkbox', { name: /application/i })
      await user.click(applicationFilter)

      await waitFor(() => {
        expect(getTimelineActivities).toHaveBeenCalledWith(
          'user-1',
          expect.objectContaining({ types: ['application'] }),
          'newest'
        )
      })
    })

    it('allows filtering by date range', async () => {
      const user = userEvent.setup()
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      await user.click(filterButton)

      const dateFromInput = screen.getByLabelText(/from/i)
      const dateToInput = screen.getByLabelText(/to/i)

      await user.type(dateFromInput, '2025-10-02')
      await user.type(dateToInput, '2025-10-04')

      await waitFor(() => {
        expect(getTimelineActivities).toHaveBeenCalledWith(
          'user-1',
          expect.objectContaining({
            dateFrom: expect.stringContaining('2025-10-02'),
            dateTo: expect.stringContaining('2025-10-04'),
          }),
          'newest'
        )
      })
    })
  })

  describe('Sorting', () => {
    beforeEach(() => {
      vi.mocked(getTimelineActivities).mockResolvedValue(mockActivities)
    })

    it('sorts by newest first by default', async () => {
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(getTimelineActivities).toHaveBeenCalledWith('user-1', {}, 'newest')
      })
    })

    it('can sort by oldest first', async () => {
      const user = userEvent.setup()
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      const sortButton = screen.getByRole('button', { name: /sort/i })
      await user.click(sortButton)

      const oldestOption = screen.getByRole('menuitem', { name: /oldest first/i })
      await user.click(oldestOption)

      await waitFor(() => {
        expect(getTimelineActivities).toHaveBeenCalledWith('user-1', {}, 'oldest')
      })
    })
  })

  describe('Date Grouping', () => {
    it('groups activities by date', async () => {
      const todayActivity: TimelineActivity = {
        ...mockActivities[0],
        created_at: new Date().toISOString(),
      }
      vi.mocked(getTimelineActivities).mockResolvedValue([todayActivity])

      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText(/today/i)).toBeInTheDocument()
      })
    })

    it('shows "Yesterday" group', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const yesterdayActivity: TimelineActivity = {
        ...mockActivities[0],
        created_at: yesterday.toISOString(),
      }
      vi.mocked(getTimelineActivities).mockResolvedValue([yesterdayActivity])

      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText(/yesterday/i)).toBeInTheDocument()
      })
    })

    it('shows "This Week" group', async () => {
      const thisWeek = new Date()
      thisWeek.setDate(thisWeek.getDate() - 3)

      const thisWeekActivity: TimelineActivity = {
        ...mockActivities[0],
        created_at: thisWeek.toISOString(),
      }
      vi.mocked(getTimelineActivities).mockResolvedValue([thisWeekActivity])

      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText(/this week/i)).toBeInTheDocument()
      })
    })

    it('shows "This Month" group', async () => {
      const thisMonth = new Date()
      thisMonth.setDate(thisMonth.getDate() - 10)

      const thisMonthActivity: TimelineActivity = {
        ...mockActivities[0],
        created_at: thisMonth.toISOString(),
      }
      vi.mocked(getTimelineActivities).mockResolvedValue([thisMonthActivity])

      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText(/this month/i)).toBeInTheDocument()
      })
    })

    it('shows "Older" group for past months', async () => {
      const older = new Date()
      older.setMonth(older.getMonth() - 2)

      const olderActivity: TimelineActivity = {
        ...mockActivities[0],
        created_at: older.toISOString(),
      }
      vi.mocked(getTimelineActivities).mockResolvedValue([olderActivity])

      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText(/older/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(getTimelineActivities).mockResolvedValue(mockActivities)
    })

    it('uses semantic HTML with unordered list', async () => {
      const { container } = render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      const list = container.querySelector('ul')
      expect(list).toBeInTheDocument()
    })

    it('provides accessible labels for filter controls', async () => {
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      const filterButton = screen.getByRole('button', { name: /filter/i })
      expect(filterButton).toBeInTheDocument()
    })

    it('provides accessible labels for sort controls', async () => {
      render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      const sortButton = screen.getByRole('button', { name: /sort/i })
      expect(sortButton).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(getTimelineActivities).mockResolvedValue(mockActivities)
    })

    it('renders timeline items in a stacked layout', async () => {
      const { container } = render(<Timeline userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      })

      const list = container.querySelector('ul')
      expect(list?.className).toContain('space-y')
    })
  })
})
