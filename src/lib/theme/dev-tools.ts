/**
 * Theme Developer Tools
 *
 * Provides development utilities for theme debugging,
 * inspection, and validation.
 */

import type { ThemeConfig, SemanticColors, ThemeValidationResult } from '@/lib/types/theme.types'
import { validateTheme } from './validation'

// Theme debugging utility
export class ThemeDebugger {
  private static instance: ThemeDebugger | null = null
  private debugMode: boolean = false

  private constructor() {}

  static getInstance(): ThemeDebugger {
    if (!ThemeDebugger.instance) {
      ThemeDebugger.instance = new ThemeDebugger()
    }
    return ThemeDebugger.instance
  }

  enableDebugMode(): void {
    this.debugMode = true
    console.log('🎨 Theme debugging enabled')
  }

  disableDebugMode(): void {
    this.debugMode = false
    console.log('🎨 Theme debugging disabled')
  }

  logThemeState(config: ThemeConfig, context: string = 'Theme State'): void {
    if (!this.debugMode) return

    console.group(`🎨 ${context}`)
    console.log('Mode:', config.mode)
    console.log('Resolved Mode:', config.resolvedMode)
    console.log('Colors:', config.colors)
    console.log('Border Radius:', config.borderRadius)
    console.groupEnd()
  }

  logColorToken(token: keyof SemanticColors, value: string): void {
    if (!this.debugMode) return

    console.log(`🎨 Color Token: ${token} = ${value}`)
  }

  logValidationResult(result: ThemeValidationResult): void {
    if (!this.debugMode) return

    console.group('🎨 Theme Validation Results')
    console.log('Valid:', result.isValid)

    if (result.errors.length > 0) {
      console.error('Errors:', result.errors)
    }

    if (result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings)
    }

    console.groupEnd()
  }
}

// Theme inspector for browser dev tools
export const inspectTheme = (config: ThemeConfig): void => {
  // @ts-ignore - Dev tool utility
  if (typeof window !== 'undefined' && window.__JOBHUNT_THEME_DEBUG__) {
    console.group('🎨 JobHunt Theme Inspector')
    console.table(config.colors)
    console.log('Theme Config:', config)
    console.groupEnd()

    // Make theme available globally for inspection
    // @ts-ignore
    window.__JOBHUNT_THEME_CONFIG = config
  }
}

// Generate theme color palette for documentation
export const generateColorPalette = (colors: SemanticColors): string => {
  const palette = Object.entries(colors)
    .map(([token, value]) => {
      return `${token}: ${value}`
    })
    .join('\n')

  return `/* JobHunt Theme Color Palette */\n${palette}`
}

// Theme comparison utility
export const compareThemes = (theme1: ThemeConfig, theme2: ThemeConfig): void => {
  console.group('🎨 Theme Comparison')
  console.log('Theme 1:', theme1.mode, theme1.resolvedMode)
  console.log('Theme 2:', theme2.mode, theme2.resolvedMode)

  const colorDifferences: string[] = []

  Object.keys(theme1.colors).forEach(token => {
    const key = token as keyof SemanticColors
    if (theme1.colors[key] !== theme2.colors[key]) {
      colorDifferences.push(`${token}: ${theme1.colors[key]} → ${theme2.colors[key]}`)
    }
  })

  if (colorDifferences.length > 0) {
    console.log('Color Differences:')
    colorDifferences.forEach(diff => console.log(`  ${diff}`))
  } else {
    console.log('No color differences found')
  }

  console.groupEnd()
}

// Theme performance monitor
export const measureThemePerformance = (
  fn: () => void,
  label: string = 'Theme Operation'
): void => {
  const start = performance.now()
  fn()
  const end = performance.now()

  console.log(`🎨 ${label} took ${(end - start).toFixed(2)} milliseconds`)
}

// Development hook for theme validation
export const useThemeValidation = (config: ThemeConfig): ThemeValidationResult => {
  const themeDebugger = ThemeDebugger.getInstance()

  const result = validateTheme(config)
  themeDebugger.logValidationResult(result)

  return result
}

// Theme CSS generator for development
export const generateThemeCSS = (config: ThemeConfig): string => {
  const { colors, borderRadius, fontFamily } = config

  const cssVariables = Object.entries(colors)
    .map(([token, value]) => {
      const cssVar = `--${token.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      return `  ${cssVar}: ${value};`
    })
    .join('\n')

  return `/* Generated Theme CSS - ${config.mode} (${config.resolvedMode}) */\n:root {\n${cssVariables}\n  --border-radius: ${borderRadius};\n  --font-sans: ${fontFamily.sans.join(', ')};\n  --font-serif: ${fontFamily.serif.join(', ')};\n  --font-mono: ${fontFamily.mono.join(', ')};\n}`
}

// Export theme utilities for external use
export const themeDevTools = {
  debugger: ThemeDebugger.getInstance(),
  inspectTheme,
  generateColorPalette,
  compareThemes,
  measureThemePerformance,
  useThemeValidation,
  generateThemeCSS,
}

// Enable debug mode in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.__JOBHUNT_THEME_DEBUG__ = true
  ThemeDebugger.getInstance().enableDebugMode()
}
