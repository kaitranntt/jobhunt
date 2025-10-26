-- ============================================================================
-- JOBHUNT CORE DATABASE SETUP
-- Creates the fundamental database structure for job application tracking
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure each user has unique company names
  UNIQUE(user_id, name)
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT 'Unknown Company', -- For UI compatibility
  job_title TEXT NOT NULL,
  job_url TEXT,
  location TEXT,
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN (
    'wishlist', 'applied', 'phone_screen', 'assessment', 'take_home',
    'interviewing', 'final_round', 'offered', 'rejected', 'withdrawn'
  )),
  date_applied DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User-based indexes for fast queries
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_companies_user_id ON companies(user_id);

-- Status and date indexes for dashboard queries
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_date_applied ON applications(date_applied DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_applications_user_status_date ON applications(user_id, status, date_applied DESC);
CREATE INDEX idx_companies_user_name ON companies(user_id, name);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEW
-- ============================================================================

CREATE VIEW applications_with_company AS
SELECT
  a.id,
  a.user_id,
  a.company_id,
  c.name as company_name,
  c.website as company_website,
  c.logo_url as company_logo,
  a.job_title,
  a.job_url,
  a.location,
  a.salary_range,
  a.status,
  a.date_applied,
  a.notes,
  a.created_at,
  a.updated_at
FROM applications a
LEFT JOIN companies c ON a.company_id = c.id;

-- ============================================================================
-- PERMISSIONS (NO RLS FOR MVP SIMPLICITY)
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;

-- Grant read permissions to anonymous users for public data
GRANT SELECT ON companies TO anon;
GRANT SELECT ON applications TO anon;

-- Grant access to the view
GRANT SELECT ON applications_with_company TO authenticated;
GRANT SELECT ON applications_with_company TO anon;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'JobHunt core database setup completed successfully at %', NOW();
  RAISE NOTICE 'Created: companies, applications tables with indexes, triggers, and permissions';
  RAISE NOTICE 'RLS disabled for MVP simplicity';
  RAISE NOTICE 'Ready for job application tracking!';
END $$;