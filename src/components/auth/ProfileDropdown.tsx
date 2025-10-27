'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User, Settings, LogOut, HelpCircle, Loader2 } from 'lucide-react'
import type { ProfileDropdownProps } from './types/profile-dropdown.types'
import {
  getUserInitials,
  getUserDisplayName,
  getUserAvatarUrl,
  formatUserEmail,
} from './utils/profile-utils'
import { useLogout } from '@/hooks/useLogout'

export function ProfileDropdown({
  user,
  className,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
}: ProfileDropdownProps) {
  const { logout, isLoading } = useLogout()

  const userInitials = getUserInitials(user)
  const userDisplayName = getUserDisplayName(user)
  const userAvatarUrl = getUserAvatarUrl(user)
  const userEmail = formatUserEmail(user)

  const handleLogout = async () => {
    await logout()
    // Call the optional callback if provided
    if (onLogoutClick) {
      onLogoutClick()
    }
  }

  const menuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      onClick: onProfileClick || (() => {}),
    },
    {
      id: 'help-center',
      label: 'Help Center',
      icon: HelpCircle,
      onClick: () => {}, // TODO: Implement help navigation
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: onSettingsClick || (() => {}),
    },
    {
      id: 'logout',
      label: isLoading ? 'Signing out...' : 'Logout',
      icon: isLoading ? Loader2 : LogOut,
      onClick: handleLogout,
      variant: 'destructive' as const,
      disabled: isLoading,
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative h-9 px-3 rounded-glass-lg glass-interactive hover:glass-medium',
            'border border-[var(--glass-border-subtle)]',
            'transition-all duration-300',
            'hover:scale-105 active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-[var(--tint-blue)] focus-visible:ring-offset-2',
            'data-[state=open]:glass-heavy',
            'flex items-center gap-2',
            className
          )}
          aria-label={`User menu for ${userDisplayName}`}
          aria-expanded={false}
          aria-haspopup="menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={userAvatarUrl || undefined}
              alt={`${userDisplayName}'s avatar`}
              className="h-7 w-7 rounded-full object-cover"
            />
            <AvatarFallback className="h-7 w-7 rounded-full bg-[var(--tint-blue)] text-white text-sm font-medium flex items-center justify-center">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          <span className="hidden sm:block text-sm font-medium text-[var(--macos-label-primary)]">
            {userDisplayName}
          </span>

          <svg
            className="h-4 w-4 text-[var(--macos-label-secondary)] transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          'w-56 glass-heavy border border-[var(--glass-border-strong)]',
          'backdrop-blur-[30px] saturate-[180%]',
          'shadow-glass-medium',
          'animate-in fade-in-0 zoom-in-95',
          'duration-200'
        )}
        style={{
          backgroundColor: 'var(--glass-heavy)',
          borderColor: 'var(--glass-border-strong)',
        }}
        align="end"
        sideOffset={8}
        role="menu"
        aria-label="User actions menu"
      >
        <DropdownMenuLabel className="font-normal px-3 py-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-[var(--macos-label-primary)]">
              {userDisplayName}
            </p>
            <p className="text-xs leading-none text-[var(--macos-label-secondary)]">{userEmail}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[var(--glass-border-strong)]" />

        {menuItems.map(item => (
          <DropdownMenuItem
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'cursor-pointer px-3 py-2 rounded-sm my-0.5',
              'transition-all duration-200',
              'hover:glass-light hover:translate-x-1',
              'focus:glass-light focus:translate-x-1',
              item.variant === 'destructive'
                ? 'text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400'
                : 'text-[var(--macos-label-primary)]'
            )}
            role="menuitem"
          >
            <item.icon
              className={cn(
                'mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                item.variant === 'destructive'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-[var(--macos-label-secondary)]'
              )}
              aria-hidden="true"
            />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileDropdown
