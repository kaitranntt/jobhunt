'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-page-bg">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-label-primary">404</h1>
          <h2 className="text-2xl font-semibold text-label-secondary">Page Not Found</h2>
          <p className="text-label-tertiary">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">Go Home</Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
