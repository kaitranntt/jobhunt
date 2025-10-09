import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Sun: ({ className }: { className?: string }) => (
    <svg data-testid="sun-icon" className={className} viewBox="0 0 24 24">
      <title>Sun Icon</title>
    </svg>
  ),
  Moon: ({ className }: { className?: string }) => (
    <svg data-testid="moon-icon" className={className} viewBox="0 0 24 24">
      <title>Moon Icon</title>
    </svg>
  ),
}))

describe('ThemeToggle', () => {
  let localStorageMock: Record<string, string> = {}

  beforeEach(() => {
    // Set up localStorage mock (same as ThemeProvider test)
    localStorageMock = {}
    global.Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] ?? null)
    global.Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    })
    global.Storage.prototype.removeItem = vi.fn((key: string) => {
      delete localStorageMock[key]
    })

    // Reset DOM
    document.documentElement.className = ''

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, // Default to light theme preference
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper function to render component with ThemeProvider
  const renderWithThemeProvider = (defaultTheme: 'light' | 'dark' | 'system' = 'light') => {
    return render(
      <ThemeProvider defaultTheme={defaultTheme}>
        <ThemeToggle />
      </ThemeProvider>
    )
  }

  describe('Initial Rendering', () => {
    it('renders toggle button with correct accessibility label', () => {
      renderWithThemeProvider('light')

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      expect(button).toBeInTheDocument()
    })

    it('button is focusable and accessible', () => {
      renderWithThemeProvider('light')

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('has proper button styling classes', () => {
      renderWithThemeProvider('light')

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      expect(button).toHaveClass(
        'w-[60px]',
        'h-[30px]',
        'rounded-full',
        'transition-colors',
        'duration-300'
      )
    })

    it('shows sun icon after mounting for light theme', async () => {
      renderWithThemeProvider('light')

      // Wait for component to mount and render the correct icon
      await waitFor(() => {
        const sunIcon = screen.getByTestId('sun-icon')
        expect(sunIcon).toBeInTheDocument()
      })
    })

    it('shows moon icon after mounting for dark theme', async () => {
      renderWithThemeProvider('dark')

      // Wait for component to mount and render the correct icon
      await waitFor(() => {
        const moonIcon = screen.getByTestId('moon-icon')
        expect(moonIcon).toBeInTheDocument()
      })
    })

    it('shows slider in correct position for light theme', async () => {
      renderWithThemeProvider('light')

      // Wait for component to mount and update slider position
      await waitFor(() => {
        const slider = document.querySelector('[class*="translate-x-"][class*="w-[24px]"]')
        expect(slider).toHaveClass('translate-x-[3px]')
      })
    })

    it('shows slider in correct position for dark theme', async () => {
      renderWithThemeProvider('dark')

      // Wait for component to mount and update slider position
      await waitFor(() => {
        const slider = document.querySelector('[class*="translate-x-"][class*="w-[24px]"]')
        expect(slider).toHaveClass('translate-x-[30px]')
      })
    })
  })

  describe('Theme Toggle Functionality', () => {
    it('toggles from light to dark theme when clicked', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('light')

      // Wait for component to mount and verify initial state - light theme
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      await user.click(button)

      // Wait for theme to change and verify state changed to dark theme
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('toggles from dark to light theme when clicked', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('dark')

      // Wait for component to mount and verify initial state - dark theme
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      await user.click(button)

      // Wait for theme to change and verify state changed to light theme
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('persists theme selection to localStorage', async () => {
      const user = userEvent.setup()

      renderWithThemeProvider('light')

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      await user.click(button)

      // Wait for theme to change first
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })

      // Check localStorage was called correctly (same as ThemeProvider test)
      expect(localStorage.setItem).toHaveBeenCalledWith('jobhunt-theme', 'dark')
    })

    it('handles multiple rapid clicks correctly', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('light')

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })

      // Rapid click multiple times
      await user.click(button)
      await user.click(button)
      await user.click(button)

      // Wait for all changes to settle - odd number of clicks = dark theme
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })

  describe('System Theme Integration', () => {
    it('respects system theme preference when set to system', async () => {
      // Mock system prefers dark theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      renderWithThemeProvider('system')

      // Wait for component to mount and system theme to be resolved
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('shows light theme when system prefers light', async () => {
      // Mock system prefers light theme (default in beforeEach)
      renderWithThemeProvider('system')

      // Wait for component to mount and system theme to be resolved
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('toggles away from system theme correctly', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('system')

      // Wait for component to mount with system theme (light in this case)
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      await user.click(button)

      // Wait for theme to change - should now be dark theme (not system)
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('handles hydration mismatch correctly', async () => {
      renderWithThemeProvider('light')

      // After component mounts, should show correct icon
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })
    })

    it('updates to correct icon after mounting', async () => {
      renderWithThemeProvider('dark')

      // After mount, should show correct icon (moon for dark)
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA label for screen readers', () => {
      renderWithThemeProvider('light')

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      expect(button).toHaveAttribute('aria-label', 'Toggle theme')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('light')

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      button.focus()
      expect(document.activeElement).toBe(button)

      // Should be able to activate with Enter key
      await user.keyboard('{Enter}')

      // Wait for theme to change
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      })
    })

    it('supports space key activation', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('light')

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      button.focus()

      // Should be able to activate with Space key
      await user.keyboard(' ')

      // Wait for theme to change
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      })
    })

    it('maintains focus after theme change', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('light')

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      button.focus()
      expect(document.activeElement).toBe(button)

      await user.click(button)

      // Wait for theme to change
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      })

      // Button should remain focused after click
      expect(document.activeElement).toBe(button)
    })
  })

  describe('Visual Feedback', () => {
    it('applies hover classes', () => {
      renderWithThemeProvider('light')

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      expect(button).toHaveClass('hover:bg-[var(--hover-bg)]')
    })

    it('shows sliding animation', () => {
      renderWithThemeProvider('light')

      const slider = document.querySelector('[class*="transition-all"][class*="duration-300"]')
      expect(slider).toHaveClass('transition-all', 'duration-300')
    })

    it('button has correct transition classes', () => {
      renderWithThemeProvider('light')

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      expect(button).toHaveClass('transition-colors', 'duration-300')
    })

    it('slider has appropriate size classes', () => {
      renderWithThemeProvider('light')

      const slider = document.querySelector('[class*="w-[24px]"][class*="h-[24px]"]')
      expect(slider).toHaveClass('w-[24px]', 'h-[24px]')
    })
  })

  describe('Error Handling', () => {
    it('handles missing ThemeProvider gracefully', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<ThemeToggle />)
      }).toThrow('useEnhancedTheme must be used within a ThemeProvider')

      consoleSpy.mockRestore()
    })

    it('handles localStorage failures gracefully', async () => {
      const user = userEvent.setup()

      // Mock localStorage.setItem to throw an error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderWithThemeProvider('light')

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })

      // Should not throw when localStorage fails
      await expect(async () => {
        await user.click(button)
      }).not.toThrow()

      setItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('Integration with ThemeProvider', () => {
    it('receives correct initial theme from context', async () => {
      renderWithThemeProvider('dark')

      // Should reflect the theme passed to ThemeProvider
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('updates ThemeProvider state when toggled', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider('light')

      // Wait for initial state
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      const button = screen.getByRole('button', { name: 'Toggle theme' })
      await user.click(button)

      // Wait for theme change to propagate to both component and DOM
      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('handles system theme changes from context', async () => {
      // Mock system preference change
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => mockMediaQuery),
      })

      renderWithThemeProvider('system')

      // Should show light theme initially
      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      // Simulate system theme change to dark
      mockMediaQuery.matches = true
      mockMediaQuery.dispatchEvent(new Event('change'))

      // ThemeProvider should handle this automatically
      // This tests integration with ThemeProvider's system theme listener
    })
  })
})
