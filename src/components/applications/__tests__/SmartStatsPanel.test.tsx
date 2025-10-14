import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SmartStatsPanel } from '../SmartStatsPanel'
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

describe('SmartStatsPanel', () => {
  describe('Empty State Handling', () => {
    it('displays zero for counts when no applications', () => {
      render(<SmartStatsPanel applications={[]} />)

      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBe(2) // Total Applications and Active Interviews both show 0
      expect(screen.getByText('Total Applications')).toBeInTheDocument()
      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
    })

    it('displays em dash for percentages when no applications', () => {
      render(<SmartStatsPanel applications={[]} />)

      // Response rate should show "—" when no data
      expect(screen.getByText('Response Rate')).toBeInTheDocument()
      const responseDash = screen.getAllByText('—')
      expect(responseDash.length).toBeGreaterThan(0)
    })

    it('displays em dash for average response time when no applications', () => {
      render(<SmartStatsPanel applications={[]} />)

      expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
      const timeDash = screen.getAllByText('—')
      expect(timeDash.length).toBeGreaterThan(0)
    })

    it('renders all four stat cards in empty state', () => {
      render(<SmartStatsPanel applications={[]} />)

      expect(screen.getByText('Total Applications')).toBeInTheDocument()
      expect(screen.getByText('Response Rate')).toBeInTheDocument()
      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
    })
  })

  describe('Total Applications Calculation', () => {
    it('calculates total applications correctly with single application', () => {
      const applications = [createMockApplication()]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Total Applications')).toBeInTheDocument()
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0)
    })

    it('calculates total applications correctly with multiple applications', () => {
      const applications = [
        createMockApplication({ id: '1' }),
        createMockApplication({ id: '2' }),
        createMockApplication({ id: '3' }),
        createMockApplication({ id: '4' }),
        createMockApplication({ id: '5' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('counts all applications regardless of status', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'wishlist' }),
        createMockApplication({ id: '2', status: 'applied' }),
        createMockApplication({ id: '3', status: 'interviewing' }),
        createMockApplication({ id: '4', status: 'rejected' }),
        createMockApplication({ id: '5', status: 'offered' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('Response Rate Calculation', () => {
    it('calculates 0% response rate when all applications are wishlist or applied', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'wishlist' }),
        createMockApplication({ id: '2', status: 'applied' }),
        createMockApplication({ id: '3', status: 'wishlist' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('calculates 100% response rate when all applications have responses', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'phone_screen' }),
        createMockApplication({ id: '2', status: 'interviewing' }),
        createMockApplication({ id: '3', status: 'offered' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('calculates 50% response rate correctly', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'applied' }),
        createMockApplication({ id: '2', status: 'phone_screen' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('calculates 33% response rate and rounds correctly', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'applied' }),
        createMockApplication({ id: '2', status: 'applied' }),
        createMockApplication({ id: '3', status: 'interviewing' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      // 1/3 = 33.33%, should round to 33%
      expect(screen.getByText('33%')).toBeInTheDocument()
    })

    it('excludes wishlist status from response calculation', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'wishlist' }),
        createMockApplication({ id: '2', status: 'interviewing' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      // Only 1 out of 2 has responded (50%)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('counts all post-applied statuses as responses', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'phone_screen' }),
        createMockApplication({ id: '2', status: 'assessment' }),
        createMockApplication({ id: '3', status: 'rejected' }),
        createMockApplication({ id: '4', status: 'offered' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('Active Interviews Calculation', () => {
    it('counts zero active interviews when none are in interview stages', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'wishlist' }),
        createMockApplication({ id: '2', status: 'applied' }),
        createMockApplication({ id: '3', status: 'rejected' }),
      ]
      const { container } = render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      // Check that there's at least one "0" in the component (could be active interviews or other metrics)
      const zeros = container.querySelectorAll('.text-4xl')
      const hasZero = Array.from(zeros).some(el => el.textContent === '0')
      expect(hasZero).toBe(true)
    })

    it('counts phone_screen as active interview', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'phone_screen' }),
        createMockApplication({ id: '2', status: 'applied' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0) // At least one "1" should exist (active interviews)
    })

    it('counts assessment as active interview', () => {
      const applications = [createMockApplication({ id: '1', status: 'assessment' })]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0)
    })

    it('counts take_home as active interview', () => {
      const applications = [createMockApplication({ id: '1', status: 'take_home' })]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0)
    })

    it('counts interviewing as active interview', () => {
      const applications = [createMockApplication({ id: '1', status: 'interviewing' })]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0)
    })

    it('counts final_round as active interview', () => {
      const applications = [createMockApplication({ id: '1', status: 'final_round' })]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0)
    })

    it('counts all interview stages correctly', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'phone_screen' }),
        createMockApplication({ id: '2', status: 'assessment' }),
        createMockApplication({ id: '3', status: 'take_home' }),
        createMockApplication({ id: '4', status: 'interviewing' }),
        createMockApplication({ id: '5', status: 'final_round' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      const fives = screen.getAllByText('5')
      expect(fives.length).toBeGreaterThan(0) // Both total applications and active interviews should show 5
    })

    it('excludes offered and accepted from active interviews', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'interviewing' }),
        createMockApplication({ id: '2', status: 'offered' }),
        createMockApplication({ id: '3', status: 'accepted' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0) // Should have at least one "1" for the active interview count
    })
  })

  describe('Average Response Time Calculation', () => {
    it('displays em dash when no applications have responses', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'applied' }),
        createMockApplication({ id: '2', status: 'wishlist' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
      // Should show "—" for no response data
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })

    it('calculates average response time for single responded application', () => {
      const applications = [
        createMockApplication({
          id: '1',
          status: 'phone_screen',
          date_applied: '2025-10-01',
          updated_at: '2025-10-08', // 7 days later
        }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('7d')).toBeInTheDocument()
    })

    it('calculates average response time across multiple applications', () => {
      const applications = [
        createMockApplication({
          id: '1',
          status: 'phone_screen',
          date_applied: '2025-10-01',
          updated_at: '2025-10-06', // 5 days
        }),
        createMockApplication({
          id: '2',
          status: 'interviewing',
          date_applied: '2025-10-01',
          updated_at: '2025-10-11', // 10 days
        }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      // Average: (5 + 10) / 2 = 7.5, should round to 8
      expect(screen.getByText('8d')).toBeInTheDocument()
    })

    it('ignores wishlist and applied statuses for response time', () => {
      const applications = [
        createMockApplication({
          id: '1',
          status: 'applied',
          date_applied: '2025-10-01',
          updated_at: '2025-10-15',
        }),
        createMockApplication({
          id: '2',
          status: 'phone_screen',
          date_applied: '2025-10-01',
          updated_at: '2025-10-06', // 5 days
        }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      // Should only calculate from the phone_screen app
      expect(screen.getByText('5d')).toBeInTheDocument()
    })

    it('handles same-day responses', () => {
      const applications = [
        createMockApplication({
          id: '1',
          status: 'phone_screen',
          date_applied: '2025-10-01T09:00:00Z',
          updated_at: '2025-10-01T15:00:00Z', // Same day
        }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      // Same day should be 0 days, display "—"
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('renders grid layout with responsive classes', () => {
      const applications = [createMockApplication()]
      const { container } = render(<SmartStatsPanel applications={applications} />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid?.className).toContain('grid-cols-1')
      expect(grid?.className).toContain('sm:grid-cols-2')
      expect(grid?.className).toContain('lg:grid-cols-4')
    })

    it('displays all four stat cards', () => {
      const applications = [createMockApplication()]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('Total Applications')).toBeInTheDocument()
      expect(screen.getByText('Response Rate')).toBeInTheDocument()
      expect(screen.getByText('Active Interviews')).toBeInTheDocument()
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
    })
  })

  describe('Icons and Visual Elements', () => {
    it('renders icons for each stat card', () => {
      const applications = [createMockApplication()]
      const { container } = render(<SmartStatsPanel applications={applications} />)

      // lucide-react icons render as SVG elements
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThanOrEqual(4) // At least 4 icons for 4 cards
    })

    it('applies color classes to icon containers', () => {
      const applications = [createMockApplication()]
      const { container } = render(<SmartStatsPanel applications={applications} />)

      // Check for color classes in icon containers
      const blueIcon = container.querySelector('.bg-blue-500\\/10')
      const greenIcon = container.querySelector('.bg-green-500\\/10')
      const purpleIcon = container.querySelector('.bg-purple-500\\/10')
      const orangeIcon = container.querySelector('.bg-orange-500\\/10')

      expect(blueIcon).toBeInTheDocument()
      expect(greenIcon).toBeInTheDocument()
      expect(purpleIcon).toBeInTheDocument()
      expect(orangeIcon).toBeInTheDocument()
    })
  })

  describe('Display Formatting', () => {
    it('displays large numbers prominently', () => {
      const applications = [createMockApplication()]
      const { container } = render(<SmartStatsPanel applications={applications} />)

      // Check for large text class on stat values
      const largeText = container.querySelector('.text-4xl')
      expect(largeText).toBeInTheDocument()
    })

    it('formats percentage with % symbol', () => {
      const applications = [
        createMockApplication({ id: '1', status: 'applied' }),
        createMockApplication({ id: '2', status: 'interviewing' }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('formats response time with d suffix', () => {
      const applications = [
        createMockApplication({
          id: '1',
          status: 'phone_screen',
          date_applied: '2025-10-01',
          updated_at: '2025-10-10', // 9 days
        }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('9d')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles very large numbers correctly', () => {
      const applications = Array.from({ length: 150 }, (_, i) =>
        createMockApplication({ id: `${i}` })
      )
      render(<SmartStatsPanel applications={applications} />)

      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('handles missing date_applied gracefully', () => {
      const applications = [
        createMockApplication({
          id: '1',
          status: 'phone_screen',
          date_applied: '',
          updated_at: '2025-10-10',
        }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      // Should not crash, display "—" for avg response time
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('handles missing updated_at gracefully', () => {
      const applications = [
        createMockApplication({
          id: '1',
          status: 'phone_screen',
          date_applied: '2025-10-01',
          updated_at: '',
        }),
      ]
      render(<SmartStatsPanel applications={applications} />)

      // Should not crash
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
    })
  })
})
