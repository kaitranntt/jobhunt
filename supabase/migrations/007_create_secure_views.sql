-- Simple Secure Views and Functions
-- Basic implementation without complex PL/pgSQL functions

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
-- SIMPLE SECURE VIEWS
-- ============================================================================

-- Applications with company details view
CREATE OR REPLACE VIEW applications_with_company AS
SELECT
    a.id,
    a.user_id,
    a.job_title,
    a.job_description,
    a.job_url,
    a.location,
    a.salary_range,
    a.job_type,
    a.remote_option,
    a.status,
    a.notes,
    a.deadline,
    a.created_at,
    a.updated_at,
    a.company_id,
    c.name as company_name,
    c.website as company_website,
    c.description as company_description,
    c.location as company_location,
    c.industry as company_industry,
    c.size as company_size
FROM applications a
LEFT JOIN companies c ON a.company_id = c.id
WHERE a.user_id = (select auth.uid());

-- Recent applications view
CREATE OR REPLACE VIEW recent_applications AS
SELECT
    a.id,
    a.job_title,
    a.location,
    a.status,
    a.created_at,
    c.name as company_name,
    c.industry as company_industry
FROM applications a
LEFT JOIN companies c ON a.company_id = c.id
WHERE a.user_id = (select auth.uid())
  AND a.created_at >= (NOW() - INTERVAL '30 days')
ORDER BY a.created_at DESC;

-- Upcoming deadlines view
CREATE OR REPLACE VIEW upcoming_deadlines AS
SELECT
    a.id,
    a.job_title,
    a.deadline,
    a.status,
    c.name as company_name,
    EXTRACT(DAYS FROM a.deadline - NOW()) as days_until_deadline
FROM applications a
LEFT JOIN companies c ON a.company_id = c.id
WHERE a.user_id = (select auth.uid())
  AND a.deadline >= NOW()::date
  AND a.deadline <= (NOW()::date + INTERVAL '30 days')
  AND a.status NOT IN ('rejected', 'withdrawn', 'accepted')
ORDER BY a.deadline ASC;

-- Simple user files view
CREATE OR REPLACE VIEW user_files AS
SELECT
    f.id,
    f.name,
    f.bucket_id,
    f.path,
    f.size,
    f.content_type,
    f.is_public,
    f.created_at
FROM files f
WHERE f.user_id = (select auth.uid());

-- ============================================================================
-- SIMPLE SECURE FUNCTIONS
-- ============================================================================

-- Function to get application count by status
CREATE OR REPLACE FUNCTION get_application_status_summary()
RETURNS TABLE(
    status TEXT,
    count BIGINT
) LANGUAGE sql
SECURITY DEFINER
SET search_path = public AS $$
    SELECT
        a.status,
        COUNT(*) as count
    FROM applications a
    WHERE a.user_id = (select auth.uid())
    GROUP BY a.status
    ORDER BY count DESC;
$$;

-- Function to get company application count
CREATE OR REPLACE FUNCTION get_company_application_count()
RETURNS TABLE(
    company_name TEXT,
    application_count BIGINT
) LANGUAGE sql
SECURITY DEFINER
SET search_path = public AS $$
    SELECT
        c.name as company_name,
        COUNT(a.id) as application_count
    FROM companies c
    LEFT JOIN applications a ON c.id = a.company_id
    WHERE c.user_id = (select auth.uid())
    GROUP BY c.name, c.id
    ORDER BY application_count DESC;
$$;

-- ============================================================================
-- COMPLETION VALIDATION
-- ============================================================================

DO $$
DECLARE
    view_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count secure views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name IN ('applications_with_company', 'recent_applications', 'upcoming_deadlines', 'user_files');

    -- Count secure functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name IN ('get_application_status_summary', 'get_company_application_count')
      AND routine_type = 'FUNCTION';

    RAISE NOTICE '✅ Simple secure views and functions created successfully';
    RAISE NOTICE '👁️ Total secure views created: %', view_count;
    RAISE NOTICE '🔧 Secure helper functions: %', function_count;
    RAISE NOTICE '🔒 All views implement proper user isolation';
    RAISE NOTICE '🛡️ Views use (select auth.uid()) for security';
    RAISE NOTICE '📊 Analytics views for dashboard and reporting';
    RAISE NOTICE '⏰ Simple secure view creation completed at %', NOW();
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Secure views available:';
    RAISE NOTICE '   - applications_with_company';
    RAISE NOTICE '   - recent_applications';
    RAISE NOTICE '   - upcoming_deadlines';
    RAISE NOTICE '   - user_files';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Secure functions available:';
    RAISE NOTICE '   - get_application_status_summary';
    RAISE NOTICE '   - get_company_application_count';
END $$;