#!/usr/bin/env tsx

/**
 * OAuth Configuration Helper
 *
 * This script helps identify the required OAuth configuration settings
 * for both local development and production environments.
 */

interface OAuthConfig {
  provider: string
  development: {
    siteUrl: string
    redirectUrls: string[]
  }
  production: {
    siteUrl: string
    redirectUrls: string[]
  }
  supabaseProject: string
}

const config: OAuthConfig = {
  provider: 'Google',
  supabaseProject: 'czrhhqvbhkkxijohkwkn',
  development: {
    siteUrl: 'http://localhost:3000',
    redirectUrls: [
      'http://localhost:3000/auth/callback',
      'http://127.0.0.1:3000/auth/callback',
      'https://localhost:3000/auth/callback',
      'https://127.0.0.1:3000/auth/callback',
    ],
  },
  production: {
    siteUrl: 'https://jobhunt.kaitran.ca',
    redirectUrls: ['https://jobhunt.kaitran.ca/auth/callback'],
  },
}

console.log('🔐 JobHunt OAuth Configuration Guide')
console.log('=====================================\n')

console.log('📋 Required Configuration for Supabase Dashboard:')
console.log('1. Go to: https://supabase.com/dashboard/project/czrhhqvbhkkxijohkwkn/auth/providers')
console.log('2. Find and enable Google OAuth provider\n')

console.log('🏠 Development Environment Configuration:')
console.log('--------------------------------------')
console.log(`Site URL: ${config.development.siteUrl}`)
console.log('Redirect URLs:')
config.development.redirectUrls.forEach(url => console.log(`  - ${url}`))

console.log('\n🚀 Production Environment Configuration:')
console.log('-------------------------------------')
console.log(`Site URL: ${config.production.siteUrl}`)
console.log('Redirect URLs:')
config.production.redirectUrls.forEach(url => console.log(`  - ${url}`))

console.log('\n⚠️  Current Issue Identified:')
console.log('---------------------------')
console.log('❌ supabase/config.toml only contains local development URLs')
console.log('❌ Missing production callback URL in Supabase dashboard')
console.log('❌ OAuth flow fails at code exchange step')

console.log('\n✅ Required Actions:')
console.log('-------------------')
console.log('1. Update supabase/config.toml for local development:')
console.log('   ```toml')
console.log('   [auth]')
console.log(`   site_url = "${config.development.siteUrl}"`)
console.log('   additional_redirect_urls = [')
config.development.redirectUrls.forEach(url => console.log(`     "${url}",`))
console.log('   ]')
console.log('   ```')

console.log('\n2. Configure Production URLs in Supabase Dashboard:')
console.log('   - Site URL: ' + config.production.siteUrl)
config.production.redirectUrls.forEach(url => {
  console.log(`   - Add Redirect URL: ${url}`)
})

console.log('\n3. Google Cloud Console Configuration:')
console.log('   - Authorized redirect URIs must include:')
config.production.redirectUrls.forEach(url => {
  console.log(`   - ${url}`)
})

console.log('\n🔍 Testing Commands:')
console.log('--------------------')
console.log('Local Development:')
console.log('  cd apps/jobhunt')
console.log('  yarn dev')
console.log('  # Test with: http://localhost:3000')

console.log('\nProduction Testing:')
console.log('  # Deploy changes to Vercel')
console.log('  # Test with: https://jobhunt.kaitran.ca')

console.log('\n📝 Configuration Validation:')
console.log('-----------------------------')
console.log('After configuration, test OAuth flow and check:')
console.log('- Browser console for detailed debug logs')
console.log('- Vercel function logs for callback processing')
console.log('- Supabase dashboard auth logs')
console.log('- Network tab for OAuth request/response flow')

console.log('\n🎯 Expected Success Flow:')
console.log('------------------------')
console.log('1. User clicks "Continue with Google"')
console.log('2. Google redirects to: https://jobhunt.kaitran.ca/auth/callback?code=...')
console.log('3. Callback route processes code exchange')
console.log('4. User session is established')
console.log('5. User redirected to dashboard with authenticated session')

console.log('\n📞 If issues persist, check:')
console.log(
  '- Supabase Auth logs: https://supabase.com/dashboard/project/czrhhqvbhkkxijohkwkn/logs'
)
console.log('- Vercel function logs: https://vercel.com/<your-project>/logs')
console.log('- Browser Developer Tools for network errors')

export default config
