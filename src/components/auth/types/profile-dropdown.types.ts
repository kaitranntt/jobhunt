import type { User } from '@supabase/supabase-js'

export interface ProfileDropdownProps {
  user: User
  className?: string
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onLogoutClick?: () => void
}

export interface UserProfileData {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

export interface DropdownMenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

export interface AvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export type DropdownMenuVariant = 'primary' | 'secondary'
