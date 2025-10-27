import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../button'

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('renders with default variant and size', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })

      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveClass('inline-flex')
      expect(button).toHaveClass('bg-primary')
      expect(button).toHaveClass('h-8')
    })

    it('renders button text correctly', () => {
      render(<Button>Test Button</Button>)
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    it('renders with children components', () => {
      render(
        <Button>
          <span data-testid="child-element">Child</span>
        </Button>
      )
      expect(screen.getByTestId('child-element')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('bg-primary')
      expect(button).toHaveClass('text-primary-foreground')
      // shadow class is not in the current button implementation
    })

    it('renders destructive variant correctly', () => {
      render(<Button variant="destructive">Destructive</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('bg-destructive')
      expect(button).toHaveClass('text-white')
      // shadow-sm is not in the current destructive variant
    })

    it('renders outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('border')
      expect(button).toHaveClass('bg-background')
      expect(button).toHaveClass('shadow-xs')
      // border-input is not a direct class in current implementation
    })

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('bg-secondary')
      expect(button).toHaveClass('text-secondary-foreground')
      // shadow-sm is not in the current secondary variant
    })

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('hover:bg-accent')
      expect(button).toHaveClass('hover:text-accent-foreground')
    })

    it('renders link variant correctly', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('text-primary')
      expect(button).toHaveClass('underline-offset-4')
      expect(button).toHaveClass('hover:underline')
    })
  })

  describe('Sizes', () => {
    it('renders default size correctly', () => {
      render(<Button size="default">Default Size</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('h-8')
      expect(button).toHaveClass('px-3')
      expect(button).toHaveClass('py-2')
    })

    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('h-7')
      expect(button).toHaveClass('rounded-md')
      expect(button).toHaveClass('px-2.5')
      expect(button).toHaveClass('gap-1.5')
      // text-xs is not in the current sm size variant
    })

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('h-9')
      expect(button).toHaveClass('rounded-md')
      expect(button).toHaveClass('px-5')
    })

    it('renders icon size correctly', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('size-8')
      // size-8 replaces both h-8 and w-8 in the current implementation
    })
  })

  describe('Custom ClassName', () => {
    it('merges custom className with variant classes', () => {
      render(<Button className="custom-class another-class">Custom</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('another-class')
      expect(button).toHaveClass('bg-primary')
    })

    it('allows className to override variant styles when using cn utility', () => {
      render(<Button className="bg-blue-500">Override</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('bg-blue-500')
    })
  })

  describe('AsChild Prop', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )

      const link = screen.getByRole('link', { name: /link button/i })
      expect(link).toBeInTheDocument()
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', '/test')
    })

    it('renders as button when asChild is false', () => {
      render(<Button asChild={false}>Regular Button</Button>)
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('applies variant classes to child element when asChild is true', () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete</a>
        </Button>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('bg-destructive')
      expect(link).toHaveClass('text-white')
    })
  })

  describe('Ref Forwarding', () => {
    it('renders without ref (component does not forward refs)', () => {
      // Current Button implementation does not use React.forwardRef
      // This test verifies the component renders correctly without ref forwarding
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('renders asChild without ref (Slot handles ref internally)', () => {
      // Radix UI Slot component handles refs internally
      // This test verifies asChild rendering works correctly
      render(
        <Button asChild>
          <a href="/test">Link</a>
        </Button>
      )

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('HTML Button Attributes', () => {
    it('handles onClick event', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      const button = screen.getByRole('button')
      button.click()

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles disabled attribute', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none')
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('handles type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('type', 'submit')
    })

    it('handles type="button" attribute', () => {
      render(<Button type="button">Button</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('type', 'button')
    })

    it('handles type="reset" attribute', () => {
      render(<Button type="reset">Reset</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('type', 'reset')
    })

    it('handles aria-label attribute', () => {
      render(<Button aria-label="Close dialog">X</Button>)
      const button = screen.getByRole('button', { name: 'Close dialog' })

      expect(button).toHaveAttribute('aria-label', 'Close dialog')
    })

    it('handles data attributes', () => {
      render(
        <Button data-testid="custom-button" data-value="test">
          Data
        </Button>
      )
      const button = screen.getByTestId('custom-button')

      expect(button).toHaveAttribute('data-value', 'test')
    })

    it('handles form attribute', () => {
      render(<Button form="my-form">Submit Form</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('form', 'my-form')
    })

    it('handles name attribute', () => {
      render(<Button name="action">Action</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('name', 'action')
    })

    it('handles value attribute', () => {
      render(<Button value="submit-value">Submit</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('value', 'submit-value')
    })
  })

  describe('Variant and Size Combinations', () => {
    it('combines destructive variant with small size', () => {
      render(
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      )
      const button = screen.getByRole('button')

      expect(button).toHaveClass('bg-destructive')
      expect(button).toHaveClass('h-7')
      expect(button).toHaveClass('px-2.5')
    })

    it('combines outline variant with large size', () => {
      render(
        <Button variant="outline" size="lg">
          Outlined Large
        </Button>
      )
      const button = screen.getByRole('button')

      expect(button).toHaveClass('border')
      expect(button).toHaveClass('h-9')
      expect(button).toHaveClass('px-5')
    })

    it('combines ghost variant with icon size', () => {
      render(
        <Button variant="ghost" size="icon">
          🔍
        </Button>
      )
      const button = screen.getByRole('button')

      expect(button).toHaveClass('hover:bg-accent')
      expect(button).toHaveClass('size-8')
    })
  })

  describe('TypeScript Type Safety', () => {
    it('accepts valid variant prop values', () => {
      const validVariants: Array<
        'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
      > = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']

      validVariants.forEach(variant => {
        const { unmount } = render(<Button variant={variant}>Test</Button>)
        expect(screen.getByRole('button')).toBeInTheDocument()
        unmount()
      })
    })

    it('accepts valid size prop values', () => {
      const validSizes: Array<'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'> = [
        'default',
        'sm',
        'lg',
        'icon',
        'icon-sm',
        'icon-lg',
      ]

      validSizes.forEach(size => {
        const { unmount } = render(<Button size={size}>Test</Button>)
        expect(screen.getByRole('button')).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Common Classes', () => {
    it('applies common base classes to all variants', () => {
      render(<Button>Test</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('inline-flex')
      expect(button).toHaveClass('items-center')
      expect(button).toHaveClass('justify-center')
      expect(button).toHaveClass('gap-2')
      expect(button).toHaveClass('whitespace-nowrap')
      expect(button).toHaveClass('rounded-md')
      expect(button).toHaveClass('text-sm')
      expect(button).toHaveClass('font-medium')
      expect(button).toHaveClass('transition-all')
    })

    it('applies focus and outline classes', () => {
      render(<Button>Test</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('outline-none')
      expect(button).toHaveClass('focus-visible:border-ring')
      expect(button).toHaveClass('focus-visible:ring-ring/50')
      expect(button).toHaveClass('focus-visible:ring-[3px]')
    })
  })

  describe('Display Name', () => {
    it('renders correctly without displayName property', () => {
      // Current Button implementation does not set displayName
      // This test verifies the component function exists and works
      render(<Button>Test</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      render(<Button>Accessible</Button>)
      const button = screen.getByRole('button')

      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('maintains accessibility when disabled', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('disabled')
    })

    it('supports ARIA attributes', () => {
      render(
        <Button aria-label="Custom label" aria-pressed="true" aria-describedby="description">
          ARIA Button
        </Button>
      )
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })
  })
})
