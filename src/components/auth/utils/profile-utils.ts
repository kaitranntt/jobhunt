import type { User } from '@supabase/supabase-js'

export function getUserInitials(user: User): string {
  const email = user.email || ''
  const name = email.split('@')[0]
  return name.slice(0, 2).toUpperCase()
}

export function getUserDisplayName(user: User): string {
  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name
  }
  return user.email?.split('@')[0] || 'User'
}

export function getUserAvatarUrl(user: User): string | null {
  return user.user_metadata?.avatar_url || null
}

export function formatUserEmail(user: User): string {
  return user.email || 'unknown@example.com'
}
