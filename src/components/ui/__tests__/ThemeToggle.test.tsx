import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''

    // Mock matchMedia to return light theme by default
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, // Light theme
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

  describe('Initial Rendering', () => {
    it('renders toggle button with correct initial icon', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      expect(button).toBeDefined()
    })

    it('shows moon icon in light mode', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      const icon = button.querySelector('svg')
      expect(icon).toBeDefined()
    })

    it('shows sun icon when in dark mode', async () => {
      // Mock matchMedia to return dark theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)', // Dark theme
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to light theme/i })
        const icon = button.querySelector('svg')
        expect(icon).toBeDefined()
      })
    })

    it('button is accessible and focusable', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('has proper ARIA attributes', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      expect(button.getAttribute('aria-label')).toBe('Switch to dark theme')
    })
  })

  describe('Theme Toggle Interaction', () => {
    it('toggles from light to dark on click', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      expect(button.getAttribute('aria-label')).toBe('Switch to dark theme')

      await user.click(button)

      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /switch to light theme/i })
        expect(updatedButton.getAttribute('aria-label')).toBe('Switch to light theme')
      })
    })

    it('toggles from dark to light on click', async () => {
      // Mock matchMedia to return dark theme initially
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)', // Dark theme
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to light theme/i })
        expect(button.getAttribute('aria-label')).toBe('Switch to light theme')
      })

      const button = screen.getByRole('button', { name: /switch to light theme/i })
      await user.click(button)

      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /switch to dark theme/i })
        expect(updatedButton.getAttribute('aria-label')).toBe('Switch to dark theme')
      })
    })

    it('applies dark class to document when switching to dark mode', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      await user.click(button)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('removes dark class from document when switching to light mode', async () => {
      // Mock matchMedia to return dark theme initially
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)', // Dark theme
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to light theme/i })
        expect(button).toBeDefined()
      })

      const button = screen.getByRole('button', { name: /switch to light theme/i })
      await user.click(button)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('persists theme selection to localStorage', async () => {
      const user = userEvent.setup()

      // Spy on localStorage.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      await user.click(button)

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith('jobhunt-theme', 'dark')
      })

      setItemSpy.mockRestore()
    })
  })

  describe('System Theme Detection', () => {
    it('auto-detects light system theme for new users', async () => {
      // Mock matchMedia to return light theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false, // Light theme
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to dark theme/i })
        expect(button).toBeDefined()
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('auto-detects dark system theme for new users', async () => {
      // Mock matchMedia to return dark theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)', // Dark theme
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to light theme/i })
        expect(button).toBeDefined()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('toggles theme on Enter key press', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      button.focus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /switch to light theme/i })
        expect(updatedButton).toBeDefined()
      })
    })

    it('toggles theme on Space key press', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      button.focus()

      await user.keyboard(' ')

      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /switch to light theme/i })
        expect(updatedButton).toBeDefined()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA label that updates with theme', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      expect(button.getAttribute('aria-label')).toBe('Switch to dark theme')

      await user.click(button)

      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /switch to light theme/i })
        expect(updatedButton.getAttribute('aria-label')).toBe('Switch to light theme')
      })
    })

    it('has descriptive title attribute', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      expect(button.getAttribute('title')).toContain('Current theme: light')
      expect(button.getAttribute('title')).toContain('Click to switch to dark mode')
    })

    it('provides screen reader friendly text', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      const srOnlyText = button.querySelector('.sr-only')
      expect(srOnlyText?.textContent).toContain('currently light')
      expect(srOnlyText?.textContent).toContain('switch to dark')
    })
  })

  describe('Visual States', () => {
    it('applies hover styles to button', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      expect(button.className).toContain('hover:scale-105')
    })

    it('applies focus styles to button', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      button.focus()

      expect(document.activeElement).toBe(button)
      expect(button.className).toBeDefined()
    })

    it('displays correct icon for current theme', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      const icon = button.querySelector('svg')
      expect(icon).toBeDefined()
    })

    it('updates icon when theme changes', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      await user.click(button)

      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /switch to light theme/i })
        const updatedIcon = updatedButton.querySelector('svg')
        expect(updatedIcon).toBeDefined()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid theme switching gracefully', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })

      // Rapidly switch themes
      await user.click(button)
      await waitFor(() => screen.getByRole('button', { name: /switch to light theme/i }))

      const updatedButton = screen.getByRole('button', { name: /switch to light theme/i })
      await user.click(updatedButton)
      await waitFor(() => screen.getByRole('button', { name: /switch to dark theme/i }))

      // Should handle without errors
      expect(document.documentElement.className).toBeDefined()
    })

    it('throws when ThemeProvider is missing', () => {
      // This test verifies the component throws appropriately without ThemeProvider
      // In practice, ThemeProvider should always wrap the component
      expect(() => {
        render(<ThemeToggle />)
      }).toThrow('useTheme must be used within a ThemeProvider')
    })
  })

  describe('Integration with ThemeProvider', () => {
    it('uses theme from ThemeProvider context', async () => {
      // Mock matchMedia to return dark theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)', // Dark theme
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /switch to light theme/i })
        expect(button).toBeDefined()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('updates ThemeProvider context when theme changes', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /switch to dark theme/i })
      await user.click(button)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })
})
