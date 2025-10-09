'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type {
  Theme,
  ResolvedTheme,
  ThemeContextValue,
  EnhancedThemeContextValue,
  ThemeConfig,
  ThemeUtilities,
  ThemeValidationResult,
  ThemeInitOptions,
  SemanticColors,
} from '@/lib/types/theme.types'
import { getThemeConfig, getCSSVariableName } from '@/lib/theme/config'
import { validateTheme } from '@/lib/theme/validation'
import { themeDevTools } from '@/lib/theme/dev-tools'

const ThemeContext = createContext<EnhancedThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'jobhunt-theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  options?: ThemeInitOptions
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  options = {},
}: ThemeProviderProps) {
  const {
    enableSystemDetection = true,
    enableValidation = process.env.NODE_ENV === 'development',
    storageKey = STORAGE_KEY,
  } = options

  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null)
  const [validationResult, setValidationResult] = useState<ThemeValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  })

  // Get system theme preference
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
  }, [])

  // Resolve theme based on user preference
  const resolveTheme = useCallback(
    (currentTheme: Theme): ResolvedTheme => {
      if (currentTheme === 'system') {
        return getSystemTheme()
      }
      return currentTheme
    },
    [getSystemTheme]
  )

  // Apply theme to document and inject CSS variables
  const applyTheme = useCallback(
    (currentTheme: Theme, resolvedTheme: ResolvedTheme) => {
      if (typeof window === 'undefined') return

      const root = document.documentElement
      const config = getThemeConfig(currentTheme, resolvedTheme)

      // Update theme configuration
      setThemeConfig(config)

      // Apply dark mode class
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      // Inject CSS custom properties
      Object.entries(config.colors).forEach(([token, value]) => {
        const cssVar = getCSSVariableName(token as keyof typeof config.colors)
        root.style.setProperty(cssVar, value)
      })

      // Inject other theme properties
      root.style.setProperty('--border-radius', config.borderRadius)
      root.style.setProperty('--font-sans', config.fontFamily.sans.join(', '))
      root.style.setProperty('--font-serif', config.fontFamily.serif.join(', '))
      root.style.setProperty('--font-mono', config.fontFamily.mono.join(', '))

      // Validate theme if enabled
      if (enableValidation) {
        const validation = validateTheme(config)
        setValidationResult(validation)
        themeDevTools.debugger.logValidationResult(validation)
      }

      // Debug logging
      themeDevTools.debugger.logThemeState(
        config,
        `Theme Applied: ${currentTheme} → ${resolvedTheme}`
      )
    },
    [enableValidation]
  )

  // Initialize theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setThemeState(storedTheme)
      const resolved = resolveTheme(storedTheme)
      setResolvedTheme(resolved)
      applyTheme(storedTheme, resolved)
    } else {
      const resolved = resolveTheme(defaultTheme)
      setResolvedTheme(resolved)
      applyTheme(defaultTheme, resolved)
    }
  }, [defaultTheme, storageKey, resolveTheme, applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !enableSystemDetection) return

    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolvedTheme = e.matches ? 'dark' : 'light'
        setResolvedTheme(newResolvedTheme)
        applyTheme(theme, newResolvedTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme, enableSystemDetection])

  // Update theme
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme)
      localStorage.setItem(storageKey, newTheme)
      const resolved = resolveTheme(newTheme)
      setResolvedTheme(resolved)
      applyTheme(newTheme, resolved)
    },
    [storageKey, resolveTheme, applyTheme]
  )

  // Create theme utilities
  const themeUtilities: ThemeUtilities = useMemo(() => {
    if (!themeConfig) {
      // Return fallback utilities
      const fallbackColors: SemanticColors = {
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
        textLight: '#999999',
        borderCustom: '#d0d0d0',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        hoverBg: '#f5f5f5',
        savedColor: '#6b7280',
        appliedColor: '#3b82f6',
        interviewingColor: '#8b5cf6',
        offerColor: '#10b981',
        rejectedColor: '#ef4444',
      }

      return {
        getColor: () => '#000000',
        getComponentColors: () => fallbackColors,
        getCSSVariable: () => '--fallback',
        generateCSSClass: () => '',
      }
    }

    return {
      getColor: (token: keyof typeof themeConfig.colors) => {
        const color = themeConfig.colors[token]
        themeDevTools.debugger.logColorToken(token, color)
        return color
      },
      getComponentColors: (component: keyof typeof themeConfig.components, variant: string) => {
        const componentConfig = themeConfig.components[component]
        if (componentConfig && variant in componentConfig) {
          return componentConfig[variant as keyof typeof componentConfig]
        }
        return themeConfig.colors
      },
      getCSSVariable: (token: keyof typeof themeConfig.colors) => {
        return getCSSVariableName(token)
      },
      generateCSSClass: (styles: Record<string, keyof typeof themeConfig.colors>) => {
        return Object.entries(styles)
          .map(([property, token]) => `${property}: ${themeConfig.colors[token]}`)
          .join('; ')
      },
    }
  }, [themeConfig])

  // Create enhanced context value
  const value: EnhancedThemeContextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      config: themeConfig!,
      setTheme,
      utilities: themeUtilities,
      isValid: validationResult.isValid,
      validationErrors: validationResult.errors,
    }),
    [theme, resolvedTheme, themeConfig, setTheme, themeUtilities, validationResult]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Backward compatibility hook
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Enhanced hook for new theme functionality
export function useEnhancedTheme(): EnhancedThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useEnhancedTheme must be used within a ThemeProvider')
  }
  return context
}
