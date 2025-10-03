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
    it('renders company name prominently', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      const companyName = screen.getByText('TechCorp Inc')
      expect(companyName).toBeInTheDocument()
      expect(companyName.tagName).toBe('H3')
    })

    it('renders job title', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    it('renders location when present', () => {
      const application = createMockApplication({ location: 'New York, NY' })
      render(<ApplicationCard application={application} />)

      expect(screen.getByText('New York, NY')).toBeInTheDocument()
    })

    it('does not render location section when location is null', () => {
      const application = createMockApplication({ location: null })
      const { container } = render(<ApplicationCard application={application} />)

      expect(screen.queryByText(/location/i)).not.toBeInTheDocument()
      // Verify MapPin icon is not rendered
      const mapPinIcon = container.querySelector('[data-testid="map-pin-icon"]')
      expect(mapPinIcon).not.toBeInTheDocument()
    })

    it('renders formatted date applied', () => {
      const application = createMockApplication({ date_applied: '2025-10-15' })
      render(<ApplicationCard application={application} />)

      // Should format date as "Oct 15, 2025"
      expect(screen.getByText(/Oct 15, 2025/i)).toBeInTheDocument()
    })

    it('renders all core information in compact layout', () => {
      const application = createMockApplication()
      render(<ApplicationCard application={application} />)

      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })
  })

  describe('Status Badge Rendering', () => {
    it('renders status badge with correct text for applied', () => {
      const application = createMockApplication({ status: 'applied' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('applied')
      expect(badge).toBeInTheDocument()
    })

    it('renders wishlist status with gray/zinc styling', () => {
      const application = createMockApplication({ status: 'wishlist' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('wishlist')
      expect(badge).toBeInTheDocument()
      // Badge should be rendered with proper class
      expect(badge.className).toContain('bg-zinc-100')
    })

    it('renders applied status with blue styling', () => {
      const application = createMockApplication({ status: 'applied' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('applied')
      expect(badge.className).toContain('bg-blue-100')
    })

    it('renders phone_screen status with yellow styling', () => {
      const application = createMockApplication({ status: 'phone_screen' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('phone_screen')
      expect(badge.className).toContain('bg-yellow-100')
    })

    it('renders assessment status with yellow styling', () => {
      const application = createMockApplication({ status: 'assessment' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('assessment')
      expect(badge.className).toContain('bg-yellow-100')
    })

    it('renders take_home status with yellow styling', () => {
      const application = createMockApplication({ status: 'take_home' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('take_home')
      expect(badge.className).toContain('bg-yellow-100')
    })

    it('renders interviewing status with purple styling', () => {
      const application = createMockApplication({ status: 'interviewing' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('interviewing')
      expect(badge.className).toContain('bg-purple-100')
    })

    it('renders final_round status with purple styling', () => {
      const application = createMockApplication({ status: 'final_round' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('final_round')
      expect(badge.className).toContain('bg-purple-100')
    })

    it('renders offered status with green styling', () => {
      const application = createMockApplication({ status: 'offered' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('offered')
      expect(badge.className).toContain('bg-green-100')
    })

    it('renders accepted status with green styling', () => {
      const application = createMockApplication({ status: 'accepted' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('accepted')
      expect(badge.className).toContain('bg-green-100')
    })

    it('renders rejected status with red styling', () => {
      const application = createMockApplication({ status: 'rejected' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('rejected')
      expect(badge.className).toContain('bg-red-100')
    })

    it('renders withdrawn status with red styling', () => {
      const application = createMockApplication({ status: 'withdrawn' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('withdrawn')
      expect(badge.className).toContain('bg-red-100')
    })

    it('renders ghosted status with red styling', () => {
      const application = createMockApplication({ status: 'ghosted' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('ghosted')
      expect(badge.className).toContain('bg-red-100')
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

      // GripVertical icon should be rendered as drag handle
      const gripIcon = container.querySelector('[data-testid="drag-handle"]')
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
        name: /techcorp inc.*senior software engineer/i,
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

    it('provides status information through accessible badge', () => {
      const application = createMockApplication({ status: 'interviewing' })
      render(<ApplicationCard application={application} />)

      const badge = screen.getByText('interviewing')
      expect(badge).toBeInTheDocument()
      // Badge component renders as a div, check it exists and is visible
      expect(badge).toBeVisible()
    })

    it('has hover effects for better interaction feedback', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      const card = container.querySelector('[role="article"]')
      expect(card?.className).toContain('hover:shadow-md')
    })
  })

  describe('Responsive Design', () => {
    it('applies mobile-friendly padding', () => {
      const application = createMockApplication()
      const { container } = render(<ApplicationCard application={application} />)

      const cardHeader = container.querySelector('.flex.flex-col.space-y-1\\.5')
      const cardContent = container.querySelector('.p-6.pt-0')
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
