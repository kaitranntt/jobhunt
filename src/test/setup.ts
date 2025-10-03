import { vi } from 'vitest'

// Mock matchMedia for ThemeProvider tests
export function setupMatchMedia() {
  const mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = []

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

  return mediaQueryListeners
}
