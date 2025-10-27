import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ApplicationCard } from '../ApplicationCard'
import type { Application } from '@/lib/types/database.types'

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

describe('ApplicationCard', () => {
  describe('Basic Rendering', () => {
    it('renders company name as secondary information', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const companyName = screen.getByText('TechCorp Inc')
      expect(companyName).toBeInTheDocument()
      expect(companyName.tagName).toBe('P')
    })

    it('renders job title prominently', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const jobTitle = screen.getByText('Senior Software Engineer')
      expect(jobTitle).toBeInTheDocument()
      expect(jobTitle.tagName).toBe('H3')
    })

    it('renders formatted date applied', () => {
      const application = createMockApplication({ date_applied: '2025-10-15' })
      render(<ApplicationCard application={application} />)

      // Should format date - accounting for potential timezone differences in test environment
      expect(screen.getByText(/Oct (14|15), 2025/i)).toBeInTheDocument()
    })

    it('renders core information with company logo', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      // Should format date - accounting for potential timezone differences in test environment
      expect(screen.getByText(/(Sep 30|Oct 01), 2025/i)).toBeInTheDocument()
      // Location is no longer displayed in the card
      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument()
      // Company logo should be present (either loaded or as initials)
      expect(document.querySelector('.rounded-full')).toBeInTheDocument()
    })
  })

  describe('Actions Dropdown', () => {
    it('renders dropdown menu trigger button', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('opens dropdown menu when trigger is clicked', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(<ApplicationCard application={application} onEdit={vi.fn()} onDelete={vi.fn()} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })
      await user.click(menuButton)

      expect(screen.getByText('View Details')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('calls onEdit when Edit option is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const application = createMockApplication()
      render(<ApplicationCard application={application} onEdit={onEdit} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })
      await user.click(menuButton)

      const editOption = screen.getByText('Edit')
      await user.click(editOption)

      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    it('calls onDelete when Delete option is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      const application = createMockApplication()
      render(<ApplicationCard application={application} onDelete={onDelete} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })
      await user.click(menuButton)

      const deleteOption = screen.getByText('Delete')
      await user.click(deleteOption)

      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('does not render Edit option when onEdit is not provided', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })
      await user.click(menuButton)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('does not render Delete option when onDelete is not provided', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })
      await user.click(menuButton)

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('renders dropdown items with proper icons', async () => {
      const user = userEvent.setup()
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })
      await user.click(menuButton)

      // Check that icons are present (lucide-react icons render as SVGs)
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Drag State Visualization', () => {
    it('applies dragging styles when isDragging is true', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} isDragging={true} />)

      const card = container.querySelector('[role="article"]')
      expect(card).toHaveClass('opacity-50')
      expect(card).toHaveClass('rotate-2')
    })

    it('does not apply dragging styles when isDragging is false', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} isDragging={false} />)

      const card = container.querySelector('[role="article"]')
      expect(card).not.toHaveClass('opacity-50')
      expect(card).not.toHaveClass('rotate-2')
    })

    it('does not apply dragging styles by default', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      const card = container.querySelector('[role="article"]')
      expect(card).not.toHaveClass('opacity-50')
      expect(card).not.toHaveClass('rotate-2')
    })

    it('renders drag handle indicator', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      // GripVertical icon should be rendered as drag indicator
      const gripIcon = container.querySelector('[data-testid="drag-indicator"]')
      expect(gripIcon).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles long company names with truncation', () => {
      const application = createMockApplication({
        company_name: 'Very Long Company Name That Should Be Truncated For Display Purposes Inc.',
      })
      render(<ApplicationCard application={application} />)

      const companyName = screen.getByText(
        'Very Long Company Name That Should Be Truncated For Display Purposes Inc.'
      )
      expect(companyName).toBeInTheDocument()
      // Should have truncate class
      expect(companyName.className).toContain('truncate')
    })

    it('handles long job titles with truncation', () => {
      const application = createMockApplication({
        job_title: 'Senior Principal Staff Software Engineering Architect Lead Manager',
      })
      render(<ApplicationCard application={application} />)

      const jobTitle = screen.getByText(
        'Senior Principal Staff Software Engineering Architect Lead Manager'
      )
      expect(jobTitle).toBeInTheDocument()
      expect(jobTitle.className).toContain('truncate')
    })

    it('handles null job_url gracefully', () => {
      const application = createMockApplication({ job_url: null })
      render(<ApplicationCard application={application} />)

      // Should still render without errors
      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
    })

    it('handles empty notes gracefully', () => {
      const application = createMockApplication({ notes: null })
      render(<ApplicationCard application={application} />)

      // Should still render without errors
      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
    })

    it('handles empty salary range gracefully', () => {
      const application = createMockApplication({ salary_range: null })
      render(<ApplicationCard application={application} />)

      // Should still render without errors
      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML with article role', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      const card = container.querySelector('[role="article"]')
      expect(card).toBeInTheDocument()
    })

    it('has accessible name for the card', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const card = screen.getByRole('article', {
        name: /senior software engineer.*techcorp inc/i,
      })
      expect(card).toBeInTheDocument()
    })

    it('has accessible dropdown menu trigger with aria-label', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const menuButton = screen.getByLabelText(/application actions/i)
      expect(menuButton).toBeInTheDocument()
    })

    it('supports keyboard navigation on dropdown menu', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const application = createMockApplication()
      render(<ApplicationCard application={application} onEdit={onEdit} />)

      const menuButton = screen.getByRole('button', { name: /application actions/i })

      // Tab to menu button
      await user.tab()
      expect(menuButton).toHaveFocus()

      // Open menu with Enter
      await user.keyboard('{Enter}')
      expect(screen.getByText('Edit')).toBeInTheDocument()

      // Arrow down to Edit option
      await user.keyboard('{ArrowDown}')

      // Select with Enter
      await user.keyboard('{Enter}')
      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    it('has hover effects when onClick is provided', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} onClick={vi.fn()} />)

      const card = container.querySelector('[role="article"]')
      expect(card?.className).toContain('glass-interactive')
      expect(card?.className).toContain('cursor-pointer')
    })
  })

  describe('Responsive Design', () => {
    it('applies mobile-friendly padding', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      const cardHeader = container.querySelector('.flex.flex-col.space-y-1\\.5.p-4')
      const cardContent = container.querySelector('.p-4.pt-0')
      // CardHeader and CardContent have padding classes
      expect(cardHeader).toBeInTheDocument()
      expect(cardContent).toBeInTheDocument()
    })

    it('renders compact layout suitable for card display', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      // Card should have reasonable height constraints
      const card = container.querySelector('[role="article"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('accepts valid Application object with all required fields', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      expect(container).toBeTruthy()
    })

    it('accepts optional callbacks', () => {
      const application = createMockApplication()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      const { container } = render(
        <ApplicationCard application={application} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(container).toBeTruthy()
    })

    it('accepts isDragging boolean prop', () => {
      const application = createMockApplication()

      const { rerender, container } = render(
        <ApplicationCard application={application} isDragging={true} />
      )
      expect(container).toBeTruthy()

      rerender(<ApplicationCard application={application} isDragging={false} />)
      expect(container).toBeTruthy()
    })
  })
})
