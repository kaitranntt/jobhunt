-- Document Storage Migration
-- This migration creates the documents table and Supabase Storage bucket with RLS policies
-- Migration can be run multiple times safely (idempotent)

-- ============================================================================
-- PART 1: DATABASE TABLE SCHEMA
-- ============================================================================

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Supabase Storage path format: {user_id}/{application_id}/{timestamp}-{filename}
  file_type TEXT NOT NULL,  -- MIME type (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain)
  file_size INTEGER NOT NULL,  -- File size in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (idempotent)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own documents" ON documents;
  DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
  DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create RLS Policies for documents table
CREATE POLICY "Users can view own documents"
  ON documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes (idempotent with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- ============================================================================
-- PART 2: SUPABASE STORAGE BUCKET SETUP
-- ============================================================================
-- IMPORTANT: This part must be executed separately in the Supabase Dashboard
-- or via the Supabase CLI after the table migration is applied.
--
-- INSTRUCTIONS FOR STORAGE BUCKET SETUP:
--
-- 1. Navigate to Storage in Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Bucket name: "documents"
-- 4. Public bucket: NO (keep private)
-- 5. File size limit: 10MB (10485760 bytes)
-- 6. Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
--
-- OR execute this SQL in the SQL Editor:
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'documents',
--   'documents',
--   false,
--   10485760,
--   ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
-- )
-- ON CONFLICT (id) DO NOTHING;
--
-- ============================================================================
-- PART 3: STORAGE BUCKET RLS POLICIES
-- ============================================================================
-- IMPORTANT: Execute these policies AFTER creating the storage bucket
-- These policies ensure users can only access their own files
--
-- Policy 1: Users can upload files to their own folder
-- CREATE POLICY "Users can upload own files"
--   ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'documents' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- Policy 2: Users can view/download their own files
-- CREATE POLICY "Users can view own files"
--   ON storage.objects
--   FOR SELECT
--   USING (
--     bucket_id = 'documents' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- Policy 3: Users can delete their own files
-- CREATE POLICY "Users can delete own files"
--   ON storage.objects
--   FOR DELETE
--   USING (
--     bucket_id = 'documents' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- ============================================================================
-- COMPLETE STORAGE SETUP SCRIPT (Run in Supabase SQL Editor)
-- ============================================================================
--
-- -- Create the storage bucket
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'documents',
--   'documents',
--   false,
--   10485760,
--   ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if they exist (for idempotency)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create storage RLS policies
CREATE POLICY "Users can upload own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
