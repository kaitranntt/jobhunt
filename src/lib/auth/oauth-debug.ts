/**
 * OAuth Debug Utilities
 * Comprehensive debugging utilities for OAuth authentication flow
 */

export interface OAuthDebugInfo {
  timestamp: string
  step: string
  data: unknown
  environment: string
  userAgent?: string
  ip?: string
}

export class OAuthDebugger {
  private static logs: OAuthDebugInfo[] = []

  static log(step: string, data: any, userAgent?: string) {
    const logEntry: OAuthDebugInfo = {
      timestamp: new Date().toISOString(),
      step,
      data,
      environment: process.env.NODE_ENV || 'unknown',
      userAgent,
    }

    this.logs.push(logEntry)

    // Log to console with structured format
    console.log(`[OAuth Debug - ${step}]:`, JSON.stringify(data, null, 2))

    // In development, also log additional details
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OAuth Debug Environment]:`, {
        nodeEnv: process.env.NODE_ENV,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      })
    }
  }

  static getLogs(): OAuthDebugInfo[] {
    return [...this.logs]
  }

  static clearLogs() {
    this.logs = []
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export function validateOAuthConfiguration() {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
  }

  const issues: string[] = []

  if (!config.supabaseUrl) {
    issues.push('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!config.siteUrl) {
    issues.push('Missing NEXT_PUBLIC_SITE_URL')
  }

  if (!config.supabaseAnonKey) {
    issues.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const isValid = issues.length === 0

  OAuthDebugger.log('Configuration Validation', {
    config: {
      ...config,
      supabaseAnonKey: config.supabaseAnonKey ? '***present***' : 'missing',
    },
    issues,
    isValid,
  })

  return { isValid, issues, config }
}

export function buildCallbackUrls(): { allowed: string[]; missing: string[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const allowedUrls: string[] = []
  const missingUrls: string[] = []

  if (siteUrl) {
    // Standard callback URL
    allowedUrls.push(`${siteUrl}/auth/callback`)

    // Development variations
    if (siteUrl.includes('localhost')) {
      allowedUrls.push(siteUrl.replace('http://', 'https://'))
      allowedUrls.push(siteUrl.replace('localhost', '127.0.0.1'))
    }

    // Production variations
    if (siteUrl.includes('jobhunt.kaitran.ca')) {
      allowedUrls.push(`${siteUrl}/auth/callback`)
    }
  } else {
    missingUrls.push('Production callback URL (https://jobhunt.kaitran.ca/auth/callback)')
    missingUrls.push('Development callback URL (http://localhost:3000/auth/callback)')
  }

  OAuthDebugger.log('Callback URL Builder', {
    siteUrl,
    allowedUrls,
    missingUrls,
  })

  return { allowed: allowedUrls, missing: missingUrls }
}

export function analyzeOAuthError(error: any): {
  type: string
  severity: string
  suggestion: string
} {
  if (!error) {
    return { type: 'unknown', severity: 'low', suggestion: 'No error information available' }
  }

  const errorMessage = error.message || error.toString()

  // Common OAuth error patterns
  if (errorMessage.includes('invalid_request') || errorMessage.includes('Invalid')) {
    return {
      type: 'invalid_request',
      severity: 'high',
      suggestion: 'Check OAuth configuration and redirect URLs in Supabase dashboard',
    }
  }

  if (errorMessage.includes('access_denied') || errorMessage.includes('denied')) {
    return {
      type: 'access_denied',
      severity: 'medium',
      suggestion: 'User denied access or OAuth client has insufficient permissions',
    }
  }

  if (errorMessage.includes('redirect_uri_mismatch')) {
    return {
      type: 'redirect_uri_mismatch',
      severity: 'critical',
      suggestion: 'Add production callback URL to Supabase Google OAuth configuration',
    }
  }

  if (errorMessage.includes('code') && errorMessage.includes('exchange')) {
    return {
      type: 'code_exchange_failed',
      severity: 'high',
      suggestion: 'OAuth code exchange failed - check Supabase service configuration',
    }
  }

  return {
    type: 'generic_oauth_error',
    severity: 'medium',
    suggestion: 'Check OAuth provider configuration and network connectivity',
  }
}
