import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TimelineItem from '../TimelineItem'
import type { TimelineActivity } from '@/lib/types/timeline.types'

const mockApplicationActivity: TimelineActivity = {
  id: 'app-1',
  type: 'application',
  action: 'created',
  title: 'Applied to TechCorp',
  description: 'New application created for Senior Software Engineer position',
  application_name: 'TechCorp - Senior Software Engineer',
  created_at: '2025-10-04T10:00:00Z',
  metadata: {
    company_name: 'TechCorp',
    job_title: 'Senior Software Engineer',
    status: 'applied',
  },
}

const mockContactActivity: TimelineActivity = {
  id: 'contact-1',
  type: 'contact',
  action: 'created',
  title: 'New contact: John Doe',
  description: 'Added contact John Doe (Recruiter)',
  application_name: 'TechCorp - Senior Software Engineer',
  created_at: '2025-10-02T14:00:00Z',
  metadata: {
    contact_name: 'John Doe',
    role: 'Recruiter',
  },
}

const mockDocumentActivity: TimelineActivity = {
  id: 'doc-1',
  type: 'document',
  action: 'uploaded',
  title: 'Uploaded resume.pdf',
  description: 'Uploaded document resume.pdf',
  application_name: 'TechCorp - Senior Software Engineer',
  created_at: '2025-10-01T09:00:00Z',
  metadata: {
    file_name: 'resume.pdf',
    file_size: 102400,
  },
}

const mockReminderActivity: TimelineActivity = {
  id: 'reminder-1',
  type: 'reminder',
  action: 'created',
  title: 'Follow up with recruiter',
  description: 'Reminder created for 2025-10-10',
  application_name: 'TechCorp - Senior Software Engineer',
  created_at: '2025-10-05T08:00:00Z',
  metadata: {
    reminder_date: '2025-10-10T10:00:00Z',
    is_completed: false,
  },
}

describe('TimelineItem', () => {
  describe('Basic Rendering', () => {
    it('renders activity title', () => {
      render(<TimelineItem activity={mockApplicationActivity} />)
      expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
    })

    it('renders activity description', () => {
      render(<TimelineItem activity={mockApplicationActivity} />)
      expect(screen.getByText('New application created for Senior Software Engineer position')).toBeInTheDocument()
    })

    it('renders application name when present', () => {
      render(<TimelineItem activity={mockApplicationActivity} />)
      expect(screen.getByText('TechCorp - Senior Software Engineer')).toBeInTheDocument()
    })

    it('renders formatted time', () => {
      render(<TimelineItem activity={mockApplicationActivity} />)
      // Should format to relative time like "2 hours ago" or absolute time
      expect(screen.getByText(/Oct 4, 2025|10:00 AM/i)).toBeInTheDocument()
    })
  })

  describe('Activity Type Icons', () => {
    it('renders Briefcase icon for application activities', () => {
      const { container } = render(<TimelineItem activity={mockApplicationActivity} />)
      const icon = container.querySelector('[data-testid="activity-icon-application"]')
      expect(icon).toBeInTheDocument()
    })

    it('renders User icon for contact activities', () => {
      const { container } = render(<TimelineItem activity={mockContactActivity} />)
      const icon = container.querySelector('[data-testid="activity-icon-contact"]')
      expect(icon).toBeInTheDocument()
    })

    it('renders FileText icon for document activities', () => {
      const { container } = render(<TimelineItem activity={mockDocumentActivity} />)
      const icon = container.querySelector('[data-testid="activity-icon-document"]')
      expect(icon).toBeInTheDocument()
    })

    it('renders Bell icon for reminder activities', () => {
      const { container } = render(<TimelineItem activity={mockReminderActivity} />)
      const icon = container.querySelector('[data-testid="activity-icon-reminder"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Activity Type Styling', () => {
    it('applies glass-medium styling with blue icon for application activities', () => {
      const { container } = render(<TimelineItem activity={mockApplicationActivity} />)
      const iconWrapper = container.querySelector('[data-testid="activity-icon-application"]')?.parentElement
      expect(iconWrapper?.className).toMatch(/glass-medium/)
      const icon = container.querySelector('[data-testid="activity-icon-application"]')
      expect(icon).toHaveStyle({ color: 'var(--tint-blue)' })
    })

    it('applies glass-medium styling with green icon for contact activities', () => {
      const { container } = render(<TimelineItem activity={mockContactActivity} />)
      const iconWrapper = container.querySelector('[data-testid="activity-icon-contact"]')?.parentElement
      expect(iconWrapper?.className).toMatch(/glass-medium/)
      const icon = container.querySelector('[data-testid="activity-icon-contact"]')
      expect(icon).toHaveStyle({ color: 'var(--tint-green)' })
    })

    it('applies glass-medium styling with purple icon for document activities', () => {
      const { container } = render(<TimelineItem activity={mockDocumentActivity} />)
      const iconWrapper = container.querySelector('[data-testid="activity-icon-document"]')?.parentElement
      expect(iconWrapper?.className).toMatch(/glass-medium/)
      const icon = container.querySelector('[data-testid="activity-icon-document"]')
      expect(icon).toHaveStyle({ color: 'var(--tint-purple)' })
    })

    it('applies glass-medium styling with orange icon for reminder activities', () => {
      const { container } = render(<TimelineItem activity={mockReminderActivity} />)
      const iconWrapper = container.querySelector('[data-testid="activity-icon-reminder"]')?.parentElement
      expect(iconWrapper?.className).toMatch(/glass-medium/)
      const icon = container.querySelector('[data-testid="activity-icon-reminder"]')
      expect(icon).toHaveStyle({ color: 'var(--tint-orange)' })
    })
  })

  describe('Edge Cases', () => {
    it('handles activity without application name', () => {
      const activityWithoutApp: TimelineActivity = {
        ...mockApplicationActivity,
        application_name: undefined,
      }
      render(<TimelineItem activity={activityWithoutApp} />)
      expect(screen.getByText('Applied to TechCorp')).toBeInTheDocument()
      expect(screen.queryByText('TechCorp - Senior Software Engineer')).not.toBeInTheDocument()
    })

    it('handles long titles with text wrapping', () => {
      const longTitleActivity: TimelineActivity = {
        ...mockApplicationActivity,
        title: 'This is a very long title that should wrap properly and not break the layout',
      }
      render(<TimelineItem activity={longTitleActivity} />)
      expect(screen.getByText('This is a very long title that should wrap properly and not break the layout')).toBeInTheDocument()
    })

    it('handles long descriptions', () => {
      const longDescActivity: TimelineActivity = {
        ...mockApplicationActivity,
        description: 'This is a very long description that contains lots of details about the activity that should be displayed properly without breaking the component layout',
      }
      render(<TimelineItem activity={longDescActivity} />)
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML structure', () => {
      const { container } = render(<TimelineItem activity={mockApplicationActivity} />)
      const listItem = container.querySelector('li')
      expect(listItem).toBeInTheDocument()
    })

    it('provides accessible text for screen readers', () => {
      render(<TimelineItem activity={mockApplicationActivity} />)
      expect(screen.getByText('Applied to TechCorp')).toBeVisible()
      expect(screen.getByText('New application created for Senior Software Engineer position')).toBeVisible()
    })
  })
})
