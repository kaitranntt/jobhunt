/**
 * Unit Tests for Theme Hooks
 */

import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThemeProvider, useEnhancedTheme } from '@/components/providers/ThemeProvider'
import {
  useThemeColor,
  useThemeColors,
  useComponentTheme,
  useCSSVariable,
  useThemeStyles,
  useThemeMode,
  useThemeValidation,
  useThemeConfig,
  useResponsiveTheme,
  useThemeClassName,
} from '../hooks'

describe('Theme Hooks', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage to return null for stored theme
    ;(localStorage.getItem as any).mockReturnValue(null)
  })

  describe('useThemeColor', () => {
    it('should return color value for a token', () => {
      const { result } = renderHook(() => useThemeColor('primary'), { wrapper })

      expect(result.current).toBeDefined()
      expect(typeof result.current).toBe('string')
    })

    it('should throw error when used outside provider', () => {
      expect(() => renderHook(() => useThemeColor('primary'))).toThrow()
    })
  })

  describe('useThemeColors', () => {
    it('should return multiple color values', () => {
      const { result } = renderHook(() => useThemeColors(['primary', 'secondary', 'background']), {
        wrapper,
      })

      expect(result.current).toEqual({
        primary: expect.any(String),
        secondary: expect.any(String),
        background: expect.any(String),
      })
    })

    it('should handle empty array', () => {
      const { result } = renderHook(() => useThemeColors([]), { wrapper })

      expect(result.current).toEqual({})
    })
  })

  describe('useComponentTheme', () => {
    it('should return component-specific colors', () => {
      const { result } = renderHook(() => useComponentTheme('button', 'primary'), { wrapper })

      expect(result.current).toBeDefined()
      expect(typeof result.current).toBe('object')
    })

    it('should use default variant when none specified', () => {
      const { result } = renderHook(() => useComponentTheme('card'), { wrapper })

      expect(result.current).toBeDefined()
    })
  })

  describe('useCSSVariable', () => {
    it('should return CSS variable name', () => {
      const { result } = renderHook(() => useCSSVariable('primary'), { wrapper })

      expect(result.current).toBe('--primary')
    })

    it('should handle different tokens', () => {
      const { result: result1 } = renderHook(() => useCSSVariable('background'), { wrapper })
      const { result: result2 } = renderHook(() => useCSSVariable('textPrimary'), { wrapper })

      expect(result1.current).toBe('--background')
      expect(result2.current).toBe('--text-primary')
    })
  })

  describe('useThemeStyles', () => {
    it('should generate CSS style string', () => {
      const { result } = renderHook(
        () =>
          useThemeStyles({
            backgroundColor: 'primary',
            color: 'primaryForeground',
          }),
        { wrapper }
      )

      expect(result.current).toContain('backgroundColor:')
      expect(result.current).toContain('color:')
    })

    it('should handle empty styles object', () => {
      const { result } = renderHook(() => useThemeStyles({}), { wrapper })

      expect(result.current).toBe('')
    })
  })

  describe('useThemeMode', () => {
    it('should return theme mode information', () => {
      const { result } = renderHook(() => useThemeMode(), { wrapper })

      expect(result.current).toEqual({
        current: 'light',
        resolved: 'light',
        setTheme: expect.any(Function),
        isLight: true,
        isDark: false,
        isSystem: false,
      })
    })

    it('should call setTheme function', () => {
      const { result } = renderHook(() => useThemeMode(), { wrapper })

      result.current.setTheme('dark')
      expect(localStorage.setItem).toHaveBeenCalledWith('jobhunt-theme', 'dark')
    })
  })

  describe('useThemeValidation', () => {
    it('should return validation status', () => {
      const { result } = renderHook(() => useThemeValidation(), { wrapper })

      expect(result.current).toEqual({
        isValid: expect.any(Boolean),
        errors: expect.any(Array),
        hasErrors: expect.any(Boolean),
      })
    })
  })

  describe('useThemeConfig', () => {
    it('should return complete theme configuration', () => {
      const { result } = renderHook(() => useThemeConfig(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.mode).toBe('light')
      expect(result.current.resolvedMode).toBe('light')
      expect(result.current.colors).toBeDefined()
      expect(result.current.components).toBeDefined()
    })
  })

  describe('useResponsiveTheme', () => {
    it('should return value based on current theme', () => {
      const { result } = renderHook(
        () =>
          useResponsiveTheme({
            light: 'light-value',
            dark: 'dark-value',
            system: 'system-value',
          }),
        { wrapper }
      )

      expect(result.current).toBe('light-value')
    })

    it('should fallback to other values', () => {
      const { result } = renderHook(
        () =>
          useResponsiveTheme({
            light: 'light-value',
          }),
        { wrapper }
      )

      expect(result.current).toBe('light-value')
    })

    it('should return undefined when no match', () => {
      const { result } = renderHook(
        () =>
          useResponsiveTheme({
            dark: 'dark-value',
          }),
        { wrapper }
      )

      expect(result.current).toBeUndefined()
    })
  })

  describe('useThemeClassName', () => {
    it('should combine base class with theme class', () => {
      const { result } = renderHook(
        () =>
          useThemeClassName('button', {
            light: 'button-light',
            dark: 'button-dark',
          }),
        { wrapper }
      )

      expect(result.current).toBe('button button-light')
    })

    it('should return base class when no theme classes', () => {
      const { result } = renderHook(() => useThemeClassName('button'), { wrapper })

      expect(result.current).toBe('button')
    })

    it('should handle system theme class', () => {
      const { result } = renderHook(
        () =>
          useThemeClassName('container', {
            system: 'container-system',
          }),
        { wrapper }
      )

      expect(result.current).toBe('container container-system')
    })
  })

  describe('Integration with ThemeProvider', () => {
    it('should provide all theme utilities', () => {
      const { result } = renderHook(() => useEnhancedTheme(), { wrapper })

      expect(result.current).toEqual({
        theme: 'light',
        resolvedTheme: 'light',
        config: expect.any(Object),
        setTheme: expect.any(Function),
        utilities: expect.any(Object),
        isValid: expect.any(Boolean),
        validationErrors: expect.any(Array),
      })
    })
  })
})
