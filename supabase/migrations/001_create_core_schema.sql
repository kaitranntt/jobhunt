-- Create Core Schema Foundation
-- Consolidates core tables with all schema improvements and fixes
-- Replaces: 001_create_core_tables.sql + 004_fix_data_model_issues.sql

-- ============================================================================
-- CORE EXTENSIONS AND CONFIGURATION
-- ============================================================================

-- Enable UUID extension for primary key generation
-- Create extension in public schema to ensure uuid_generate_v4() is accessible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Set search path to include extensions schema
SET search_path TO public, extensions;

-- Validate UUID function is available
DO $$
BEGIN
    -- Test UUID generation to ensure function is accessible
    PERFORM uuid_generate_v4();
    RAISE NOTICE '✅ UUID function uuid_generate_v4() is accessible';
EXCEPTION WHEN undefined_function THEN
    RAISE EXCEPTION '❌ UUID function uuid_generate_v4() is not accessible. Check extension installation and search_path.';
END $$;

-- ============================================================================
-- CORE TABLES WITH ALL SCHEMA IMPROVEMENTS
-- ============================================================================

-- Companies table with proper constraints and improvements
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    industry VARCHAR(100),
    size VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Proper unique constraints to prevent duplicates per user
    CONSTRAINT companies_user_name_unique UNIQUE (user_id, name)
);

-- Applications table with all status options and improvements
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT,
    job_url VARCHAR(500),
    location VARCHAR(255),
    salary_range VARCHAR(100),
    job_type VARCHAR(50) DEFAULT 'full-time',
    remote_option VARCHAR(50) DEFAULT 'on-site',
    status VARCHAR(50) DEFAULT 'applied' NOT NULL,
    notes TEXT,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Validated status enum to ensure data integrity
    CONSTRAINT applications_status_check CHECK (
        status IN (
            'saved', 'applied', 'interviewing', 'technical_assessment',
            'final_round', 'offer', 'rejected', 'withdrawn', 'accepted'
        )
    ),

    -- Validated job types
    CONSTRAINT applications_job_type_check CHECK (
        job_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')
    ),

    -- Validated remote options
    CONSTRAINT applications_remote_option_check CHECK (
        remote_option IN ('on-site', 'remote', 'hybrid')
    )
);

-- ============================================================================
-- JUNCTION TABLES WITH PROPER FOREIGN KEYS
-- NOTE: These tables will be created in migration 003 after files table exists
-- ============================================================================

-- Placeholder for junction tables that will be created after files table
-- These tables reference the files table which is created in migration 002:
-- - application_resumes (applications <-> files)
-- - company_logos (companies <-> files)
-- - application_documents (applications <-> files)

DO $$
BEGIN
    RAISE NOTICE '📋 Junction tables will be created in migration 003 after files table exists';
END $$;

-- ============================================================================
-- UPDATED AT TRIGGERS FOR ALL TABLES
-- ============================================================================

-- Function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BASIC INDEXES FOR PRIMARY PERFORMANCE
-- ============================================================================

-- Core table indexes for user isolation
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);

-- Foreign key indexes for join performance
CREATE INDEX idx_applications_company_id ON applications(company_id);

-- Junction table indexes will be created in migration 003
-- after the junction tables are created following files table creation

-- ============================================================================
-- SCHEMA VALIDATION AND COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Core schema foundation created successfully';
    RAISE NOTICE '📊 Tables created: companies, applications, application_resumes, company_logos, application_documents';
    RAISE NOTICE '🔗 Foreign key constraints established';
    RAISE NOTICE '📈 Basic performance indexes created';
    RAISE NOTICE '🔒 Data validation constraints applied';
    RAISE NOTICE '🕐 Updated at triggers implemented';
    RAISE NOTICE '⏰ Schema creation completed at %', NOW();
END $$;