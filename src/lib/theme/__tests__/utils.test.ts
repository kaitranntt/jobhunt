/**
 * Unit Tests for Theme Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateCSSProperties,
  generateThemeClass,
  createThemeStyles,
  calculateContrast,
  isReadableColor,
  getOptimalTextColor,
  convertColorFormat,
  generateTailwindUtilities,
} from '../utils'
import type { ThemeConfig, SemanticColors } from '@/lib/types/theme.types'

describe('Theme Utilities', () => {
  let mockConfig: ThemeConfig

  beforeEach(() => {
    mockConfig = {
      mode: 'light',
      resolvedMode: 'light',
      colors: {
        primary: '#000000',
        primaryForeground: '#ffffff',
        secondary: '#f0f0f0',
        secondaryForeground: '#000000',
        background: '#ffffff',
        foreground: '#000000',
        card: '#ffffff',
        cardForeground: '#000000',
        popover: '#ffffff',
        popoverForeground: '#000000',
        muted: '#f8f8f8',
        mutedForeground: '#666666',
        accent: '#e0e0e0',
        accentForeground: '#000000',
        input: '#e0e0e0',
        border: '#d0d0d0',
        ring: '#000000',
        destructive: '#ff0000',
        destructiveForeground: '#ffffff',
        success: '#00ff00',
        successForeground: '#000000',
        warning: '#ffff00',
        warningForeground: '#000000',
        info: '#0000ff',
        infoForeground: '#ffffff',
        textPrimary: '#000000',
        textSecondary: '#666666',
        textLight: '#ffffff',
        borderCustom: '#d0d0d0',
        shadowColor: 'rgba(0,0,0,0.1)',
        hoverBg: '#f0f0f0',
        savedColor: '#9e9e9e',
        appliedColor: '#5c6bc0',
        interviewingColor: '#ffb300',
        offerColor: '#66bb6a',
        rejectedColor: '#ef5350',
      } as SemanticColors,
      components: {
        button: {
          primary: {} as SemanticColors,
          secondary: {} as SemanticColors,
          destructive: {} as SemanticColors,
          outline: {} as SemanticColors,
          ghost: {} as SemanticColors,
          link: {} as SemanticColors,
        },
        card: {
          default: {} as SemanticColors,
          elevated: {} as SemanticColors,
          outlined: {} as SemanticColors,
        },
        input: {
          default: {} as SemanticColors,
          error: {} as SemanticColors,
          focus: {} as SemanticColors,
        },
      },
      borderRadius: '0.5rem',
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Monaco', 'monospace'],
      },
      shadows: {
        subtle: '0 2px 8px rgba(0,0,0,0.1)',
        medium: '0 8px 32px rgba(0,0,0,0.1)',
        strong: '0 16px 64px rgba(0,0,0,0.1)',
      },
    }
  })

  describe('generateCSSProperties', () => {
    it('should generate CSS custom properties', () => {
      const result = generateCSSProperties(mockConfig)

      expect(result).toContain(':root {')
      expect(result).toContain('--primary: #000000;')
      expect(result).toContain('--background: #ffffff;')
      expect(result).toContain('--border-radius: 0.5rem;')
      expect(result).toContain('--font-sans: Inter, sans-serif;')
      expect(result).toContain('}')
    })
  })

  describe('generateThemeClass', () => {
    it('should generate CSS class with theme styles', () => {
      const styles = {
        backgroundColor: 'primary' as const,
        color: 'primaryForeground' as const,
      }

      const result = generateThemeClass('test-button', styles, mockConfig)

      expect(result).toContain('.test-button {')
      expect(result).toContain('background-color: #000000;')
      expect(result).toContain('color: #ffffff;')
      expect(result).toContain('}')
    })
  })

  describe('createThemeStyles', () => {
    it('should create CSS-in-JS style object', () => {
      const styles = {
        backgroundColor: 'primary' as const,
        color: 'textPrimary' as const,
      }

      const result = createThemeStyles(styles, mockConfig)

      expect(result).toEqual({
        backgroundColor: '#000000',
        color: '#000000',
      })
    })
  })

  describe('calculateContrast', () => {
    it('should calculate contrast ratio for valid colors', () => {
      const result = calculateContrast('#000000', '#ffffff')
      expect(result).toBe(21) // Maximum contrast
    })

    it('should return null for invalid colors', () => {
      const result = calculateContrast('invalid', '#ffffff')
      expect(result).toBeNull()
    })
  })

  describe('isReadableColor', () => {
    it('should determine readability for high contrast', () => {
      const result = isReadableColor('#000000', '#ffffff')
      expect(result).toBe(true)
    })

    it('should determine readability for low contrast', () => {
      const result = isReadableColor('#cccccc', '#ffffff', 4.5)
      expect(result).toBe(false)
    })

    it('should handle custom threshold', () => {
      const result = isReadableColor('#666666', '#ffffff', 3.0)
      expect(result).toBe(true)
    })
  })

  describe('getOptimalTextColor', () => {
    it('should return light text on dark background', () => {
      const result = getOptimalTextColor('#000000')
      expect(result).toBe('#ffffff')
    })

    it('should return dark text on light background', () => {
      const result = getOptimalTextColor('#ffffff')
      expect(result).toBe('#000000')
    })

    it('should use custom colors', () => {
      const result = getOptimalTextColor('#000000', '#ffff00', '#0000ff')
      expect(result).toBe('#ffff00')
    })
  })

  describe('convertColorFormat', () => {
    it('should convert to hex format', () => {
      const colors = { primary: 'rgb(0, 0, 0)' } as SemanticColors
      const result = convertColorFormat(colors, 'hex')

      expect(result.primary).toBe('#000000')
    })

    it('should convert to rgb format', () => {
      const colors = { primary: '#000000' } as SemanticColors
      const result = convertColorFormat(colors, 'rgb')

      expect(result.primary).toBe('rgb(0, 0, 0)')
    })

    it('should handle invalid colors', () => {
      const colors = { primary: 'invalid' } as SemanticColors
      const result = convertColorFormat(colors, 'hex')

      expect(result.primary).toBe('invalid')
    })
  })

  describe('generateTailwindUtilities', () => {
    it('should generate Tailwind utility classes', () => {
      const result = generateTailwindUtilities(mockConfig)

      expect(result).toContain('.primary { color: #000000; }')
      expect(result).toContain('.bg-primary { background-color: #000000; }')
      expect(result).toContain('.border-primary { border-color: #000000; }')
      expect(result).toContain('.rounded-theme { border-radius: 0.5rem; }')
      expect(result).toContain('.shadow-subtle { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }')
    })

    it('should include all color utilities', () => {
      const result = generateTailwindUtilities(mockConfig)

      // Check for a variety of color tokens
      expect(result).toContain('.text-primary { color: #000000; }')
      expect(result).toContain('.bg-secondary { background-color: #f0f0f0; }')
      expect(result).toContain('.border-destructive { border-color: #ff0000; }')
    })
  })
})
