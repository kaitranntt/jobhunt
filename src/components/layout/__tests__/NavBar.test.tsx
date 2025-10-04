import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { NavBar } from '../NavBar'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'

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

    it('should render Briefcase icon', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const logo = screen.getByText('JobHunt').closest('a')
      expect(logo?.querySelector('svg')).toBeInTheDocument()
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
      expect(screen.getByLabelText(/choose theme/i)).toBeInTheDocument()
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

    it('should use container max-width layout', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const containerDiv = container.querySelector('.container')
      expect(containerDiv).toHaveClass('max-w-7xl')
      expect(containerDiv).toHaveClass('mx-auto')
    })
  })

  describe('Authenticated Variant', () => {
    const mockUser = { email: 'test@example.com' }

    it('should render logo with JobHunt text', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
    })

    it('should render logo as link to dashboard', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      const logo = screen.getByText('JobHunt').closest('a')
      expect(logo).toHaveAttribute('href', '/dashboard')
    })

    it('should render user email', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should render Sign out button', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    it('should render sign out form with correct action', () => {
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      const form = container.querySelector('form')
      expect(form).toHaveAttribute('action', '/auth/signout')
      expect(form).toHaveAttribute('method', 'post')
    })

    it('should render sign out button with aria-label', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      const button = screen.getByRole('button', { name: /sign out of your account/i })
      expect(button).toHaveAttribute('aria-label', 'Sign out of your account')
    })

    it('should render ThemeToggle by default', () => {
      renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      expect(screen.getByLabelText(/choose theme/i)).toBeInTheDocument()
    })

    it('should have glass-medium styling for authenticated variant', () => {
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('glass-medium')
      expect(header).toHaveClass('border-b')
      expect(header).toHaveClass('shadow-glass-soft')
    })

    it('should not have fixed positioning', () => {
      const { container } = renderWithTheme(<NavBar variant="authenticated" user={mockUser} />)
      const header = container.querySelector('header')
      expect(header).not.toHaveClass('fixed')
    })

    it('should handle null user gracefully', () => {
      renderWithTheme(<NavBar variant="authenticated" user={null} />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    it('should handle user without email gracefully', () => {
      renderWithTheme(<NavBar variant="authenticated" user={{ email: '' }} />)
      expect(screen.getByText('JobHunt')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    it('should apply custom className if provided', () => {
      const { container } = renderWithTheme(
        <NavBar variant="authenticated" user={mockUser} className="custom-auth-class" />
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
      expect(screen.getByLabelText(/choose theme/i)).toBeInTheDocument()
    })

    it('should have glass-ultra styling for auth-pages variant', () => {
      const { container } = renderWithTheme(<NavBar variant="auth-pages" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('glass-ultra')
      expect(header).toHaveClass('border-b')
    })

    it('should not render user info', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument()
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

    it('should use container max-width layout', () => {
      const { container } = renderWithTheme(<NavBar variant="auth-pages" />)
      const containerDiv = container.querySelector('.container')
      expect(containerDiv).toHaveClass('max-w-7xl')
      expect(containerDiv).toHaveClass('mx-auto')
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

    it('should hide user email on mobile for authenticated variant', () => {
      renderWithTheme(<NavBar variant="authenticated" user={{ email: 'test@example.com' }} />)
      const emailSpan = screen.getByText('test@example.com')
      expect(emailSpan).toHaveClass('hidden')
      expect(emailSpan).toHaveClass('sm:inline-block')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on external links', () => {
      renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByLabelText('View on GitHub')).toBeInTheDocument()
    })

    it('should have semantic header element for all variants', () => {
      const { container: landingContainer } = renderWithTheme(<NavBar variant="landing" />)
      expect(landingContainer.querySelector('header')).toBeInTheDocument()

      const { container: authContainer } = renderWithTheme(
        <NavBar variant="authenticated" user={{ email: 'test@example.com' }} />
      )
      expect(authContainer.querySelector('header')).toBeInTheDocument()

      const { container: authPagesContainer } = renderWithTheme(<NavBar variant="auth-pages" />)
      expect(authPagesContainer.querySelector('header')).toBeInTheDocument()
    })

    it('should have proper ARIA label on sign out button', () => {
      renderWithTheme(<NavBar variant="authenticated" user={{ email: 'test@example.com' }} />)
      expect(screen.getByLabelText('Sign out of your account')).toBeInTheDocument()
    })
  })

  describe('Theme Toggle Integration', () => {
    it('should not render ThemeToggle when showThemeToggle is false for landing', () => {
      renderWithTheme(<NavBar variant="landing" showThemeToggle={false} />)
      expect(screen.queryByLabelText(/choose theme/i)).not.toBeInTheDocument()
    })

    it('should not render ThemeToggle when showThemeToggle is false for authenticated', () => {
      renderWithTheme(
        <NavBar variant="authenticated" user={{ email: 'test@example.com' }} showThemeToggle={false} />
      )
      expect(screen.queryByLabelText(/choose theme/i)).not.toBeInTheDocument()
    })

    it('should not render ThemeToggle when showThemeToggle is false for auth-pages', () => {
      renderWithTheme(<NavBar variant="auth-pages" showThemeToggle={false} />)
      expect(screen.queryByLabelText(/choose theme/i)).not.toBeInTheDocument()
    })

    it('should render ThemeToggle when showThemeToggle is true', () => {
      renderWithTheme(<NavBar variant="landing" showThemeToggle={true} />)
      expect(screen.getByLabelText(/choose theme/i)).toBeInTheDocument()
    })

    it('should render ThemeToggle by default when showThemeToggle is not provided', () => {
      renderWithTheme(<NavBar variant="landing" />)
      expect(screen.getByLabelText(/choose theme/i)).toBeInTheDocument()
    })
  })

  describe('Brand Styling', () => {
    it('should apply brand gradient to logo text in landing variant', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const logoText = screen.getByText('JobHunt')
      expect(logoText).toHaveClass('gradient-brand-text')
    })

    it('should use tint-blue color for icon in landing variant', () => {
      renderWithTheme(<NavBar variant="landing" />)
      const logo = screen.getByText('JobHunt').closest('a')
      const icon = logo?.querySelector('svg')
      expect(icon).toHaveStyle({ color: 'var(--tint-blue)' })
    })

    it('should apply brand gradient to logo text in auth-pages variant', () => {
      renderWithTheme(<NavBar variant="auth-pages" />)
      const logoText = screen.getByText('JobHunt')
      expect(logoText).toHaveClass('gradient-brand-text')
    })

    it('should use tint-blue color for icon in authenticated variant', () => {
      renderWithTheme(
        <NavBar variant="authenticated" user={{ email: 'test@example.com' }} />
      )
      const logo = screen.getByText('JobHunt').closest('a')
      const icon = logo?.querySelector('svg')
      expect(icon).toHaveStyle({ color: 'var(--tint-blue)' })
    })
  })

  describe('Navigation Structure', () => {
    it('should use flex layout for landing variant', () => {
      const { container } = renderWithTheme(<NavBar variant="landing" />)
      const flexContainer = container.querySelector('.flex.items-center.justify-between')
      expect(flexContainer).toBeInTheDocument()
    })

    it('should use flex layout for authenticated variant', () => {
      const { container } = renderWithTheme(
        <NavBar variant="authenticated" user={{ email: 'test@example.com' }} />
      )
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
      const { container } = renderWithTheme(
        <NavBar variant="authenticated" user={{ email: 'test@example.com' }} />
      )
      const actionsGroup = container.querySelector('.flex.items-center.gap-4')
      expect(actionsGroup).toBeInTheDocument()
    })
  })
})
