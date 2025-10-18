import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, renderHook, waitFor, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeProvider'

describe('ThemeProvider', () => {
  let localStorageMock: Record<string, string> = {}
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = []

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {}
    global.Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] ?? null)
    global.Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    })
    global.Storage.prototype.removeItem = vi.fn((key: string) => {
      delete localStorageMock[key]
    })

    // Mock matchMedia
    mediaQueryListeners = []
    global.matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners.push(listener)
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof matchMedia
  })

  afterEach(() => {
    vi.clearAllMocks()
    document.documentElement.classList.remove('dark')
  })

  it('initializes with default theme when no stored preference', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    })

    // With auto-detection, theme is set to resolved system theme ('light' based on mock)
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('initializes with stored theme from localStorage', () => {
    localStorageMock['jobhunt-theme'] = 'dark'

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    })

    expect(result.current.theme).toBe('dark')
  })

  it('persists theme to localStorage when setTheme is called', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
    })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorage.setItem).toHaveBeenCalledWith('jobhunt-theme', 'dark')
    expect(result.current.theme).toBe('dark')
  })

  it('updates theme correctly when setTheme is called', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
    })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('resolves system theme to light when system preference is light', () => {
    global.matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof matchMedia

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    })

    // With auto-detection, theme is set to resolved system theme directly
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('resolves system theme to dark when system preference is dark', () => {
    global.matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof matchMedia

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    })

    // With auto-detection, theme is set to resolved system theme directly
    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('applies dark class to document element when theme is dark', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
    })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class from document element when theme is light', () => {
    document.documentElement.classList.add('dark')

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
    })

    act(() => {
      result.current.setTheme('light')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('throws error when useTheme is called outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleError.mockRestore()
  })

  it('updates resolved theme when system preference changes', async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    })

    // With auto-detection, theme is set to 'light' initially
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')

    // Simulate system preference change to dark
    act(() => {
      mediaQueryListeners.forEach(listener => {
        listener({ matches: true } as MediaQueryListEvent)
      })
    })

    await waitFor(() => {
      expect(result.current.resolvedTheme).toBe('dark')
    })
  })

  it('renders children correctly', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <div data-testid="test-child">Test Content</div>
      </ThemeProvider>
    )

    const child = screen.getByTestId('test-child')
    expect(child).toBeDefined()
    expect(child.textContent).toBe('Test Content')
  })
})
