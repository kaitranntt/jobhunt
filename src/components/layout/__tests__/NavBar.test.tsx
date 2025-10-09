import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NavBar } from '../NavBar'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock Next.js Image component - using div to avoid img element warning in tests
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: any) => (
    <div role="img" aria-label={alt} {...props} data-testid="next-image-mock" />
  ),
}))

// Mock Supabase client for ProfileDropdown
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            })
          ),
        })),
      })),
    })),
  }),
}))

// Mock fetch for sign out
global.fetch = vi.fn()

// Test helpers
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated' as const,
  created_at: '2024-01-01T00:00:00Z',
}

const mockUserWithComplexEmail = {
  ...mockUser,
  email: 'john.doe@example.com',
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('NavBar Component Suite', () => {
  beforeEach(() => {
    setupMatchMedia()
    vi.clearAllMocks()
  })

  describe('Landing Page Navigation', () => {
    it('allows users to navigate to the home page via the logo', () => {
      renderWithTheme(<NavBar variant="landing" />)

      const logoLink = screen.getByRole('link', { name: /jobhunt/i })
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('shows navigation options for unauthenticated users', () => {
      renderWithTheme(<NavBar variant="landing" />)

      expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
      expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/signup')
    })

    it('provides access to the GitHub repository', () => {
      renderWithTheme(<NavBar variant="landing" />)

      const githubLink = screen.getByRole('link', { name: /view on github/i })
      expect(githubLink).toHaveAttribute('href', 'https://github.com/kaitranntt/jobhunt')
      expect(githubLink).toHaveAttribute('target', '_blank')
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('allows users to toggle the theme', () => {
      renderWithTheme(<NavBar variant="landing" />)

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeToggle).toBeInTheDocument()

      // Users should be able to click the theme toggle
      expect(themeToggle).toBeEnabled()
    })

    it('displays dashboard link when user is authenticated', () => {
      renderWithTheme(<NavBar variant="landing" user={mockUser} />)

      const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })

    it('remains fixed at the top of the page', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const header = container.querySelector('header')

      expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })

    it('applies glass styling for visual appeal', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const header = container.querySelector('header')

      expect(header).toHaveClass('glass-light', 'border-b')
    })

    it('hides certain navigation items on mobile for better UX', () => {
      renderWithTheme(<NavBar variant="landing" />)

      const getStartedLink = screen.getByRole('link', { name: /get started/i })
      const githubLink = screen.getByRole('link', { name: /view on github/i })

      expect(getStartedLink).toHaveClass('hidden', 'sm:inline-flex')
      expect(githubLink).toHaveClass('hidden', 'sm:inline-flex')
    })
  })

  describe('Authenticated Pages Navigation', () => {
    it('provides navigation back to dashboard via logo', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)

      const logoLink = screen.getByRole('link', { name: /jobhunt/i })
      expect(logoLink).toHaveAttribute('href', '/dashboard')
    })

    it('displays user profile information', async () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} userId="test-user-id" />)

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('allows users to access their profile dropdown', async () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} userId="test-user-id" />)

      await waitFor(() => {
        // Find the profile dropdown button by looking for button with aria-haspopup="menu"
        const buttons = screen.getAllByRole('button')
        const profileButton = buttons.find(
          button => button.getAttribute('aria-haspopup') === 'menu'
        )
        expect(profileButton).toBeInTheDocument()
        expect(profileButton).toHaveAttribute('aria-haspopup', 'menu')
      })
    })

    it('includes theme toggle functionality', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeToggle).toBeInTheDocument()
    })

    it('applies appropriate styling for authenticated pages', () => {
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      const header = container.querySelector('header')

      expect(header).toHaveClass('glass-medium', 'border-b', 'shadow-glass-soft')
    })

    it('does not use fixed positioning for authenticated pages', () => {
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      const header = container.querySelector('header')

      expect(header).not.toHaveClass('fixed')
    })

    it('handles missing user information gracefully', () => {
      renderWithTheme(<NavBar variant="authenticated" user={null} userId="test-user-id" />)

      // Should still render the logo and theme toggle
      expect(screen.getByRole('link', { name: /jobhunt/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
  })

  describe('Dashboard Navigation', () => {
    it('provides tab navigation for different dashboard sections', () => {
      renderWithTheme(<NavBar variant="dashboard" user={mockUser} userId="test-user-id" />)

      const trackerTab = screen.getByRole('link', { name: /tracker/i })
      const overviewTab = screen.getByRole('link', { name: /overview/i })

      expect(trackerTab).toHaveAttribute('href', '/dashboard?tab=tracker')
      expect(overviewTab).toHaveAttribute('href', '/dashboard?tab=overview')
    })

    it('visually indicates the active tab', () => {
      renderWithTheme(
        <NavBar variant="dashboard" user={mockUser} userId="test-user-id" activeTab="tracker" />
      )

      const trackerTab = screen.getByRole('link', { name: /tracker/i })
      const overviewTab = screen.getByRole('link', { name: /overview/i })

      // The active tab should have different styling than the inactive tab
      expect(trackerTab).not.toEqual(overviewTab)

      // The tracker tab should have style attribute (indicating it's active)
      expect(trackerTab).toHaveAttribute('style')

      // Should contain the background color style for active state
      expect(trackerTab.getAttribute('style')).toContain('background-color')
    })

    it('provides a search bar for finding applications', () => {
      renderWithTheme(<NavBar variant="dashboard" user={mockUser} userId="test-user-id" />)

      expect(screen.getByText('Search applications')).toBeInTheDocument()
    })

    it('includes interactive settings button', () => {
      renderWithTheme(<NavBar variant="dashboard" user={mockUser} userId="test-user-id" />)

      // Find the settings button by looking for a button containing a Settings icon
      const buttons = screen.getAllByRole('button')
      const settingsButton = buttons.find(button => button.querySelector('svg.lucide-settings'))
      expect(settingsButton).toBeInTheDocument()
      expect(settingsButton).toBeEnabled()
    })

    it('includes notifications interface', () => {
      renderWithTheme(<NavBar variant="dashboard" user={mockUser} userId="test-user-id" />)

      // Find the bell icon (notifications)
      const bellIcons = document.querySelectorAll('svg.lucide-bell')
      expect(bellIcons.length).toBeGreaterThan(0)
    })

    it('displays user initials for quick identification', () => {
      renderWithTheme(
        <NavBar variant="dashboard" user={mockUserWithComplexEmail} userId="test-user-id" />
      )

      // Should show "JD" from "john.doe@example.com"
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('shows fallback initials for simple email formats', () => {
      const userWithSimpleEmail = { ...mockUser, email: 'user@domain.com' }
      renderWithTheme(
        <NavBar variant="dashboard" user={userWithSimpleEmail} userId="test-user-id" />
      )

      // Should show "US" from "user@domain.com" (first 2 characters of email)
      expect(screen.getByText('US')).toBeInTheDocument()
    })

    it('applies dashboard-specific styling with rounded corners', () => {
      const { container } = renderWithTheme(
        <NavBar variant="dashboard" user={mockUser} userId="test-user-id" />
      )
      const header = container.querySelector('header')

      expect(header).toHaveStyle({
        borderRadius: '12px',
        backgroundColor: 'var(--glass-light)',
      })
    })

    it('includes theme toggle in dashboard navigation', () => {
      renderWithTheme(<NavBar variant="dashboard" user={mockUser} userId="test-user-id" />)

      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
  })

  describe('Authentication Pages Navigation', () => {
    it('provides simple navigation with logo link to home', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)

      const logoLink = screen.getByRole('link', { name: /jobhunt/i })
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('includes theme toggle for auth pages', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)

      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })

    it('maintains clean, minimalist design', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)

      // Should not show authentication-related navigation
      expect(screen.queryByText(/log in/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/get started/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/github/i)).not.toBeInTheDocument()
    })

    it('applies ultra-light glass styling', () => {
      const { container } = renderWithTheme(<NavBar variant="auth-pages" />)
      const header = container.querySelector('header')

      expect(header).toHaveClass('glass-ultra', 'border-b')
    })
  })

  describe('Theme Toggle Integration', () => {
    it('can be disabled for any variant', () => {
      renderWithTheme(<NavBar variant="landing" showThemeToggle={false} />)

      expect(screen.queryByRole('button', { name: /toggle theme/i })).not.toBeInTheDocument()
    })

    it('is enabled by default across all variants', () => {
      const { rerender } = renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()

      rerender(
        <ThemeProvider>
          <NavBar variant="auth-pages" />
        </ThemeProvider>
      )
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()

      rerender(
        <ThemeProvider>
          <NavBar variant="authenticated" user={mockUser} />
        </ThemeProvider>
      )
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility Features', () => {
    it('uses semantic header elements', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)

      expect(container.querySelector('header')).toBeInTheDocument()
    })

    it('provides proper ARIA labels for external links', () => {
      renderWithTheme(<NavBar variant="landing" />)

      expect(screen.getByRole('link', { name: /view on github/i })).toBeInTheDocument()
    })

    it('includes accessible navigation structure', () => {
      renderWithTheme(<NavBar variant="landing" />)

      // Logo link should be properly labeled
      expect(screen.getByRole('link', { name: /jobhunt/i })).toBeInTheDocument()

      // Navigation links should have accessible names
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      renderWithTheme(<NavBar variant="landing" />)

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeToggle).not.toHaveAttribute('disabled')

      // Should be focusable
      expect(themeToggle).toBeEnabled()
    })
  })

  describe('Responsive Design', () => {
    it('adapts navigation items for mobile devices', () => {
      renderWithTheme(<NavBar variant="landing" />)

      // Check that responsive classes are applied
      const getStartedLink = screen.getByRole('link', { name: /get started/i })
      expect(getStartedLink).toHaveClass('hidden', 'sm:inline-flex')
    })

    it('maintains core functionality across all screen sizes', () => {
      renderWithTheme(<NavBar variant="landing" />)

      // Logo should always be visible
      expect(screen.getByRole('link', { name: /jobhunt/i })).toBeInTheDocument()

      // Theme toggle should always be available
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })
  })

  describe('Customization Support', () => {
    it('accepts custom className for styling overrides', () => {
      const { container } = renderWithTheme(
        <NavBar variant="landing" className="custom-navbar-styles" />
      )
      const header = container.querySelector('header')

      expect(header).toHaveClass('custom-navbar-styles')
    })

    it('maintains default styles when no custom className is provided', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const header = container.querySelector('header')

      expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })
  })

  describe('User Interaction Flow', () => {
    it('allows theme toggle interaction', () => {
      renderWithTheme(<NavBar variant="landing" />)

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })

      // Simulate user click
      fireEvent.click(themeToggle)

      // Button should still be present and enabled
      expect(themeToggle).toBeInTheDocument()
      expect(themeToggle).toBeEnabled()
    })

    it('provides clear navigation paths for different user states', () => {
      // Unauthenticated user
      const { rerender } = renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()

      // Authenticated user
      rerender(
        <ThemeProvider>
          <NavBar variant="landing" user={mockUser} />
        </ThemeProvider>
      )
      expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles missing user data gracefully', () => {
      renderWithTheme(<NavBar variant="authenticated" user={null} />)

      // Should still render basic navigation
      expect(screen.getByRole('link', { name: /jobhunt/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })

    it('handles users without email addresses', () => {
      const userWithoutEmail = { ...mockUser, email: undefined }
      renderWithTheme(<NavBar variant="dashboard" user={userWithoutEmail} userId="test-user-id" />)

      // Should show default initials
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('handles complex email address formats for initials', () => {
      const userWithComplexEmail = {
        ...mockUser,
        email: 'very.long.email.address@company.domain.com',
      }
      renderWithTheme(
        <NavBar variant="dashboard" user={userWithComplexEmail} userId="test-user-id" />
      )

      // For "very.long.email.address@company.domain.com", it should show "VL"
      // (first letter of "very" and first letter of "long")
      expect(screen.getByText('VL')).toBeInTheDocument()
    })
  })
})
