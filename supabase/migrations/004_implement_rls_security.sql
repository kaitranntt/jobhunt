-- Implement Complete RLS Security
-- Comprehensive Row Level Security with all security fixes incorporated
-- Consolidates: 002_enable_rls_policies.sql + 007_enable_rls_junction_tables.sql + security fixes

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

-- Enable RLS on core tables (files already has RLS enabled from migration 002)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPANIES TABLE RLS POLICIES
-- Performance optimized with (select auth.uid()) pattern
-- ============================================================================

-- Users can view their own companies
CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT USING (user_id = (select auth.uid()));

-- Users can insert their own companies
CREATE POLICY "Users can insert own companies" ON companies
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- Users can update their own companies
CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE USING (user_id = (select auth.uid()));

-- Users can delete their own companies
CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- APPLICATIONS TABLE RLS POLICIES
-- Performance optimized with (select auth.uid()) pattern
-- ============================================================================

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (user_id = (select auth.uid()));

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- Users can update their own applications
CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (user_id = (select auth.uid()));

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications" ON applications
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- APPLICATION_RESUMES TABLE RLS POLICIES
-- Enhanced with EXISTS subqueries for hierarchical security validation
-- ============================================================================

-- Users can view own application resumes through application ownership
CREATE POLICY "Users can view own application resumes" ON application_resumes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_resumes.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Users can insert resumes for their own applications
CREATE POLICY "Users can insert own application resumes" ON application_resumes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_resumes.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Users can update resumes for their own applications
CREATE POLICY "Users can update own application resumes" ON application_resumes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_resumes.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Users can delete resumes for their own applications
CREATE POLICY "Users can delete own application resumes" ON application_resumes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_resumes.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- COMPANY_LOGOS TABLE RLS POLICIES
-- Enhanced with EXISTS subqueries for hierarchical security validation
-- ============================================================================

-- Users can view own company logos through company ownership
CREATE POLICY "Users can view own company logos" ON company_logos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_logos.company_id
      AND companies.user_id = (select auth.uid())
    )
  );

-- Users can insert logos for their own companies
CREATE POLICY "Users can insert own company logos" ON company_logos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_logos.company_id
      AND companies.user_id = (select auth.uid())
    )
  );

-- Users can update logos for their own companies
CREATE POLICY "Users can update own company logos" ON company_logos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_logos.company_id
      AND companies.user_id = (select auth.uid())
    )
  );

-- Users can delete logos for their own companies
CREATE POLICY "Users can delete own company logos" ON company_logos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_logos.company_id
      AND companies.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- APPLICATION_DOCUMENTS TABLE RLS POLICIES
-- Enhanced with EXISTS subqueries for hierarchical security validation
-- ============================================================================

-- Users can view own application documents through application ownership
CREATE POLICY "Users can view own application documents" ON application_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Users can insert documents for their own applications
CREATE POLICY "Users can insert own application documents" ON application_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Users can update documents for their own applications
CREATE POLICY "Users can update own application documents" ON application_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Users can delete documents for their own applications
CREATE POLICY "Users can delete own application documents" ON application_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECURITY VALIDATION AND CONFIRMATION
-- ============================================================================

DO $$
DECLARE
    companies_policy_count INTEGER;
    applications_policy_count INTEGER;
    files_policy_count INTEGER;
    junction_policy_count INTEGER;
    total_policies INTEGER;
BEGIN
    -- Count policies on core tables
    SELECT COUNT(*) INTO companies_policy_count
    FROM pg_policies
    WHERE tablename = 'companies' AND schemaname = 'public';

    SELECT COUNT(*) INTO applications_policy_count
    FROM pg_policies
    WHERE tablename = 'applications' AND schemaname = 'public';

    SELECT COUNT(*) INTO files_policy_count
    FROM pg_policies
    WHERE tablename = 'files' AND schemaname = 'public';

    -- Count policies on junction tables
    SELECT COUNT(*) INTO junction_policy_count
    FROM pg_policies
    WHERE tablename IN ('application_resumes', 'company_logos', 'application_documents')
      AND schemaname = 'public';

    total_policies := companies_policy_count + applications_policy_count + files_policy_count + junction_policy_count;

    RAISE NOTICE '✅ Complete RLS security implementation completed';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '📊 Companies table policies: % (4 CRUD operations)', companies_policy_count;
    RAISE NOTICE '📊 Applications table policies: % (4 CRUD operations)', applications_policy_count;
    RAISE NOTICE '📊 Files table policies: % (2 comprehensive policies)', files_policy_count;
    RAISE NOTICE '📊 Junction table policies: % (12 CRUD operations)', junction_policy_count;
    RAISE NOTICE '🎯 Total RLS policies implemented: %', total_policies;
    RAISE NOTICE '🚀 Performance optimized with (select auth.uid()) patterns';
    RAISE NOTICE '🛡️ Enhanced junction table security with EXISTS subqueries';
    RAISE NOTICE '🔐 User data isolation enforced across all tables';
    RAISE NOTICE '⏰ RLS implementation completed at %', NOW();
END $$;