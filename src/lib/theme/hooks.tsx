'use client'

/**
 * Theme Hooks for Component Usage
 *
 * Provides convenient hooks for components to consume theme values
 * with type safety and performance optimization.
 */

import { useMemo } from 'react'
import { useEnhancedTheme } from '@/components/providers/ThemeProvider'
import type { SemanticColors, ComponentTokens } from '@/lib/types/theme.types'

/**
 * Hook to get a specific theme color
 * @param token - The semantic color token to retrieve
 * @returns The color value
 */
export function useThemeColor(token: keyof SemanticColors): string {
  const { utilities } = useEnhancedTheme()

  return useMemo(() => {
    return utilities.getColor(token)
  }, [utilities, token])
}

/**
 * Hook to get multiple theme colors at once
 * @param tokens - Array of semantic color tokens to retrieve
 * @returns Object with the requested color values
 */
export function useThemeColors<T extends keyof SemanticColors>(
  tokens: T[]
): Pick<SemanticColors, T> {
  const { utilities } = useEnhancedTheme()

  return useMemo(() => {
    const colors = {} as Pick<SemanticColors, T>

    tokens.forEach(token => {
      colors[token] = utilities.getColor(token)
    })

    return colors
  }, [utilities, tokens])
}

/**
 * Hook to get component-specific theme colors
 * @param component - The component type (button, card, input)
 * @param variant - The component variant
 * @returns Component-specific colors
 */
export function useComponentTheme(
  component: keyof ComponentTokens,
  variant: string = 'default'
): SemanticColors {
  const { utilities } = useEnhancedTheme()

  return useMemo(() => {
    return utilities.getComponentColors(component, variant)
  }, [utilities, component, variant])
}

/**
 * Hook to get CSS variable name for a theme token
 * @param token - The semantic color token
 * @returns CSS variable name
 */
export function useCSSVariable(token: keyof SemanticColors): string {
  const { utilities } = useEnhancedTheme()

  return useMemo(() => {
    return utilities.getCSSVariable(token)
  }, [utilities, token])
}

/**
 * Hook to generate CSS styles from theme tokens
 * @param styles - Object mapping CSS properties to theme tokens
 * @returns CSS style string
 */
export function useThemeStyles(styles: Record<string, keyof SemanticColors>): string {
  const { utilities } = useEnhancedTheme()

  return useMemo(() => {
    return utilities.generateCSSClass(styles)
  }, [utilities, styles])
}

/**
 * Hook to get current theme mode information
 * @returns Theme mode and resolved mode
 */
export function useThemeMode() {
  const { theme, resolvedTheme, setTheme } = useEnhancedTheme()

  return useMemo(
    () => ({
      current: theme,
      resolved: resolvedTheme,
      setTheme,
      isLight: resolvedTheme === 'light',
      isDark: resolvedTheme === 'dark',
      isSystem: theme === 'system',
    }),
    [theme, resolvedTheme, setTheme]
  )
}

/**
 * Hook for theme validation status
 * @returns Theme validation state and errors
 */
export function useThemeValidation() {
  const { isValid, validationErrors } = useEnhancedTheme()

  return useMemo(
    () => ({
      isValid,
      errors: validationErrors,
      hasErrors: validationErrors.length > 0,
    }),
    [isValid, validationErrors]
  )
}

/**
 * Hook to get theme configuration
 * @returns Complete theme configuration
 */
export function useThemeConfig() {
  const { config } = useEnhancedTheme()

  return useMemo(() => config, [config])
}

/**
 * Hook for responsive theme-aware values
 * @param values - Object mapping theme modes to values
 * @returns Value based on current theme mode
 */
export function useResponsiveTheme<T>(values: { light?: T; dark?: T; system?: T }): T | undefined {
  const { theme, resolvedTheme } = useEnhancedTheme()

  return useMemo(() => {
    if (values[resolvedTheme]) {
      return values[resolvedTheme]
    }
    if (values.light && resolvedTheme === 'light') {
      return values.light
    }
    if (values.dark && resolvedTheme === 'dark') {
      return values.dark
    }
    return values.system
  }, [values, theme, resolvedTheme])
}

/**
 * Hook for theme-aware className generation
 * @param baseClass - Base CSS class
 * @param themeClasses - Object mapping theme modes to CSS classes
 * @returns Combined className string
 */
export function useThemeClassName(
  baseClass: string,
  themeClasses?: {
    light?: string
    dark?: string
    system?: string
  }
): string {
  const { resolvedTheme } = useEnhancedTheme()

  return useMemo(() => {
    const classes = [baseClass]

    if (themeClasses?.light && resolvedTheme === 'light') {
      classes.push(themeClasses.light)
    } else if (themeClasses?.dark && resolvedTheme === 'dark') {
      classes.push(themeClasses.dark)
    } else if (themeClasses?.system) {
      classes.push(themeClasses.system)
    }

    return classes.join(' ')
  }, [baseClass, themeClasses, resolvedTheme])
}
