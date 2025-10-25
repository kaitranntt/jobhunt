#!/usr/bin/env tsx

/**
 * OAuth Testing Script
 * Tests the OAuth authentication flow and validates configuration
 */

import { createClient } from '@supabase/supabase-js'

// Test configuration
const testConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
}

console.log('🧪 JobHunt OAuth Testing Script')
console.log('=================================\n')

function validateConfiguration() {
  console.log('📋 Configuration Validation:')
  console.log('----------------------------')

  const issues: string[] = []

  if (!testConfig.supabaseUrl) {
    issues.push('❌ NEXT_PUBLIC_SUPABASE_URL not found')
  } else {
    console.log('✅ Supabase URL found:', testConfig.supabaseUrl)
  }

  if (!testConfig.supabaseAnonKey) {
    issues.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found')
  } else {
    console.log('✅ Supabase Anon Key found')
  }

  if (!testConfig.siteUrl) {
    issues.push('❌ NEXT_PUBLIC_SITE_URL not found')
  } else {
    console.log('✅ Site URL found:', testConfig.siteUrl)
  }

  // Validate OAuth configuration
  const expectedCallbackUrl = `${testConfig.siteUrl}/auth/callback`
  console.log('📍 Expected Callback URL:', expectedCallbackUrl)

  if (testConfig.siteUrl?.includes('localhost')) {
    console.log('🏠 Local Development Environment Detected')
    console.log('   Callback URL should work with local Supabase config')
  } else if (testConfig.siteUrl?.includes('jobhunt.kaitran.ca')) {
    console.log('🚀 Production Environment Detected')
    console.log('   Make sure callback URL is configured in Supabase dashboard')
  }

  return issues.length === 0
}

function generateTestUrls() {
  console.log('\n🔗 Test URLs Generation:')
  console.log('-------------------------')

  const baseUrl = testConfig.siteUrl || 'http://localhost:3000'

  const oauthUrl = `${testConfig.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${baseUrl}/auth/callback`)}`

  console.log('🔐 OAuth Initiation URL:')
  console.log('   ', oauthUrl)

  console.log('🔄 Expected Callback URL:')
  console.log('   ', `${baseUrl}/auth/callback`)

  return {
    oauthUrl,
    callbackUrl: `${baseUrl}/auth/callback`,
  }
}

function validateSupabaseClient() {
  console.log('\n🔌 Supabase Client Test:')
  console.log('------------------------')

  try {
    if (!testConfig.supabaseUrl || !testConfig.supabaseAnonKey) {
      console.log('❌ Cannot create Supabase client - missing configuration')
      return false
    }

    const supabase = createClient(testConfig.supabaseUrl, testConfig.supabaseAnonKey)

    console.log('✅ Supabase client created successfully')
    console.log('📊 Client Configuration:')
    console.log('   URL:', testConfig.supabaseUrl)
    console.log('   Auth URL:', `${testConfig.supabaseUrl}/auth/v1`)

    return supabase
  } catch (error) {
    console.log('❌ Supabase client creation failed:', error)
    return false
  }
}

function generateTestPlan() {
  console.log('\n📝 OAuth Test Plan:')
  console.log('-------------------')

  console.log('1. Manual Browser Test:')
  console.log('   - Open the OAuth URL in browser')
  console.log('   - Complete Google authentication flow')
  console.log('   - Check redirect and callback processing')

  console.log('\n2. Development Test (yarn dev):')
  console.log('   - Start development server')
  console.log('   - Navigate to http://localhost:3000/login')
  console.log('   - Click "Continue with Google"')
  console.log('   - Monitor browser console for debug logs')

  console.log('\n3. Production Test:')
  console.log('   - Deploy changes to Vercel')
  console.log('   - Test at https://jobhunt.kaitran.ca/login')
  console.log('   - Check Vercel logs for any errors')

  console.log('\n4. Debug Information to Check:')
  console.log('   - Browser Developer Tools Console')
  console.log('   - Network Tab for OAuth requests')
  console.log('   - Vercel Function Logs')
  console.log('   - Supabase Dashboard Auth Logs')
}

function showTroubleshooting() {
  console.log('\n🔧 Troubleshooting Guide:')
  console.log('------------------------')

  console.log('If OAuth fails at callback with code=...')
  console.log('1. Check callback URL in Supabase dashboard')
  console.log(
    '   Visit: https://supabase.com/dashboard/project/czrhhqvbhkkxijohkwkn/auth/providers'
  )
  console.log('   Ensure: https://jobhunt.kaitran.ca/auth/callback is added')

  console.log('\n2. Check Google Cloud Console')
  console.log('   Authorized redirect URIs must include:')
  console.log('   - https://jobhunt.kaitran.ca/auth/callback')

  console.log('\n3. Common Error Patterns:')
  console.log('   - redirect_uri_mismatch: Callback URL not authorized')
  console.log('   - invalid_request: Configuration issue')
  console.log('   - access_denied: User denied or scope issues')

  console.log('\n4. Debug Information:')
  console.log('   - Check browser console for OAuth debug logs')
  console.log('   - Look for error_type and error_suggestion parameters')
  console.log('   - Verify network requests in DevTools')
}

// Main execution
async function runTests() {
  console.log('🔍 Starting OAuth Configuration Tests...\n')

  // Validate configuration
  const configValid = validateConfiguration()

  if (!configValid) {
    console.log('\n❌ Configuration validation failed. Please fix environment variables.')
    process.exit(1)
  }

  // Generate test URLs
  generateTestUrls()

  // Validate Supabase client
  const supabase = validateSupabaseClient()

  if (!supabase) {
    console.log('\n❌ Supabase client validation failed.')
    process.exit(1)
  }

  // Show test plan
  generateTestPlan()

  // Show troubleshooting
  showTroubleshooting()

  console.log('\n✅ Test Configuration Complete')
  console.log('🚀 Next Steps:')
  console.log('   1. Update Supabase dashboard with production callback URL')
  console.log('   2. Test OAuth flow in development')
  console.log('   3. Deploy to production and test')
  console.log('   4. Monitor logs for any issues')
}

// Run the tests
runTests().catch(console.error)

export default runTests
