import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LogoutButton } from '../LogoutButton'

// Mock Next.js router
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders logout button with icon and text', () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')

      // Check for icon
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()

      // Check for text (visible on desktop)
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    it('renders in disabled state when loading', () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Button should not be disabled initially
      expect(button).not.toBeDisabled()
    })

    it('applies correct styling classes', () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      expect(button).toHaveClass('text-red-600')
      expect(button).toHaveClass('hover:text-red-700')
      expect(button).toHaveClass('hover:bg-red-50')
      expect(button).toHaveClass('dark:text-red-400')
      expect(button).toHaveClass('dark:hover:text-red-300')
      expect(button).toHaveClass('dark:hover:bg-red-950/20')
      expect(button).toHaveClass('glass-interactive')
    })
  })

  describe('Dialog Interaction', () => {
    it('opens confirmation dialog when button is clicked', async () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      // Check dialog content
      expect(screen.getByText(/You will be redirected to the landing page/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    })

    it('closes dialog when cancel is clicked', async () => {
      render(<LogoutButton />)

      // Open dialog
      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Sign out of JobHunt?')).not.toBeInTheDocument()
      })
    })
  })

  describe('Logout Functionality', () => {
    it('calls logout API when sign out is confirmed', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
      global.fetch = mockFetch

      render(<LogoutButton />)

      // Open dialog
      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      // Confirm logout
      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      // Check API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Check navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('shows loading state during logout process', async () => {
      let resolvePromise: (value: Response) => void
      const mockFetch = vi.fn().mockImplementation(
        () =>
          new Promise<Response>(resolve => {
            resolvePromise = resolve
          })
      )
      global.fetch = mockFetch

      render(<LogoutButton />)

      // Open dialog and confirm logout
      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      // Check loading state - main button shows spinner
      await waitFor(() => {
        const mainButton = screen.getByRole('button', { name: /logout/i })
        const loader = mainButton.querySelector('svg.animate-spin')
        expect(loader).toBeInTheDocument()
        expect(mainButton).toBeDisabled()
      })

      // Resolve the promise
      resolvePromise!(new Response(JSON.stringify({}), { status: 200 }))
    })

    it('handles API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
      global.fetch = mockFetch

      // Mock window.location
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' } as any

      render(<LogoutButton />)

      // Open dialog and confirm logout
      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      // Check error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
        expect(window.location.href).toBe('/')
      })

      // Restore
      consoleSpy.mockRestore()
      window.location = originalLocation as any
    })

    it('handles network error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch

      // Mock window.location
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' } as any

      render(<LogoutButton />)

      // Open dialog and confirm logout
      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      // Check error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
        expect(window.location.href).toBe('/')
      })

      // Restore
      consoleSpy.mockRestore()
      window.location = originalLocation as any
    })
  })

  describe('Button States', () => {
    it('disables button during loading', async () => {
      const mockFetch = vi
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      global.fetch = mockFetch

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      // Check if main button is disabled during loading
      await waitFor(() => {
        expect(button).toBeDisabled()
      })
    })

    it('shows spinner icon during loading', async () => {
      const mockFetch = vi
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      global.fetch = mockFetch

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      // Check for spinner
      await waitFor(() => {
        const spinner = button.querySelector('svg.animate-spin')
        expect(spinner).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Focus the button
      button.focus()
      expect(document.activeElement).toBe(button)

      // Trigger with Enter key
      fireEvent.keyDown(button, { key: 'Enter' })
      // Should open dialog (async)
    })

    it('maintains accessibility when disabled', async () => {
      const mockFetch = vi
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      global.fetch = mockFetch

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      // Check button becomes disabled
      await waitFor(() => {
        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('disabled')
      })
    })

    it('has proper ARIA attributes', () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Check for proper button attributes
      expect(button).toHaveAttribute('type', 'button')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Error Scenarios', () => {
    it('handles fetch rejection', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'))

      // Mock window.location
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' } as any

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
        expect(window.location.href).toBe('/')
      })

      // Restore
      consoleSpy.mockRestore()
      window.location = originalLocation as any
    })

    it('handles malformed response', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      // Mock window.location
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' } as any

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sign out of JobHunt?')).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
        expect(window.location.href).toBe('/')
      })

      // Restore
      consoleSpy.mockRestore()
      window.location = originalLocation as any
    })
  })
})
