'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import type { Theme } from '@/lib/types/theme.types'

const themes = [
  { value: 'light' as Theme, label: 'Light', icon: Sun },
  { value: 'dark' as Theme, label: 'Dark', icon: Moon },
  { value: 'system' as Theme, label: 'System', icon: Monitor },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const currentThemeIcon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }[theme]

  const CurrentIcon = currentThemeIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Choose theme"
          className="relative overflow-hidden transition-all hover:scale-105"
        >
          <CurrentIcon className="h-5 w-5 transition-transform duration-300" />
          <span className="sr-only">Toggle theme menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="min-w-[200px] mt-1">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isActive = theme === themeOption.value

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="flex items-center justify-between gap-2 cursor-pointer"
              aria-label={`Switch to ${themeOption.label.toLowerCase()} theme`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">{themeOption.label}</span>
              </span>
              {isActive && (
                <Check
                  className="h-4 w-4 text-purple-600 dark:text-purple-400"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
