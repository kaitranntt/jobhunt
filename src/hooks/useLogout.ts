'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearSessionAvatarColor } from '@/components/auth/utils/avatar-color'

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const logout = async () => {
    try {
      setIsLoading(true)

      // Get current user before logout to clear their avatar color
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Clear avatar color from session storage before logout
      if (user) {
        clearSessionAvatarColor(user)
      }

      // Call the signout API route
      const response = await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      // The API route will handle redirection, but we'll also handle it client-side
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force redirect to login page
      window.location.href = '/login'
    } finally {
      setIsLoading(false)
    }
  }

  return {
    logout,
    isLoading,
  }
}
