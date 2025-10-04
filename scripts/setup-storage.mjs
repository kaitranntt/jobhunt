#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  try {
    // Create the documents bucket
    console.log('Creating documents storage bucket...')

    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
    })

    if (error) {
      if (error.message?.includes('already exists')) {
        console.log('✅ Documents bucket already exists')
      } else {
        console.error('Error creating bucket:', error)
        process.exit(1)
      }
    } else {
      console.log('✅ Documents bucket created successfully:', data)
    }

    // Note: RLS policies for storage.objects must be set up via SQL
    // The policies from migration 003_document_storage.sql handle this
    console.log('\n⚠️  Remember to run the storage RLS policies from migration 003_document_storage.sql')
    console.log('    These policies ensure users can only access their own files')

  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

setupStorage()
