import type { User } from '@supabase/supabase-js'

// Vibrant preset gradients using macOS 26 design system tints
const VIBRANT_GRADIENTS = [
  // Purple to Blue (like JD avatar)
  {
    primary: 'rgb(var(--tint-purple))',
    secondary: 'rgb(var(--tint-blue))',
    angle: 135,
  },
  // Orange to Red (like SA avatar)
  {
    primary: 'rgb(var(--tint-orange))',
    secondary: 'rgb(var(--tint-red))',
    angle: 135,
  },
  // Teal to Green (like ML avatar)
  {
    primary: 'rgb(var(--tint-teal))',
    secondary: 'rgb(var(--tint-green))',
    angle: 135,
  },
  // Red to Orange (like RB avatar)
  {
    primary: 'rgb(var(--tint-red))',
    secondary: 'rgb(var(--tint-orange))',
    angle: 135,
  },
  // Pink to Purple
  {
    primary: 'rgb(var(--tint-pink))',
    secondary: 'rgb(var(--tint-purple))',
    angle: 120,
  },
  // Yellow to Orange
  {
    primary: 'rgb(var(--tint-yellow))',
    secondary: 'rgb(var(--tint-orange))',
    angle: 145,
  },
  // Teal to Blue
  {
    primary: 'rgb(var(--tint-teal))',
    secondary: 'rgb(var(--tint-blue))',
    angle: 125,
  },
  // Green to Teal
  {
    primary: 'rgb(var(--tint-green))',
    secondary: 'rgb(var(--tint-teal))',
    angle: 160,
  },
  // Indigo to Purple
  {
    primary: 'rgb(var(--tint-indigo))',
    secondary: 'rgb(var(--tint-purple))',
    angle: 140,
  },
]

export interface AvatarColorData {
  primary: string
  secondary: string
  gradient: string
  generatedAt: number
}

// Session storage key format
const SESSION_KEY_PREFIX = 'jobhunt-avatar-color'

function getSessionKey(userId: string): string {
  return `${SESSION_KEY_PREFIX}-${userId}`
}

// Generate a random vibrant gradient
function generateRandomGradient(): AvatarColorData {
  const gradientIndex = Math.floor(Math.random() * VIBRANT_GRADIENTS.length)
  const selectedGradient = VIBRANT_GRADIENTS[gradientIndex]

  // Add random angle variation for more uniqueness
  const angleVariation = Math.floor(Math.random() * 31) - 15 // -15 to +15 degrees
  const finalAngle = selectedGradient.angle + angleVariation

  const gradient = `linear-gradient(${finalAngle}deg, ${selectedGradient.primary} 0%, ${selectedGradient.secondary} 100%)`

  return {
    primary: selectedGradient.primary,
    secondary: selectedGradient.secondary,
    gradient,
    generatedAt: Date.now(),
  }
}

// Get avatar color from session storage or generate new one
export function getSessionAvatarColor(user: User): AvatarColorData {
  if (!user.id) {
    // Fallback to random generation if no user ID
    return generateRandomGradient()
  }

  const sessionKey = getSessionKey(user.id)

  try {
    const stored = sessionStorage.getItem(sessionKey)
    if (stored) {
      const parsed = JSON.parse(stored) as AvatarColorData

      // Validate stored data structure and age (optional: expire after 24 hours)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      if (
        parsed.primary &&
        parsed.secondary &&
        parsed.gradient &&
        Date.now() - parsed.generatedAt < maxAge
      ) {
        return parsed
      }

      // Clear invalid or expired data
      sessionStorage.removeItem(sessionKey)
    }
  } catch (_error) {
    // Clear any corrupted data
    try {
      sessionStorage.removeItem(sessionKey)
    } catch (_cleanupError) {
      // Ignore errors during cleanup
    }
  }

  // Generate new color and store in session
  const newColor = generateRandomGradient()
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify(newColor))
  } catch (error) {
    // Ignore storage errors (e.g., sessionStorage full)
    console.warn('Failed to store avatar color in session:', error)
  }

  return newColor
}

// Clear avatar color from session storage (for logout)
export function clearSessionAvatarColor(user: User): void {
  if (!user.id) return

  const sessionKey = getSessionKey(user.id)
  try {
    sessionStorage.removeItem(sessionKey)
  } catch (error) {
    console.warn('Failed to clear avatar color from session:', error)
  }
}

// Check if user has an existing avatar color in session
export function hasSessionAvatarColor(user: User): boolean {
  if (!user.id) return false

  const sessionKey = getSessionKey(user.id)
  try {
    const stored = sessionStorage.getItem(sessionKey)
    if (!stored) return false

    const parsed = JSON.parse(stored) as AvatarColorData
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    return !!(
      parsed.primary &&
      parsed.secondary &&
      parsed.gradient &&
      Date.now() - parsed.generatedAt < maxAge
    )
  } catch {
    return false
  }
}
