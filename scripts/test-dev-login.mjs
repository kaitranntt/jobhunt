#!/usr/bin/env node
/**
 * Test script to verify dev login credentials work
 * Usage: node scripts/test-dev-login.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure .env.local exists with:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  console.log('🔐 Testing dev login with test@jobhunt.dev...\n')

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@jobhunt.dev',
      password: 'TestUser123!',
    })

    if (error) {
      console.error('❌ Login failed:', error.message)
      console.error('\nError details:')
      console.error(error)
      console.error('\n💡 Tip: Run `supabase db reset --linked` to reseed the database')
      process.exit(1)
    }

    if (data.user) {
      console.log('✅ Login successful!')
      console.log('\nUser details:')
      console.log('- User ID:', data.user.id)
      console.log('- Email:', data.user.email)
      console.log('- Created:', new Date(data.user.created_at).toLocaleString())
      console.log('\n🎉 Dev login is working correctly!')

      // Clean up - sign out
      await supabase.auth.signOut()
      console.log('\n🔓 Signed out successfully')
      return true
    }

    console.error('❌ Unexpected: No error but no user returned')
    return false
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    return false
  }
}

testLogin().then(success => {
  process.exit(success ? 0 : 1)
})
