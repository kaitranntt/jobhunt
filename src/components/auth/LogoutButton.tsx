'use client'

import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useLogout'

export function LogoutButton() {
  const { logout, isLoading } = useLogout()

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 glass-interactive"
      onClick={logout}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span className="hidden sm:inline">Logout</span>
    </Button>
  )
}
