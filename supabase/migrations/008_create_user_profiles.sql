-- Create User Profiles Table
-- Extends auth.users with profile information for user management
-- Follows existing migration patterns and RLS security model

-- ============================================================================
-- USER_PROFILES TABLE CREATION
-- ============================================================================

-- User profiles table to extend auth.users with additional profile data
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure one profile per user
    CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id),

    -- Ensure email is valid format
    CONSTRAINT user_profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- UPDATED AT TRIGGER
-- ============================================================================

-- Create trigger for automatic updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Primary index for user isolation (matches existing pattern)
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Email index for authentication lookups
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Composite index for common user profile queries
CREATE INDEX idx_user_profiles_user_id_email ON user_profiles(user_id, email);

-- ============================================================================
-- PROFILE CREATION FUNCTION
-- ============================================================================

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VALIDATION AND COMPLETION
-- ============================================================================

DO $$
DECLARE
    profile_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Validate table creation
    SELECT COUNT(*) INTO profile_count
    FROM information_schema.tables
    WHERE table_name = 'user_profiles' AND table_schema = 'public';

    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'user_profiles' AND schemaname = 'public';

    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'user_profiles' AND schemaname = 'public';

    RAISE NOTICE '✅ User profiles table created successfully';
    RAISE NOTICE '👤 Table: user_profiles (%) record found', profile_count;
    RAISE NOTICE '🔒 RLS policies: % (4 CRUD operations)', policy_count;
    RAISE NOTICE '📈 Performance indexes: % created', index_count;
    RAISE NOTICE '🚀 Auto-profile creation trigger enabled';
    RAISE NOTICE '🔐 User data isolation enforced';
    RAISE NOTICE '⏰ Migration completed at %', NOW();
END $$;