import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ProfileDropdown } from '../ProfileDropdown'
import type { User } from '@supabase/supabase-js'

// Mock Next.js router
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock Button component to avoid ref issues
vi.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
  >(({ children, className, ...props }, ref) => (
    <button className={className || ''} ref={ref} {...props} data-testid="button">
      {children}
    </button>
  )),
}))

// Mock Radix UI Avatar
vi.mock('@radix-ui/react-avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar">{children}</div>
  ),
  AvatarImage: ({ alt }: { src?: string; alt: string }) => (
    <div data-testid="avatar-image" aria-label={alt} />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}))

// Mock profile utils
vi.mock('../utils/profile-utils', () => ({
  getUserInitials: vi.fn((user: User) => {
    const email = user.email || ''
    return email.slice(0, 2).toUpperCase()
  }),
  getUserDisplayName: vi.fn((user: User) => {
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name
    }
    return user.email?.split('@')[0] || 'User'
  }),
  getUserAvatarUrl: vi.fn((user: User) => {
    return user.user_metadata?.avatar_url || null
  }),
  formatUserEmail: vi.fn((user: User) => {
    return user.email || 'unknown@example.com'
  }),
}))

describe('ProfileDropdown', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  } as User

  const defaultProps = {
    user: mockUser,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render profile dropdown component', () => {
      render(<ProfileDropdown {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /user menu for test user/i })
      expect(trigger).toBeInTheDocument()
    })

    it('should render trigger button with proper ARIA label', () => {
      render(<ProfileDropdown {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /user menu for test user/i })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-label', 'User menu for Test User')
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('should render avatar component', () => {
      render(<ProfileDropdown {...defaultProps} />)

      expect(screen.getByTestId('avatar')).toBeInTheDocument()
    })

    it('should render user name in trigger button', () => {
      render(<ProfileDropdown {...defaultProps} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<ProfileDropdown {...defaultProps} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('User Data Processing', () => {
    it('should handle user with no display name', () => {
      const userWithoutName = {
        ...mockUser,
        user_metadata: {},
        email: 'john.doe@example.com',
      }

      render(<ProfileDropdown {...defaultProps} user={userWithoutName} />)

      expect(screen.getByText('john.doe')).toBeInTheDocument()
    })

    it('should handle user with no email', () => {
      const userWithoutEmail = {
        ...mockUser,
        email: undefined,
        user_metadata: {
          display_name: 'Test User',
        },
      }

      render(<ProfileDropdown {...defaultProps} user={userWithoutEmail} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should handle user with no metadata', () => {
      const userWithoutMetadata = {
        ...mockUser,
        user_metadata: {},
        email: 'test@example.com',
      }

      render(<ProfileDropdown {...defaultProps} user={userWithoutMetadata} />)

      expect(screen.getByText('test')).toBeInTheDocument()
    })
  })

  describe('Event Handlers', () => {
    it('should accept callback functions without throwing errors', () => {
      const handlers = {
        onProfileClick: vi.fn(),
        onSettingsClick: vi.fn(),
        onLogoutClick: vi.fn(),
      }

      expect(() => {
        render(<ProfileDropdown {...defaultProps} {...handlers} />)
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on trigger button', () => {
      render(<ProfileDropdown {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /user menu for test user/i })
      expect(trigger).toHaveAttribute('aria-label', 'User menu for Test User')
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Styling and Layout', () => {
    it('should apply glass morphism classes to trigger button', () => {
      render(<ProfileDropdown {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-glass-lg', 'glass-interactive')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty user object gracefully', () => {
      const emptyUser = {
        id: '',
        email: undefined,
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '',
      } as User

      render(<ProfileDropdown {...defaultProps} user={emptyUser} />)

      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
    })
  })
})
