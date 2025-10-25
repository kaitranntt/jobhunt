import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/button'

// Test component to verify CSS classes are applied correctly
const TestGlassComponent = ({ variant = 'light' }: { variant?: 'light' | 'medium' | 'heavy' }) => (
  <div className={`glass-${variant} p-4 rounded-lg`}>
    <span className="text-label-primary">Test Glass Content</span>
  </div>
)

const TestButtonComponent = () => <Button className="btn-glass">Glass Button</Button>

describe('CSS Optimizations Integration', () => {
  describe('Component Rendering with Optimized Classes', () => {
    it('should render glass components without errors', () => {
      expect(() => {
        render(<TestGlassComponent variant="light" />)
      }).not.toThrow()
    })

    it('should render different glass variants', () => {
      const { rerender } = render(<TestGlassComponent variant="light" />)
      expect(screen.getByText('Test Glass Content')).toBeInTheDocument()

      expect(() => {
        rerender(<TestGlassComponent variant="medium" />)
      }).not.toThrow()

      expect(() => {
        rerender(<TestGlassComponent variant="heavy" />)
      }).not.toThrow()
    })

    it('should render glass button without errors', () => {
      expect(() => {
        render(<TestButtonComponent />)
      }).not.toThrow()
    })

    it('should render button with correct text', () => {
      render(<TestButtonComponent />)
      expect(screen.getByText('Glass Button')).toBeInTheDocument()
    })
  })

  describe('CSS Class Application', () => {
    it('should apply glass-light class correctly', () => {
      const { container } = render(<TestGlassComponent variant="light" />)
      const glassElement = container.querySelector('.glass-light')
      expect(glassElement).toBeInTheDocument()
    })

    it('should apply glass-medium class correctly', () => {
      const { container } = render(<TestGlassComponent variant="medium" />)
      const glassElement = container.querySelector('.glass-medium')
      expect(glassElement).toBeInTheDocument()
    })

    it('should apply glass-heavy class correctly', () => {
      const { container } = render(<TestGlassComponent variant="heavy" />)
      const glassElement = container.querySelector('.glass-heavy')
      expect(glassElement).toBeInTheDocument()
    })

    it('should apply btn-glass class correctly', () => {
      const { container } = render(<TestButtonComponent />)
      const buttonElement = container.querySelector('.btn-glass')
      expect(buttonElement).toBeInTheDocument()
    })
  })

  describe('Text Color Classes', () => {
    it('should apply text-label-primary class', () => {
      const { container } = render(<TestGlassComponent variant="light" />)
      const textElement = container.querySelector('.text-label-primary')
      expect(textElement).toBeInTheDocument()
      expect(textElement).toHaveTextContent('Test Glass Content')
    })
  })

  describe('Multiple Class Combinations', () => {
    it('should handle multiple utility classes together', () => {
      const { container } = render(<TestGlassComponent variant="light" />)
      const glassElement = container.querySelector('.glass-light')

      expect(glassElement).toHaveClass('glass-light', 'p-4', 'rounded-lg')
    })
  })

  describe('Accessibility', () => {
    it('should maintain accessibility attributes', () => {
      render(<TestButtonComponent />)
      const button = screen.getByRole('button', { name: 'Glass Button' })
      expect(button).toBeInTheDocument()
    })
  })
})
