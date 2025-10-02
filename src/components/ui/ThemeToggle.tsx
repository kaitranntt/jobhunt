'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { Theme } from '@/lib/types/theme.types'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    }
    setTheme(nextTheme[theme])
  }

  const ThemeIcon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }[theme]

  const themeLabels: Record<Theme, string> = {
    light: 'Switch to dark theme',
    dark: 'Switch to system theme',
    system: 'Switch to light theme',
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={themeLabels[theme]}
      className="relative overflow-hidden transition-transform hover:scale-105"
    >
      <ThemeIcon className="h-5 w-5 transition-transform duration-300" />
      <span className="sr-only">{themeLabels[theme]}</span>
    </Button>
  )
}
