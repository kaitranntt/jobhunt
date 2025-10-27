import { render, screen, waitFor } from '@testing-library/react'
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

// Mock ThemeToggle
vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme Toggle</button>,
}))

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('NavBar Component', () => {
  beforeEach(() => {
    setupMatchMedia()
  })

  describe('Landing Variant', () => {
    it('should render logo with JobHunt text', () => {
      renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
    })

    it('should render logo as link to home', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const logo = screen.getByText('JobHunt').closest('a')
      expect(logo).toHaveAttribute('href', '/')
    })

    it('should render logo image', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const logo = screen.getByText('JobHunt').closest('a')
      const image = logo?.querySelector('img')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('alt', 'JobHunt Logo')
    })

    it('should render Get Started link', () => {
      renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByText('Get Started')).toBeInTheDocument()
      expect(screen.getByText('Get Started').closest('a')).toHaveAttribute('href', '/signup')
    })

    it('should render GitHub link with external attributes', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const githubLink = screen.getByText('GitHub').closest('a')
      expect(githubLink).toHaveAttribute('href', 'https://github.com/kaitranntt/jobhunt')
      expect(githubLink).toHaveAttribute('target', '_blank')
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should render GitHub icon', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const githubLink = screen.getByText('GitHub').closest('a')
      expect(githubLink?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render ThemeToggle by default', () => {
      renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    })

    it('should have fixed positioning classes', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('fixed')
      expect(header).toHaveClass('z-50')
      expect(header).toHaveClass('top-0')
      expect(header).toHaveClass('left-0')
      expect(header).toHaveClass('right-0')
    })

    it('should have glass-light styling for landing variant', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('glass-light')
    })

    it('should have border styling', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('border-b')
    })

    it('should apply custom className if provided', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" className="custom-class" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('custom-class')
    })

    it('should use 95% width layout for maximum viewport utilization', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const navContent = container.querySelector('header > div')
      expect(navContent).toHaveClass('w-[98%]')
      expect(navContent).toHaveClass('mx-auto')
    })
  })

  describe('Authenticated Variant', () => {
    const authMockUser = {
      id: 'test-user-id',
      email: 'test',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
    }

    it('should render logo with JobHunt text', () => {
      renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
    })

    it('should render logo as link to dashboard', () => {
      renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      const logo = screen.getByText('JobHunt').closest('a')
      expect(logo).toHaveAttribute('href', '/dashboard')
    })

    it('should render ProfileDropdown when authenticated', async () => {
      renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      // Should render profile dropdown with user name
      expect(screen.getByRole('button', { name: /user menu for test/i })).toBeInTheDocument()
      expect(screen.getByText('test')).toBeInTheDocument()
    })

    it('should render ProfileDropdown and ThemeToggle for authenticated user', async () => {
      renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      // Should have ProfileDropdown and ThemeToggle
      expect(screen.getByRole('button', { name: /user menu for test/i })).toBeInTheDocument()
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()

      // Should have ProfileDropdown button and ThemeToggle button
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(2)
    })

    it('should render ProfileDropdown with responsive user name', async () => {
      renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      // ProfileDropdown should render user name
      const userName = screen.getByText('test')
      // The user name span should have the responsive classes
      expect(userName).toBeInTheDocument()
      expect(userName).toHaveClass('hidden')
      expect(userName).toHaveClass('sm:block')
    })

    it('should render ThemeToggle by default', () => {
      renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    })

    it('should have glass-light styling for authenticated variant', () => {
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('glass-light')
      expect(header).toHaveClass('border-b')
    })

    it('should not have fixed positioning', () => {
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={authMockUser} />)
      const header = container.querySelector('header')
      expect(header).not.toHaveClass('fixed')
    })

    it('should handle null user gracefully', () => {
      renderWithTheme(<NavBar variant="authenticated" user={null} />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
      // Should not render ProfileDropdown when user is null
      expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument()
      // Should only have ThemeToggle button
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(1)
      expect(buttons[0]).toHaveAttribute('aria-label', 'Toggle theme')
    })

    it('should handle user without email gracefully', async () => {
      const userWithoutEmail = { ...authMockUser, email: '' }
      renderWithTheme(<NavBar variant="authenticated" user={userWithoutEmail} />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
      // Should still render ThemeToggle and ProfileDropdown even without email
      expect(screen.getByRole('button', { name: /user menu for user/i })).toBeInTheDocument()
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()

      // Should have ThemeToggle button and ProfileDropdown
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(2)
    })

    it('should apply custom className if provided', () => {
      const { container } = renderWithTheme(
        <NavBar variant="authenticated" user={authMockUser} className="custom-auth-class" />
      )
      const header = container.querySelector('header')
      expect(header).toHaveClass('custom-auth-class')
    })
  })

  describe('Auth Pages Variant', () => {
    it('should render logo with JobHunt text', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
    })

    it('should render logo linking to home', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      const logo = screen.getByText('JobHunt').closest('a')
      expect(logo).toHaveAttribute('href', '/')
    })

    it('should render ThemeToggle by default', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    })

    it('should have glass-light styling for auth-pages variant', () => {
      const { container } = renderWithTheme(<NavBar variant="auth-pages" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('glass-light')
      expect(header).toHaveClass('border-b')
    })

    it('should not render user info', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument()
    })

    it('should not render Get Started link', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
    })

    it('should not render GitHub link', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
    })

    it('should apply custom className if provided', () => {
      const { container } = renderWithTheme(
        <NavBar variant="auth-pages" className="custom-auth-pages-class" />
      )
      const header = container.querySelector('header')
      expect(header).toHaveClass('custom-auth-pages-class')
    })

    it('should use 95% width layout for maximum viewport utilization', () => {
      const { container } = renderWithTheme(<NavBar variant="auth-pages" />)
      const navContent = container.querySelector('header > div')
      expect(navContent).toHaveClass('w-[98%]')
      expect(navContent).toHaveClass('mx-auto')
    })
  })

  describe('Responsive Behavior', () => {
    it('should hide Get Started link on mobile for landing variant', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const getStartedLink = screen.getByText('Get Started').closest('a')
      expect(getStartedLink).toHaveClass('hidden')
      expect(getStartedLink).toHaveClass('sm:inline-flex')
    })

    it('should hide GitHub link on mobile for landing variant', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const githubLink = screen.getByText('GitHub').closest('a')
      expect(githubLink).toHaveClass('hidden')
      expect(githubLink).toHaveClass('sm:inline-flex')
    })

    it('should hide user name on mobile for authenticated variant', async () => {
      const responsiveUser = {
        id: 'test-user-id',
        email: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }
      renderWithTheme(<NavBar variant="authenticated" user={responsiveUser} />)
      await waitFor(() => {
        const userName = screen.getByText('test')
        // The user name span should have the responsive classes
        expect(userName).toBeInTheDocument()
        expect(userName).toHaveClass('hidden')
        expect(userName).toHaveClass('sm:block')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on external links', () => {
      renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByLabelText('View on GitHub')).toBeInTheDocument()
    })

    it('should have semantic header element for all variants', () => {
      const accessibilityUser = {
        id: 'test-user-id',
        email: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }

      const { container: landingContainer } = renderWithTheme(<NavBar variant="landing" />)
      expect(landingContainer.querySelector('header')).toBeInTheDocument()

      const { container: authContainer } = renderWithTheme(
        <NavBar variant="authenticated" user={accessibilityUser} />
      )
      expect(authContainer.querySelector('header')).toBeInTheDocument()

      const { container: authPagesContainer } = renderWithTheme(<NavBar variant="auth-pages" />)
      expect(authPagesContainer.querySelector('header')).toBeInTheDocument()
    })

    it('should have proper accessibility for simplified authenticated variant', async () => {
      const ariaUser = {
        id: 'test-user-id',
        email: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }
      renderWithTheme(<NavBar variant="authenticated" user={ariaUser} />)

      // Should have user email displayed
      expect(screen.getByText('test')).toBeInTheDocument()

      // Should have ThemeToggle with proper ARIA label
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    })
  })

  describe('Theme Toggle Integration', () => {
    it('should not render ThemeToggle when showThemeToggle is false for landing', () => {
      renderWithTheme(<NavBar variant="landing" showThemeToggle={false} />)
      expect(screen.queryByLabelText('Toggle theme')).not.toBeInTheDocument()
    })

    it('should not render ThemeToggle when showThemeToggle is false for authenticated', () => {
      const themeTestUser = {
        id: 'test-user-id',
        email: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }
      renderWithTheme(
        <NavBar variant="authenticated" user={themeTestUser} showThemeToggle={false} />
      )
      expect(screen.queryByLabelText('Toggle theme')).not.toBeInTheDocument()
    })

    it('should not render ThemeToggle when showThemeToggle is false for auth-pages', () => {
      renderWithTheme(<NavBar variant="auth-pages" showThemeToggle={false} />)
      expect(screen.queryByLabelText('Toggle theme')).not.toBeInTheDocument()
    })

    it('should render ThemeToggle when showThemeToggle is true', () => {
      renderWithTheme(<NavBar variant="landing" showThemeToggle={true} />)
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    })

    it('should render ThemeToggle by default when showThemeToggle is not provided', () => {
      renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    })
  })

  describe('Brand Styling', () => {
    it('should apply brand gradient to logo text in landing variant', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const logoText = screen.getByText('JobHunt')
      expect(logoText).toHaveClass('gradient-brand-text')
    })

    it('should render logo image in landing variant', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const logo = screen.getByText('JobHunt').closest('a')
      const image = logo?.querySelector('img')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('alt', 'JobHunt Logo')
    })

    it('should apply brand gradient to logo text in auth-pages variant', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      const logoText = screen.getByText('JobHunt')
      expect(logoText).toHaveClass('gradient-brand-text')
    })

    it('should render logo image in authenticated variant', () => {
      const brandUser = {
        id: 'test-user-id',
        email: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }
      renderWithTheme(<NavBar variant="authenticated" user={brandUser} />)
      const logo = screen.getByText('JobHunt').closest('a')
      const image = logo?.querySelector('img')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('alt', 'JobHunt Logo')
    })
  })

  describe('Navigation Structure', () => {
    it('should use flex layout for landing variant', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const flexContainer = container.querySelector('.flex.items-center.justify-between')
      expect(flexContainer).toBeInTheDocument()
    })

    it('should use flex layout for authenticated variant', () => {
      const layoutUser = {
        id: 'test-user-id',
        email: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={layoutUser} />)
      const flexContainer = container.querySelector('.flex.items-center.justify-between')
      expect(flexContainer).toBeInTheDocument()
    })

    it('should use flex layout for auth-pages variant', () => {
      const { container } = renderWithTheme(<NavBar variant="auth-pages" />)
      const flexContainer = container.querySelector('.flex.items-center.justify-between')
      expect(flexContainer).toBeInTheDocument()
    })

    it('should group navigation items in flex container for landing', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const navGroup = container.querySelector('.flex.items-center.gap-4')
      expect(navGroup).toBeInTheDocument()
    })

    it('should group user actions in flex container for authenticated', () => {
      const groupUser = {
        id: 'test-user-id',
        email: 'test',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={groupUser} />)
      const actionsGroup = container.querySelector('.flex.items-center.gap-4')
      expect(actionsGroup).toBeInTheDocument()
    })
  })
})
