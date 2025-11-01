-- Create Junction Tables
-- This migration creates the junction tables that reference the files table
-- These tables require the files table from migration 002 to exist first

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
-- APPLICATION-RESUMES JUNCTION TABLE
-- ============================================================================

CREATE TABLE application_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate resume-application associations
    CONSTRAINT application_resumes_unique UNIQUE (application_id, resume_id)
);

-- ============================================================================
-- COMPANY-LOGOS JUNCTION TABLE
-- ============================================================================

CREATE TABLE company_logos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    logo_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate logo-company associations
    CONSTRAINT company_logos_unique UNIQUE (company_id, logo_id)
);

-- ============================================================================
-- APPLICATION-DOCUMENTS JUNCTION TABLE
-- ============================================================================

CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    document_type VARCHAR(50) DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Validated document types
    CONSTRAINT application_documents_type_check CHECK (
        document_type IN ('cover_letter', 'portfolio', 'certification', 'reference', 'other')
    ),

    -- Prevent duplicate document-application associations
    CONSTRAINT application_documents_unique UNIQUE (application_id, document_id)
);

-- ============================================================================
-- JUNCTION TABLE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Junction table indexes
CREATE INDEX idx_application_resumes_application_id ON application_resumes(application_id);
CREATE INDEX idx_application_resumes_resume_id ON application_resumes(resume_id);
CREATE INDEX idx_company_logos_company_id ON company_logos(company_id);
CREATE INDEX idx_company_logos_logo_id ON company_logos(logo_id);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_documents_document_id ON application_documents(document_id);

-- ============================================================================
-- ENABLE RLS ON JUNCTION TABLES
-- ============================================================================

ALTER TABLE application_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR JUNCTION TABLES
-- ============================================================================

-- Application-Resumes policies
CREATE POLICY "Users can manage their own application resumes" ON application_resumes
  FOR ALL USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = (select auth.uid())
    )
  );

-- Company-Logos policies
CREATE POLICY "Users can manage their own company logos" ON company_logos
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = (select auth.uid())
    )
  );

-- Application-Documents policies
CREATE POLICY "Users can manage their own application documents" ON application_documents
  FOR ALL USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- COMPLETION VALIDATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Junction tables created successfully';
    RAISE NOTICE '🔗 Tables created: application_resumes, company_logos, application_documents';
    RAISE NOTICE '📈 Performance indexes created';
    RAISE NOTICE '🔒 RLS policies implemented';
    RAISE NOTICE '⏰ Junction table creation completed at %', NOW();
END $$;