'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CompanyLogoProps {
  companyName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
}

const formatCompanyDomain = (companyName: string): string => {
  // Clean up company name for domain lookup
  let domain = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-.]/g, '') // Remove special characters except hyphens and dots
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .replace(/\s+/g, '') // Remove spaces for domain
    .replace(/\s+(corporation|corp|inc|incorporated|llc|ltd|limited|co|company)\s+/g, '') // Remove suffixes with spaces
    .replace(/\s+(corporation|corp|inc|incorporated|llc|ltd|limited|co|company)$/g, '') // Remove suffixes at end
    .replace(/^(corporation|corp|inc|incorporated|llc|ltd|limited|co|company)\s+/g, '') // Remove suffixes at start
    .replace(/&/g, '') // Remove ampersands

  // If domain doesn't have a TLD, add .com as default
  if (domain && !domain.includes('.') && domain !== 'unknown') {
    domain = `${domain}.com`
  }

  return domain || 'unknown.com'
}

const getInitials = (companyName: string): string => {
  const words = companyName.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

const getConsistentColor = (companyName: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-pink-500',
  ]

  let hash = 0
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

export function CompanyLogo({ companyName, size = 'md', className }: CompanyLogoProps) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [imageError, setImageError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const domain = formatCompanyDomain(companyName)
  const sizeClass = sizeClasses[size]
  const initials = getInitials(companyName)
  const backgroundColor = getConsistentColor(companyName)

  React.useEffect(() => {
    if (!domain || domain === 'unknown') {
      setImageError(true)
      return
    }

    setIsLoading(true)
    setImageError(false)

    // Get logo.dev API key from environment
    const apiKey = process.env.NEXT_PUBLIC_LOGO_DEV_KEY
    if (!apiKey) {
      console.warn('Logo.dev API key not found in environment variables')
      setImageError(true)
      setIsLoading(false)
      return
    }

    // Build logo.dev URL with authentication
    const sizeMap = { sm: 64, md: 96, lg: 128 }
    const logoSize = sizeMap[size]
    const logoUrl = `https://img.logo.dev/${domain}?token=${apiKey}&size=${logoSize}&format=png`

    // Create a new image to test if the URL loads successfully
    const img = document.createElement('img')
    img.onload = () => {
      setImageUrl(logoUrl)
      setIsLoading(false)
    }
    img.onerror = () => {
      setImageError(true)
      setIsLoading(false)
    }
    img.src = logoUrl

    // Cleanup function to prevent memory leaks
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [domain, size])

  if (isLoading) {
    return <div className={cn('rounded-full animate-pulse glass-medium', sizeClass, className)} />
  }

  if (imageError || !imageUrl) {
    // Fallback to initials
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-medium shadow-glass-soft',
          sizeClass,
          backgroundColor,
          className
        )}
      >
        {initials}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden shadow-glass-soft relative',
        sizeClass,
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={`${companyName} logo`}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  )
}

CompanyLogo.displayName = 'CompanyLogo'
