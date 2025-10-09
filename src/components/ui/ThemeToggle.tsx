'use client'

import { useThemeMode } from '@/lib/theme/hooks'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as React from 'react'

export function ThemeToggle() {
  const { setTheme, isDark } = useThemeMode()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after component is mounted
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative w-[60px] h-[30px] rounded-full transition-colors duration-300',
        'bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg)]'
      )}
      aria-label="Toggle theme"
    >
      <div
        className={cn(
          'absolute top-[3px] w-[24px] h-[24px] rounded-full transition-all duration-300 flex items-center justify-center',
          'bg-[var(--text-primary)]',
          isDark ? 'translate-x-[30px]' : 'translate-x-[3px]'
        )}
      >
        {mounted ? (
          isDark ? (
            <Moon className="h-4 w-4 text-[var(--bg-card)]" />
          ) : (
            <Sun className="h-4 w-4 text-[var(--bg-card)]" />
          )
        ) : (
          <Sun className="h-4 w-4 text-[var(--bg-card)]" />
        )}
      </div>
    </button>
  )
}
