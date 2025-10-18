'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const CurrentIcon = resolvedTheme === 'dark' ? Sun : Moon

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
      className="relative overflow-hidden transition-all hover:scale-105"
      title={`Current theme: ${resolvedTheme}. Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode.`}
    >
      <CurrentIcon className="h-5 w-5 transition-transform duration-300" />
      <span className="sr-only">
        Toggle theme (currently {resolvedTheme}, click to switch to{' '}
        {resolvedTheme === 'dark' ? 'light' : 'dark'})
      </span>
    </Button>
  )
}
