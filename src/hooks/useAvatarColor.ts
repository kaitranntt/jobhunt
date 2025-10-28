import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getSessionAvatarColor,
  clearSessionAvatarColor,
  hasSessionAvatarColor,
  type AvatarColorData,
} from '@/components/auth/utils/avatar-color'

interface UseAvatarColorReturn {
  avatarColor: AvatarColorData | null
  isLoading: boolean
  error: string | null
  regenerateColor: () => void
  clearColor: () => void
  hasColor: boolean
}

export function useAvatarColor(user: User | null): UseAvatarColorReturn {
  const [avatarColor, setAvatarColor] = useState<AvatarColorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize avatar color when user changes
  useEffect(() => {
    if (!user) {
      setAvatarColor(null)
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const color = getSessionAvatarColor(user)
      setAvatarColor(color)
    } catch (err) {
      console.error('Error getting avatar color:', err)
      setError(err instanceof Error ? err.message : 'Failed to load avatar color')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Regenerate color (useful for manual refresh)
  const regenerateColor = useCallback(() => {
    if (!user) return

    try {
      setError(null)
      const color = getSessionAvatarColor(user)
      setAvatarColor(color)
    } catch (err) {
      console.error('Error regenerating avatar color:', err)
      setError(err instanceof Error ? err.message : 'Failed to regenerate avatar color')
    }
  }, [user])

  // Clear color from session (useful for logout)
  const clearColor = useCallback(() => {
    if (!user) return

    try {
      clearSessionAvatarColor(user)
      setAvatarColor(null)
    } catch (err) {
      console.error('Error clearing avatar color:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear avatar color')
    }
  }, [user])

  // Check if user has a color
  const hasColor = user ? hasSessionAvatarColor(user) : false

  return {
    avatarColor,
    isLoading,
    error,
    regenerateColor,
    clearColor,
    hasColor,
  }
}

// Utility function to get CSS style for avatar
export function getAvatarColorStyle(avatarColor: AvatarColorData | null): React.CSSProperties {
  if (!avatarColor) {
    return {
      background: 'linear-gradient(135deg, #6A5ACD 0%, #4169E1 100%)',
    }
  }

  return {
    background: avatarColor.gradient,
    position: 'relative',
    overflow: 'hidden',
  }
}
