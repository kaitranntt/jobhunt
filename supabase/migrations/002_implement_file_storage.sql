-- Implement File Storage System
-- Complete file infrastructure with security and RLS
-- Consolidates: 005_file_storage_infrastructure.sql + 006_create_storage_buckets.sql

-- ============================================================================
-- ENSURE UUID FUNCTION ACCESSIBILITY
-- ============================================================================

-- Ensure search path includes extensions schema for UUID function
SET search_path TO public, extensions;

-- Validate UUID function is accessible
DO $$
BEGIN
    -- Test UUID generation to ensure function is accessible
    PERFORM uuid_generate_v4();
    RAISE NOTICE '✅ UUID function uuid_generate_v4() is accessible';
EXCEPTION WHEN undefined_function THEN
    RAISE EXCEPTION '❌ UUID function uuid_generate_v4() is not accessible. Check extension installation and search_path.';
END $$;

-- ============================================================================
-- FILES TABLE FOR FILE MANAGEMENT
-- ============================================================================

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bucket_id VARCHAR(255) NOT NULL,
    path VARCHAR(1000) NOT NULL,
    size BIGINT NOT NULL DEFAULT 0,
    content_type VARCHAR(255),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure unique file paths per bucket
    CONSTRAINT files_bucket_path_unique UNIQUE (bucket_id, path)
);

-- ============================================================================
-- FILE STORAGE UPDATED AT TRIGGER
-- ============================================================================

-- Create trigger for files table updated_at column
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FILE STORAGE INDEXES
-- ============================================================================

-- Indexes for file storage performance
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_bucket_id ON files(bucket_id);
CREATE INDEX idx_files_is_public ON files(is_public);
CREATE INDEX idx_files_created_at ON files(created_at);

-- Composite index for user file queries
CREATE INDEX idx_files_user_bucket ON files(user_id, bucket_id);

-- ============================================================================
-- ENABLE RLS ON FILES TABLE
-- ============================================================================

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FILES TABLE RLS POLICIES
-- Performance optimized with comprehensive access patterns
-- ============================================================================

-- Comprehensive policy for viewing files (public + owned)
CREATE POLICY "Files comprehensive access policy" ON files
  FOR ALL USING (
    -- Public files are viewable by anyone
    (is_public = true) OR
    -- Users can view/modify their own files
    (user_id = (select auth.uid()))
  );

-- INSERT policy with explicit role restrictions to prevent conflicts
CREATE POLICY "Users can insert own files" ON files
  FOR INSERT WITH CHECK (
    -- Allow authenticated users to insert files they own
    user_id = (select auth.uid())
  );

-- ============================================================================
-- STORAGE BUCKETS (using Supabase Storage)
-- ============================================================================

-- Note: Supabase Storage buckets are created via API or Dashboard
-- This section documents the expected storage structure

DO $$
BEGIN
    RAISE NOTICE '📁 File storage system created successfully';
    RAISE NOTICE '📂 Files table with user ownership and public access support';
    RAISE NOTICE '🔒 RLS policies implemented with comprehensive access control';
    RAISE NOTICE '📈 Performance indexes created for file operations';
    RAISE NOTICE '🗂️ Storage buckets to be created via Supabase Dashboard:';
    RAISE NOTICE '   - resume-files: User resume uploads';
    RAISE NOTICE '   - company-logos: Company logo images';
    RAISE NOTICE '   - application-documents: Additional application files';
    RAISE NOTICE '⏰ File storage implementation completed at %', NOW();
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Create storage buckets via Supabase Dashboard';
    RAISE NOTICE '2. Configure bucket policies in Supabase Storage';
    RAISE NOTICE '3. Test file upload/download functionality';
END $$;