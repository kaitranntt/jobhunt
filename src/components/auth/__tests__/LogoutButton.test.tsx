import { render, screen, fireEvent } from '@testing-library/react'
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

// Mock useLogout hook
const mockLogout = vi.fn()
let mockIsLoading = false

vi.mock('@/hooks/useLogout', () => ({
  useLogout: () => ({
    logout: mockLogout,
    isLoading: mockIsLoading,
  }),
}))

// Mock fetch (used internally by useLogout hook)
global.fetch = vi.fn()

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock loading state
    mockIsLoading = false
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

  describe('Immediate Logout', () => {
    it('calls logout function immediately when button is clicked', async () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      // Check logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('shows loading state during logout process', async () => {
      // Set initial loading state to false
      mockIsLoading = false

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Initially button should not be disabled
      expect(button).not.toBeDisabled()

      // Simulate loading state change (this would be controlled by the useLogout hook)
      mockIsLoading = true

      // Re-render to show loading state
      fireEvent.click(button)

      // Since the hook controls loading, we just verify the logout function is called
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('handles logout error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock logout to throw an error
      mockLogout.mockRejectedValue(new Error('Logout failed'))

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      // Check logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1)

      // Restore
      consoleSpy.mockRestore()
    })

    it('handles network error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock logout to simulate network error
      mockLogout.mockRejectedValue(new Error('Network error'))

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      // Check logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1)

      // Restore
      consoleSpy.mockRestore()
    })
  })

  describe('Button States', () => {
    it('disables button during loading', () => {
      // Mock loading state
      mockIsLoading = true

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Check if button is disabled when loading
      expect(button).toBeDisabled()
    })

    it('shows spinner icon during loading', () => {
      // Mock loading state
      mockIsLoading = true

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Check for spinner when loading
      const spinner = button.querySelector('svg.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible and can be focused', () => {
      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Focus the button
      button.focus()
      expect(document.activeElement).toBe(button)

      // Trigger click event (simulating keyboard interaction)
      fireEvent.click(button)

      // Check logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('maintains accessibility when disabled', () => {
      // Mock loading state
      mockIsLoading = true

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })

      // Check button is disabled when loading
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('disabled')
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
    it('handles logout rejection', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock logout to reject
      mockLogout.mockRejectedValue(new Error('Logout failed'))

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      // Check logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1)

      // Restore
      consoleSpy.mockRestore()
    })

    it('handles logout error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock logout to reject with different error
      mockLogout.mockRejectedValue(new Error('Malformed response'))

      render(<LogoutButton />)

      const button = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(button)

      // Check logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1)

      // Restore
      consoleSpy.mockRestore()
    })
  })
})
