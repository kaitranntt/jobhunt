-- Create user_profiles table with idempotent operations
-- This migration can be run multiple times safely

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  job_role TEXT,
  desired_roles TEXT[],
  desired_industries TEXT[],
  experience_years INTEGER CHECK (experience_years >= 0 AND experience_years <= 100),
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security (idempotent)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
-- Note: First run will show notices - this is expected behavior
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create RLS Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Drop trigger if exists (for idempotency)
-- Note: First run will show notice - this is expected behavior
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create updated_at trigger (reuses existing function from 001_init_applications_schema.sql)
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes (idempotent with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_desired_roles ON user_profiles USING GIN(desired_roles);
CREATE INDEX IF NOT EXISTS idx_user_profiles_desired_industries ON user_profiles USING GIN(desired_industries);
