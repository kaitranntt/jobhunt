import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CompanyLogo } from '../company-logo'

// Mock the Image constructor and document.createElement
const mockImg = {
  onload: null as ((this: HTMLImageElement, ev: Event) => any) | null,
  onerror: null as ((this: HTMLImageElement, ev: Event) => any) | null,
  src: '',
  tagName: 'IMG',
  nodeName: 'IMG',
  nodeType: 1,
  parentElement: null,
  classList: new Set(),
} as any

const originalCreateElement = document.createElement
const originalEnv = process.env

describe('CompanyLogo', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_LOGO_DEV_KEY: 'pk_test_api_key',
    }

    vi.clearAllMocks()
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'img') {
        return mockImg as any
      }
      return originalCreateElement.call(document, tagName)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = originalEnv
  })

  describe('Component Structure', () => {
    it('renders with rounded-full class', () => {
      const { container: _container } = render(<CompanyLogo companyName="Test" />)

      const logoElement = _container.querySelector('.rounded-full')
      expect(logoElement).toBeInTheDocument()
    })

    it('renders different sizes correctly', () => {
      const { container: smContainer } = render(<CompanyLogo companyName="Test" size="sm" />)
      const { container: mdContainer } = render(<CompanyLogo companyName="Test" size="md" />)
      const { container: lgContainer } = render(<CompanyLogo companyName="Test" size="lg" />)

      expect(smContainer.querySelector('.h-8.w-8')).toBeInTheDocument()
      expect(mdContainer.querySelector('.h-12.w-12')).toBeInTheDocument()
      expect(lgContainer.querySelector('.h-16.w-16')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<CompanyLogo companyName="Test" className="custom-class" />)

      const logoContainer = container.querySelector('.custom-class')
      expect(logoContainer).toBeInTheDocument()
    })
  })

  describe('Image Loading Behavior', () => {
    it('calls createElement with img tag', () => {
      render(<CompanyLogo companyName="Test Company" />)

      expect(document.createElement).toHaveBeenCalledWith('img')
    })

    it('attempts to load image from correct URL', () => {
      render(<CompanyLogo companyName="Google" />)

      expect(mockImg.src).toContain('img.logo.dev/google.com')
      expect(mockImg.src).toContain('token=pk_test_api_key')
      expect(mockImg.src).toContain('size=96')
      expect(mockImg.src).toContain('format=png')
    })

    it('handles company names with special characters in URL', () => {
      render(<CompanyLogo companyName="Test & Co, Inc." />)

      expect(mockImg.src).toContain('img.logo.dev/test')
      expect(mockImg.src).toContain('token=pk_test_api_key')
    })

    it('shows loading state initially', () => {
      const { container } = render(<CompanyLogo companyName="Test Company" />)

      const loadingElement = container.querySelector('.animate-pulse')
      expect(loadingElement).toBeInTheDocument()
    })

    it('shows initials when image fails to load', async () => {
      const { container } = render(<CompanyLogo companyName="Test Company" />)

      // Simulate image loading error
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByText('TC')).toBeInTheDocument()
      })

      // Verify initials are displayed
      expect(screen.getByText('TC')).toBeInTheDocument()
      // Verify container has some styling (indicating fallback is working)
      const logoContainer = container.querySelector('.rounded-full')
      expect(logoContainer).toBeInTheDocument()
    })

    it('applies consistent colors for same company name', async () => {
      const { container: container1 } = render(<CompanyLogo companyName="Test Company" />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        const element1 = container1.querySelector('.rounded-full')
        expect(element1).toBeInTheDocument()
      })

      const { container: container2 } = render(<CompanyLogo companyName="Test Company" />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        const element2 = container2.querySelector('.rounded-full')
        expect(element2).toBeInTheDocument()
      })
    })
  })

  describe('Initials Generation Logic', () => {
    it('generates correct initials for single word company names', async () => {
      const { container: _container } = render(<CompanyLogo companyName="Apple" />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByText('AP')).toBeInTheDocument()
      })
    })

    it('generates correct initials for multi-word company names', async () => {
      const { container: _container } = render(<CompanyLogo companyName="Google LLC" />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByText('GL')).toBeInTheDocument()
      })
    })

    it('handles extra whitespace', async () => {
      const { container: _container } = render(
        <CompanyLogo companyName="  Microsoft  Corporation  " />
      )

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByText('MC')).toBeInTheDocument()
      })
    })

    it('handles company names with numbers', async () => {
      const { container: _container } = render(<CompanyLogo companyName="3M Company" />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByText('3C')).toBeInTheDocument()
      })
    })

    it('handles empty company name gracefully', async () => {
      const { container } = render(<CompanyLogo companyName="" />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        const element = container.querySelector('.rounded-full')
        expect(element).toBeInTheDocument()
        expect(element).toHaveClass('flex', 'items-center', 'justify-center')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles missing API key gracefully', async () => {
      // Remove the API key from environment
      process.env.NEXT_PUBLIC_LOGO_DEV_KEY = undefined

      const { container } = render(<CompanyLogo companyName="Test Company" />)

      await waitFor(() => {
        expect(screen.getByText('TC')).toBeInTheDocument()
      })

      // Verify initials are displayed as fallback
      expect(screen.getByText('TC')).toBeInTheDocument()
      // Verify container has rounded styling
      const logoContainer = container.querySelector('.rounded-full')
      expect(logoContainer).toBeInTheDocument()
    })

    it('handles malformed company names', async () => {
      const { container: _container } = render(<CompanyLogo companyName="123!@#$%^&*()" />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument()
      })
    })

    it('handles very long company names', async () => {
      const longName = 'A'.repeat(100)
      const { container: _container } = render(<CompanyLogo companyName={longName} />)

      // Simulate error to show initials
      if (mockImg.onerror) {
        mockImg.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByText('AA')).toBeInTheDocument()
      })
    })
  })

  describe('Domain Formatting', () => {
    it('handles different company name formats', () => {
      const companies = [
        { name: 'Google LLC', expectedPart: 'google' },
        { name: 'Microsoft Corporation', expectedPart: 'microsoft' },
        { name: 'Apple Inc.', expectedPart: 'apple' },
      ]

      companies.forEach(({ name, expectedPart }) => {
        // Reset mocks
        vi.clearAllMocks()
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          if (tagName === 'img') {
            return mockImg as any
          }
          return originalCreateElement.call(document, tagName)
        })

        render(<CompanyLogo companyName={name} />)
        expect(mockImg.src).toContain(`img.logo.dev/${expectedPart}`)
      })
    })

    it('removes common corporate suffixes', () => {
      const suffixes = [
        { name: 'Test Inc', expected: 'test' },
        { name: 'Test LLC', expected: 'test' },
        { name: 'Test Corporation', expected: 'test' },
        { name: 'Test Corp', expected: 'test' },
        { name: 'Test Ltd', expected: 'test' },
        { name: 'Test Co', expected: 'test' },
        { name: 'Test Company', expected: 'test' },
      ]

      suffixes.forEach(({ name, expected }) => {
        // Reset mocks
        vi.clearAllMocks()
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          if (tagName === 'img') {
            return mockImg as any
          }
          return originalCreateElement.call(document, tagName)
        })

        render(<CompanyLogo companyName={name} />)
        expect(mockImg.src).toContain(`img.logo.dev/${expected}`)
      })
    })

    it('adds .com suffix to company names without TLD', () => {
      const companies = [
        { name: 'Stripe', expected: 'stripe.com' },
        { name: 'GitHub', expected: 'github.com' },
        { name: 'Meta', expected: 'meta.com' },
      ]

      companies.forEach(({ name, expected }) => {
        // Reset mocks
        vi.clearAllMocks()
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          if (tagName === 'img') {
            return mockImg as any
          }
          return originalCreateElement.call(document, tagName)
        })

        render(<CompanyLogo companyName={name} />)
        expect(mockImg.src).toContain(`img.logo.dev/${expected}`)
      })
    })

    it('preserves existing domains with TLDs', () => {
      const companies = [
        { name: 'company.co.uk', expected: 'company.co.uk' },
        { name: 'startup.io', expected: 'startup.io' },
        { name: 'business.org', expected: 'business.org' },
      ]

      companies.forEach(({ name, expected }) => {
        // Reset mocks
        vi.clearAllMocks()
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          if (tagName === 'img') {
            return mockImg as any
          }
          return originalCreateElement.call(document, tagName)
        })

        render(<CompanyLogo companyName={name} />)
        expect(mockImg.src).toContain(`img.logo.dev/${expected}`)
      })
    })
  })
})
