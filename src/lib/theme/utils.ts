/**
 * Theme Utility Functions
 *
 * Provides utility functions for theme manipulation,
 * CSS class generation, and color processing.
 */

import type { SemanticColors, ThemeConfig } from '@/lib/types/theme.types'
import { getCSSVariableName } from './config'
import { parseColor, getContrastRatio } from './validation'

/**
 * Generate CSS custom properties from theme configuration
 * @param config - Theme configuration
 * @returns CSS string with custom properties
 */
export function generateCSSProperties(config: ThemeConfig): string {
  const properties = Object.entries(config.colors)
    .map(([token, value]) => {
      const cssVar = getCSSVariableName(token as keyof SemanticColors)
      return `  ${cssVar}: ${value};`
    })
    .join('\n')

  const additionalProperties = [
    `  --border-radius: ${config.borderRadius};`,
    `  --font-sans: ${config.fontFamily.sans.join(', ')};`,
    `  --font-serif: ${config.fontFamily.serif.join(', ')};`,
    `  --font-mono: ${config.fontFamily.mono.join(', ')};`,
  ].join('\n')

  return `:root {\n${properties}\n${additionalProperties}\n}`
}

/**
 * Generate CSS class with theme-aware styles
 * @param className - Base class name
 * @param styles - Object mapping CSS properties to theme tokens
 * @param config - Theme configuration
 * @returns CSS class string
 */
export function generateThemeClass(
  className: string,
  styles: Record<string, keyof SemanticColors>,
  config: ThemeConfig
): string {
  const styleProperties = Object.entries(styles)
    .map(([property, token]) => {
      const value = config.colors[token]
      // Convert camelCase to kebab-case for CSS properties
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `  ${cssProperty}: ${value};`
    })
    .join('\n')

  return `.${className} {\n${styleProperties}\n}`
}

/**
 * Generate responsive CSS classes for theme modes
 * @param className - Base class name
 * @param lightStyles - Styles for light mode
 * @param darkStyles - Styles for dark mode
 * @param lightConfig - Light theme configuration
 * @param darkConfig - Dark theme configuration
 * @returns CSS string with responsive classes
 */
export function generateResponsiveThemeClasses(
  className: string,
  lightStyles: Record<string, keyof SemanticColors>,
  darkStyles: Record<string, keyof SemanticColors>,
  lightConfig: ThemeConfig,
  darkConfig: ThemeConfig
): string {
  const lightClass = generateThemeClass(className, lightStyles, lightConfig)
  const darkClass = generateThemeClass(`${className}.dark`, darkStyles, darkConfig)

  return `${lightClass}\n${darkClass}`
}

/**
 * Create theme-aware CSS-in-JS object
 * @param styles - Object mapping CSS properties to theme tokens
 * @param config - Theme configuration
 * @returns CSS-in-JS style object
 */
export function createThemeStyles(
  styles: Record<string, keyof SemanticColors>,
  config: ThemeConfig
): Record<string, string> {
  const resolvedStyles: Record<string, string> = {}

  Object.entries(styles).forEach(([property, token]) => {
    resolvedStyles[property] = config.colors[token]
  })

  return resolvedStyles
}

/**
 * Generate Tailwind CSS utilities from theme configuration
 * @param config - Theme configuration
 * @returns Array of Tailwind utility classes
 */
export function generateTailwindUtilities(config: ThemeConfig): string[] {
  const utilities: string[] = []

  // Color utilities
  Object.entries(config.colors).forEach(([token, value]) => {
    const className = token.replace(/([A-Z])/g, '-$1').toLowerCase()
    utilities.push(`.${className} { color: ${value}; }`)
    utilities.push(`.bg-${className} { background-color: ${value}; }`)
    utilities.push(`.border-${className} { border-color: ${value}; }`)
  })

  // Border radius utilities
  utilities.push(`.rounded-theme { border-radius: ${config.borderRadius}; }`)

  // Shadow utilities
  Object.entries(config.shadows).forEach(([name, value]) => {
    utilities.push(`.shadow-${name} { box-shadow: ${value}; }`)
  })

  return utilities
}

/**
 * Calculate color contrast ratio
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Contrast ratio or null if invalid colors
 */
export function calculateContrast(foreground: string, background: string): number | null {
  return getContrastRatio(foreground, background)
}

/**
 * Determine if text color is readable on background
 * @param foreground - Text color
 * @param background - Background color
 * @param threshold - Minimum contrast ratio (default: WCAG AA 4.5)
 * @returns Whether the text is readable
 */
export function isReadableColor(
  foreground: string,
  background: string,
  threshold: number = 4.5
): boolean {
  const ratio = calculateContrast(foreground, background)
  return ratio !== null && ratio >= threshold
}

/**
 * Get optimal text color for a background
 * @param backgroundColor - Background color
 * @param lightColor - Light text color
 * @param darkColor - Dark text color
 * @returns Best text color for the background
 */
export function getOptimalTextColor(
  backgroundColor: string,
  lightColor: string = '#ffffff',
  darkColor: string = '#000000'
): string {
  const lightContrast = calculateContrast(lightColor, backgroundColor)
  const darkContrast = calculateContrast(darkColor, backgroundColor)

  if (lightContrast === null && darkContrast === null) {
    return darkColor
  }

  if (lightContrast === null) {
    return darkColor
  }

  if (darkContrast === null) {
    return lightColor
  }

  return lightContrast > darkContrast ? lightColor : darkColor
}

/**
 * Convert theme colors to different formats
 * @param colors - Theme colors
 * @param format - Target format (hex, rgb, hsl)
 * @returns Colors in specified format
 */
export function convertColorFormat(
  colors: SemanticColors,
  format: 'hex' | 'rgb' | 'hsl'
): SemanticColors {
  const convertedColors = {} as SemanticColors

  Object.entries(colors).forEach(([token, value]) => {
    const parsed = parseColor(value)

    if (!parsed) {
      convertedColors[token as keyof SemanticColors] = value
      return
    }

    switch (format) {
      case 'hex':
        convertedColors[token as keyof SemanticColors] = rgbToHex(parsed.r, parsed.g, parsed.b)
        break
      case 'rgb':
        convertedColors[token as keyof SemanticColors] =
          `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`
        break
      case 'hsl':
        convertedColors[token as keyof SemanticColors] = rgbToHsl(parsed.r, parsed.g, parsed.b)
        break
    }
  })

  return convertedColors
}

/**
 * Convert RGB to HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

/**
 * Create theme animation CSS
 * @param config - Theme configuration
 * @returns CSS animations with theme colors
 */
export function generateThemeAnimations(config: ThemeConfig): string {
  const { colors } = config

  return `
@keyframes theme-pulse {
  0%, 100% { background-color: ${colors.muted}; }
  50% { background-color: ${colors.accent}; }
}

@keyframes theme-slide {
  from {
    background-color: ${colors.background};
    color: ${colors.foreground};
  }
  to {
    background-color: ${colors.accent};
    color: ${colors.accentForeground};
  }
}

.theme-pulse {
  animation: theme-pulse 2s ease-in-out infinite;
}

.theme-slide {
  animation: theme-slide 0.3s ease-out;
}
`
}
