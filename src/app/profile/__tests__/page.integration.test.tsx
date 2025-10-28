import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProfilePage from '../page'
import type { User } from '@supabase/supabase-js'
import { act } from 'react'

// Mock sessionStorage
const sessionStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {}
  }),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

// Mock the useAvatarColor hook
vi.mock('@/hooks/useAvatarColor', () => ({
  useAvatarColor: vi.fn(() => ({
    avatarColor: {
      primary: '#FFA500',
      secondary: '#FF4500',
      gradient: 'linear-gradient(135deg, #FFA500 0%, #FF4500 100%)',
      generatedAt: Date.now(),
    },
    isLoading: false,
    error: null,
    regenerateColor: vi.fn(),
    clearColor: vi.fn(),
    hasColor: true,
  })),
  getAvatarColorStyle: vi.fn(color => ({
    background: color?.gradient || 'linear-gradient(135deg, #6A5ACD 0%, #4169E1 100%)',
    position: 'relative',
    overflow: 'hidden',
  })),
}))

// Mock the layout components that might use the avatar system
vi.mock('@/components/layout/NavBar', () => ({
  NavBar: vi.fn(({ user, variant }) => (
    <div data-testid="navbar">
      <span data-testid="nav-variant">{variant}</span>
      {user && <span data-testid="nav-user">{user.email}</span>}
    </div>
  )),
}))

vi.mock('@/components/layout/AnimatedBackground', () => ({
  AnimatedBackground: vi.fn(({ variant, children }) => (
    <div data-testid="animated-background" data-variant={variant}>
      {children}
    </div>
  )),
}))

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, ...props }) => (
    <button onClick={onClick} data-testid={props['data-testid'] || 'button'}>
      {children}
    </button>
  )),
}))

vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  )),
}))

// Mock profile utils
vi.mock('@/components/auth/utils/profile-utils', () => ({
  getUserInitials: vi.fn((user: User) => {
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
    return displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorageMock.store = {}
})

describe('Profile Page Integration', () => {
  const testUser: User = {
    id: 'test-user-123',
    email: 'john.doe@example.com',
    user_metadata: { display_name: 'John Doe' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  } as User

  it('should render profile page for authenticated user', async () => {
    // Mock successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: testUser },
      error: null,
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    // Wait for component to render with user data
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(screen.getByTestId('nav-variant')).toHaveTextContent('authenticated')
    })

    // Check profile content
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      // Use getAllByText to handle multiple email occurrences (navbar + profile page + metadata)
      expect(screen.getAllByText('john.doe@example.com').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('should redirect to login for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should handle authentication errors gracefully', async () => {
    // Mock authentication error
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Authentication failed'),
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
    })
  })

  it('should display user initials in avatar', async () => {
    // Mock successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: testUser },
      error: null,
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    // Should display user initials
    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  it('should show member since date', async () => {
    // Mock successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: testUser },
      error: null,
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    // Should show creation date (handle timezone conversion)
    await waitFor(() => {
      expect(screen.getByText(/12\/31\/2023|1\/1\/2024/)).toBeInTheDocument()
    })
  })

  it('should show authentication status', async () => {
    // Mock successful authentication with email confirmed
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { ...testUser, email_confirmed_at: '2024-01-01T00:00:00Z' } },
      error: null,
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    // Should show verified status
    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })
  })

  it('should handle back to dashboard navigation', async () => {
    // Mock successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: testUser },
      error: null,
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    // Find and click back button
    await waitFor(async () => {
      const backButton = screen.getByText('Back to Dashboard')
      await act(async () => {
        backButton.click()
      })
    })

    // Should navigate to dashboard
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
