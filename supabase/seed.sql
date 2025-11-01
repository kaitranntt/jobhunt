-- ============================================================================
-- SEED DATA FOR JOBHUNT APPLICATION
-- Creates test user and sample application data for development and debugging
-- ============================================================================

-- ============================================================================
-- TEST USER SETUP
-- ============================================================================

-- Create test user in auth.users table
-- This user will be the anchor debugging point for development
-- Email: test@jobhunt.dev
-- Password: TestUser123!
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test@jobhunt.dev',
    -- Password: TestUser123! (hashed with bcrypt)
    '$2a$10$KqBvGvXfJKvLKz0w7YqKr.yVZQxkMQmKvZQxGKqYzKqNzKqLKqMKq',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Test User","full_name":"Test User"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create identity record for test user
INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"test@jobhunt.dev"}'::jsonb,
    'email',
    now(),
    now(),
    now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- Create user profile for test user
INSERT INTO public.user_profiles (
    id,
    user_id,
    email,
    name,
    bio,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test@jobhunt.dev',
    'Test User',
    'Development test user for JobHunt application',
    now(),
    now()
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SAMPLE COMPANIES
-- ============================================================================

INSERT INTO public.companies (
    id,
    user_id,
    name,
    website,
    description,
    location,
    industry,
    size,
    created_at,
    updated_at
)
VALUES
    (
        '10000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'TechCorp Inc',
        'https://techcorp.example.com',
        'Leading technology company specializing in cloud solutions',
        'San Francisco, CA',
        'Technology',
        '1000-5000',
        now(),
        now()
    ),
    (
        '10000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'StartupX',
        'https://startupx.example.com',
        'Fast-growing startup building the future of work',
        'Remote',
        'Software',
        '50-200',
        now(),
        now()
    ),
    (
        '10000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'Enterprise Solutions Ltd',
        'https://enterprise.example.com',
        'Enterprise software solutions for Fortune 500 companies',
        'New York, NY',
        'Enterprise Software',
        '5000+',
        now(),
        now()
    ),
    (
        '10000000-0000-0000-0000-000000000004'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'AI Innovations',
        'https://aiinnovations.example.com',
        'Cutting-edge AI and machine learning research lab',
        'Boston, MA',
        'Artificial Intelligence',
        '200-500',
        now(),
        now()
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE APPLICATIONS
-- Demonstrates all application statuses and various scenarios
-- ============================================================================

INSERT INTO public.applications (
    id,
    user_id,
    company_id,
    job_title,
    job_description,
    job_url,
    location,
    salary_range,
    job_type,
    remote_option,
    status,
    notes,
    deadline,
    created_at,
    updated_at
)
VALUES
    -- Applied status
    (
        '20000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000001'::uuid,
        'Senior Software Engineer',
        'Build scalable cloud infrastructure using modern technologies',
        'https://techcorp.example.com/careers/senior-swe',
        'San Francisco, CA',
        '$150k-$200k',
        'full-time',
        'hybrid',
        'applied',
        'Strong engineering team, good benefits package',
        (now() + interval '2 weeks')::date,
        now() - interval '3 days',
        now() - interval '3 days'
    ),
    -- Interviewing status
    (
        '20000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000002'::uuid,
        'Full Stack Developer',
        'Work on cutting-edge web applications with React and Node.js',
        'https://startupx.example.com/jobs/fullstack',
        'Remote',
        '$120k-$160k',
        'full-time',
        'remote',
        'interviewing',
        'First interview scheduled for next week. Seems like great culture!',
        (now() + interval '1 week')::date,
        now() - interval '2 weeks',
        now() - interval '1 day'
    ),
    -- Technical assessment status
    (
        '20000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000003'::uuid,
        'Backend Engineer',
        'Design and implement microservices architecture',
        'https://enterprise.example.com/careers/backend',
        'New York, NY',
        '$140k-$180k',
        'full-time',
        'on-site',
        'technical_assessment',
        'Take-home assignment received. Need to complete by Friday.',
        (now() + interval '5 days')::date,
        now() - interval '1 week',
        now() - interval '2 hours'
    ),
    -- Offer status
    (
        '20000000-0000-0000-0000-000000000004'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000004'::uuid,
        'Machine Learning Engineer',
        'Research and implement state-of-the-art ML models',
        'https://aiinnovations.example.com/jobs/ml-engineer',
        'Boston, MA',
        '$160k-$220k',
        'full-time',
        'hybrid',
        'offer',
        'Offer received! $180k base + equity. Need to respond by end of week.',
        (now() + interval '3 days')::date,
        now() - interval '1 month',
        now() - interval '1 hour'
    ),
    -- Saved status (wishlist)
    (
        '20000000-0000-0000-0000-000000000005'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000001'::uuid,
        'DevOps Engineer',
        'Manage cloud infrastructure and CI/CD pipelines',
        'https://techcorp.example.com/careers/devops',
        'San Francisco, CA',
        '$130k-$170k',
        'full-time',
        'hybrid',
        'saved',
        'Interesting role, considering applying next week',
        null,
        now(),
        now()
    ),
    -- Rejected status
    (
        '20000000-0000-0000-0000-000000000006'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000002'::uuid,
        'Frontend Developer',
        'Build beautiful user interfaces with modern frameworks',
        'https://startupx.example.com/jobs/frontend',
        'Remote',
        '$110k-$140k',
        'full-time',
        'remote',
        'rejected',
        'Not selected after final round. Good learning experience.',
        null,
        now() - interval '1 month',
        now() - interval '5 days'
    ),
    -- Final round status
    (
        '20000000-0000-0000-0000-000000000007'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000003'::uuid,
        'Engineering Manager',
        'Lead a team of 5-8 engineers building enterprise platforms',
        'https://enterprise.example.com/careers/eng-manager',
        'New York, NY',
        '$180k-$240k',
        'full-time',
        'hybrid',
        'final_round',
        'Final interview with VP Engineering scheduled. Prepare leadership questions.',
        (now() + interval '4 days')::date,
        now() - interval '3 weeks',
        now() - interval '6 hours'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VALIDATION AND CONFIRMATION
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    company_count INTEGER;
    application_count INTEGER;
BEGIN
    -- Count seeded records
    SELECT COUNT(*) INTO user_count
    FROM auth.users
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

    SELECT COUNT(*) INTO company_count
    FROM public.companies
    WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

    SELECT COUNT(*) INTO application_count
    FROM public.applications
    WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

    RAISE NOTICE '✅ Seed data loaded successfully';
    RAISE NOTICE '👤 Test user created: test@jobhunt.dev (Password: TestUser123!)';
    RAISE NOTICE '🏢 Companies seeded: % companies', company_count;
    RAISE NOTICE '📝 Applications seeded: % applications', application_count;
    RAISE NOTICE '📊 Application statuses:';
    RAISE NOTICE '   - 1 saved (wishlist)';
    RAISE NOTICE '   - 1 applied';
    RAISE NOTICE '   - 1 interviewing';
    RAISE NOTICE '   - 1 technical_assessment';
    RAISE NOTICE '   - 1 final_round';
    RAISE NOTICE '   - 1 offer';
    RAISE NOTICE '   - 1 rejected';
    RAISE NOTICE '🔐 Anonymous sign-ins enabled for development';
    RAISE NOTICE '⏰ Seed completed at %', NOW();
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to test! Login with:';
    RAISE NOTICE '   Email: test@jobhunt.dev';
    RAISE NOTICE '   Password: TestUser123!';
END $$;
