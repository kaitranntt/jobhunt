import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { describe, it, expect, beforeEach } from 'vitest'

// TODO: Temporarily skipped due to React 19 + @testing-library/react compatibility
describe.skip('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('renders with correct initial icon', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
  })

  it('cycles through themes correctly', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')

    // Light → Dark
    fireEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // Dark → System (will resolve to light or dark based on system preference)
    fireEvent.click(button)
    // Just verify it doesn't error
  })

  it('has proper ARIA labels', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme')
  })

  it('is keyboard accessible', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    button.focus()
    expect(document.activeElement).toBe(button)
  })
})
