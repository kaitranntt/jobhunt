-- UUID Function Validation Script
-- Use this script to test UUID generation functionality before and after migration

-- ============================================================================
-- EXTENSION AVAILABILITY CHECKS
-- ============================================================================

-- Check if uuid-ossp extension exists and its schema
SELECT
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extrelocatable as relocatable,
    extversion as version
FROM pg_extension
WHERE extname IN ('uuid-ossp');

-- Check if UUID functions are available and their schemas
SELECT
    proname as function_name,
    pronamespace::regnamespace as schema_name,
    proowner::regrole as owner
FROM pg_proc
WHERE proname IN ('uuid_generate_v4', 'gen_random_uuid')
ORDER BY proname;

-- ============================================================================
-- FUNCTION ACCESSIBILITY TESTS
-- ============================================================================

DO $$
DECLARE
    uuid_test_result TEXT;
BEGIN
    RAISE NOTICE '=== UUID Function Accessibility Tests ===';

    -- Test uuid_generate_v4() accessibility
    BEGIN
        SELECT uuid_generate_v4()::text INTO uuid_test_result;
        RAISE NOTICE '✅ uuid_generate_v4() is accessible: %', uuid_test_result;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE '❌ uuid_generate_v4() is not accessible';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ uuid_generate_v4() failed with error: %', SQLERRM;
    END;

    -- Test gen_random_uuid() accessibility
    BEGIN
        SELECT gen_random_uuid()::text INTO uuid_test_result;
        RAISE NOTICE '✅ gen_random_uuid() is accessible: %', uuid_test_result;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE '❌ gen_random_uuid() is not accessible';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ gen_random_uuid() failed with error: %', SQLERRM;
    END;

    -- Test schema-qualified uuid_generate_v4() accessibility
    BEGIN
        SELECT public.uuid_generate_v4()::text INTO uuid_test_result;
        RAISE NOTICE '✅ public.uuid_generate_v4() is accessible: %', uuid_test_result;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE '❌ public.uuid_generate_v4() is not accessible';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ public.uuid_generate_v4() failed with error: %', SQLERRM;
    END;

    -- Test schema-qualified gen_random_uuid() accessibility
    BEGIN
        SELECT public.gen_random_uuid()::text INTO uuid_test_result;
        RAISE NOTICE '✅ public.gen_random_uuid() is accessible: %', uuid_test_result;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE '❌ public.gen_random_uuid() is not accessible';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ public.gen_random_uuid() failed with error: %', SQLERRM;
    END;

END $$;

-- ============================================================================
-- SEARCH PATH CONFIGURATION CHECK
-- ============================================================================

RAISE NOTICE '=== Search Path Configuration ===';
SHOW search_path;

-- ============================================================================
-- TEST TABLE CREATION WITH UUID
-- ============================================================================

DO $$
DECLARE
    table_name TEXT := 'uuid_test_table';
    test_uuid UUID;
BEGIN
    RAISE NOTICE '=== Test Table Creation with UUID ===';

    -- Clean up any existing test table
    BEGIN
        DROP TABLE IF EXISTS uuid_test_table;
        RAISE NOTICE '🧹 Cleaned up existing test table';
    EXCEPTION WHEN OTHERS THEN
        -- Ignore cleanup errors
    END;

    -- Test creating table with uuid_generate_v4()
    BEGIN
        EXECUTE format('CREATE TABLE %I (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), test_col TEXT)', table_name);
        EXECUTE format('INSERT INTO %I (test_col) VALUES (%L) RETURNING id', table_name, 'test_uuid_generate_v4');
        RAISE NOTICE '✅ Table creation with uuid_generate_v4() successful';
        DROP TABLE IF EXISTS uuid_test_table;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE '❌ Table creation with uuid_generate_v4() failed - function not accessible';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Table creation with uuid_generate_v4() failed: %', SQLERRM;
    END;

    -- Test creating table with gen_random_uuid()
    BEGIN
        EXECUTE format('CREATE TABLE %I (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), test_col TEXT)', table_name);
        EXECUTE format('INSERT INTO %I (test_col) VALUES (%L) RETURNING id', table_name, 'test_gen_random_uuid');
        RAISE NOTICE '✅ Table creation with gen_random_uuid() successful';
        DROP TABLE IF EXISTS uuid_test_table;
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE '❌ Table creation with gen_random_uuid() failed - function not accessible';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Table creation with gen_random_uuid() failed: %', SQLERRM;
    END;

END $$;

-- ============================================================================
-- SCHEMA OBJECTS SUMMARY
-- ============================================================================

RAISE NOTICE '=== Schema Objects Summary ===';

-- List all tables in public schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all functions in public schema
SELECT
    proname as function_name,
    pronamespace::regnamespace as schema_name,
    proowner::regrole as owner
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname LIKE '%uuid%'
ORDER BY proname;

RAISE NOTICE '=== UUID Validation Complete ===';