import { expect, afterEach, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock matchMedia for ThemeProvider
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Ensure proper DOM structure exists for React Testing Library
beforeEach(() => {
  // Create body if it doesn't exist
  if (!document.body) {
    Object.defineProperty(document, 'body', {
      value: document.createElement('body'),
      writable: true,
    })
  }

  // Ensure documentElement has proper structure
  if (!document.documentElement) {
    Object.defineProperty(document, 'documentElement', {
      value: document.createElement('html'),
      writable: true,
    })
  }

  // Ensure proper classList and style properties exist
  if (!document.documentElement.classList) {
    Object.defineProperty(document.documentElement, 'classList', {
      value: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn(),
      },
      writable: true,
    })
  }

  if (!document.documentElement.style) {
    Object.defineProperty(document.documentElement, 'style', {
      value: {
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
        getPropertyValue: vi.fn(),
      },
      writable: true,
    })
  }
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.className = ''
  vi.clearAllMocks()
})
