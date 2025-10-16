import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Import Supabase mocks to set them up globally
import './src/test/mocks/supabase'

expect.extend(matchers)

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.className = ''
  vi.clearAllMocks()
})
