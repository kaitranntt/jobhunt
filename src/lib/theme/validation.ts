/**
 * Theme Validation Utilities
 *
 * Provides validation for theme configurations to ensure
 * consistency and accessibility compliance.
 */

import type {
  ThemeConfig,
  SemanticColors,
  ThemeValidationResult,
  CSSVariableMapping,
} from '@/lib/types/theme.types'

// Minimum contrast ratios for WCAG compliance
const WCAG_CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
} as const

// Required semantic color tokens
const REQUIRED_SEMANTIC_TOKENS: (keyof SemanticColors)[] = [
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'background',
  'foreground',
  'card',
  'cardForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'destructiveForeground',
  'success',
  'successForeground',
  'warning',
  'warningForeground',
  'info',
  'infoForeground',
  'textPrimary',
  'textSecondary',
  'borderCustom',
  'shadowColor',
  'hoverBg',
]

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Convert HSL to RGB
const hslToRgb = (hsl: string): { r: number; g: number; b: number } | null => {
  const match = hsl.match(/hsl\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\)/)
  if (!match) return null

  const h = parseInt(match[1], 10) / 360
  const s = parseInt(match[2], 10) / 100
  const l = parseInt(match[3], 10) / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

// Parse color value to RGB
const parseColor = (color: string): { r: number; g: number; b: number } | null => {
  if (color.startsWith('#')) {
    return hexToRgb(color)
  }
  if (color.startsWith('hsl')) {
    return hslToRgb(color)
  }
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
      }
    }
  }
  return null
}

// Calculate relative luminance
const getLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const rsRGB = rgb.r / 255
  const gsRGB = rgb.g / 255
  const bsRGB = rgb.b / 255

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Calculate contrast ratio
const getContrastRatio = (color1: string, color2: string): number | null => {
  const rgb1 = parseColor(color1)
  const rgb2 = parseColor(color2)

  if (!rgb1 || !rgb2) return null

  const lum1 = getLuminance(rgb1)
  const lum2 = getLuminance(rgb2)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

// Validate semantic color tokens
const validateSemanticTokens = (colors: SemanticColors): string[] => {
  const errors: string[] = []

  REQUIRED_SEMANTIC_TOKENS.forEach(token => {
    if (!colors[token]) {
      errors.push(`Missing required semantic token: ${token}`)
    } else if (typeof colors[token] !== 'string') {
      errors.push(`Invalid token type for ${token}: expected string`)
    }
  })

  return errors
}

// Validate color contrast ratios
const validateColorContrast = (colors: SemanticColors): string[] => {
  const errors: string[] = []

  // Check critical contrast pairs
  const contrastChecks = [
    { foreground: 'foreground', background: 'background', name: 'Text on background' },
    { foreground: 'primaryForeground', background: 'primary', name: 'Primary text' },
    { foreground: 'secondaryForeground', background: 'secondary', name: 'Secondary text' },
    { foreground: 'cardForeground', background: 'card', name: 'Card text' },
    { foreground: 'destructiveForeground', background: 'destructive', name: 'Destructive text' },
    { foreground: 'successForeground', background: 'success', name: 'Success text' },
    { foreground: 'warningForeground', background: 'warning', name: 'Warning text' },
    { foreground: 'infoForeground', background: 'info', name: 'Info text' },
  ]

  contrastChecks.forEach(({ foreground, background, name }) => {
    const ratio = getContrastRatio(
      colors[foreground as keyof SemanticColors],
      colors[background as keyof SemanticColors]
    )
    if (ratio === null) {
      errors.push(`Could not calculate contrast for ${name}: invalid color format`)
    } else if (ratio < WCAG_CONTRAST_RATIOS.AA_NORMAL) {
      errors.push(`${name} contrast ratio ${ratio.toFixed(2)} is below WCAG AA standard (4.5)`)
    }
  })

  return errors
}

// Validate CSS variable format
const validateCSSVariables = (colors: SemanticColors): string[] => {
  const errors: string[] = []

  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`CSS variable ${key} has invalid value: ${value}`)
    }
  })

  return errors
}

// Main theme validation function
export const validateTheme = (config: ThemeConfig): ThemeValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate basic theme structure
  if (!config.mode) {
    errors.push('Theme mode is required')
  }

  if (!config.resolvedMode) {
    errors.push('Resolved theme mode is required')
  }

  if (!config.colors) {
    errors.push('Theme colors are required')
    return { isValid: false, errors, warnings }
  }

  // Validate semantic tokens
  errors.push(...validateSemanticTokens(config.colors))

  // Validate color contrast
  errors.push(...validateColorContrast(config.colors))

  // Validate CSS variables
  errors.push(...validateCSSVariables(config.colors))

  // Check for common issues (warnings)
  if (config.colors.textPrimary === config.colors.textSecondary) {
    warnings.push('Primary and secondary text colors are identical')
  }

  if (config.colors.background === config.colors.card) {
    warnings.push('Background and card colors are identical - may reduce visual hierarchy')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Validate CSS variable mapping
export const validateCSSVariableMapping = (mapping: CSSVariableMapping): ThemeValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  Object.entries(mapping).forEach(([variable, modes]) => {
    if (!modes.light) {
      errors.push(`Missing light mode value for ${variable}`)
    }
    if (!modes.dark) {
      errors.push(`Missing dark mode value for ${variable}`)
    }

    if (modes.light === modes.dark) {
      warnings.push(`${variable} has identical values in light and dark modes`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Quick validation for development
export const quickThemeValidation = (colors: Partial<SemanticColors>): ThemeValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  if (!colors.primary || !colors.background) {
    errors.push('Primary and background colors are required')
  }

  if (colors.primary && colors.background) {
    const ratio = getContrastRatio(colors.primary, colors.background)
    if (ratio !== null && ratio < 3.0) {
      warnings.push('Primary and background colors may have insufficient contrast')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Export utility functions for external use
export { hexToRgb, hslToRgb, parseColor, getLuminance, getContrastRatio }
