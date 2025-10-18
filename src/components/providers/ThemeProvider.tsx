'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Theme, ResolvedTheme, ThemeContextValue } from '@/lib/types/theme.types'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'jobhunt-theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

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

  // Auto-detect system theme for initial load (if no stored preference)
  const getAutoDetectedTheme = useCallback((): ResolvedTheme => {
    const systemTheme = getSystemTheme()
    return systemTheme // Return 'light' or 'dark' directly instead of 'system'
  }, [getSystemTheme])

  // Apply theme to document
  const applyTheme = useCallback((resolvedTheme: ResolvedTheme) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  // Initialize theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setThemeState(storedTheme)
      const resolved = resolveTheme(storedTheme)
      setResolvedTheme(resolved)
      applyTheme(resolved)
    } else {
      // Auto-detect system theme for first-time users
      const autoDetectedTheme = getAutoDetectedTheme()
      setThemeState(autoDetectedTheme)
      setResolvedTheme(autoDetectedTheme)
      applyTheme(autoDetectedTheme)
    }
  }, [defaultTheme, resolveTheme, applyTheme, getAutoDetectedTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolvedTheme = e.matches ? 'dark' : 'light'
        setResolvedTheme(newResolvedTheme)
        applyTheme(newResolvedTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  // Update theme
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme)
      localStorage.setItem(STORAGE_KEY, newTheme)
      const resolved = resolveTheme(newTheme)
      setResolvedTheme(resolved)
      applyTheme(resolved)
    },
    [resolveTheme, applyTheme]
  )

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
