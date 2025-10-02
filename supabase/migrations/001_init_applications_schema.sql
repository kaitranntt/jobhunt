-- Create applications table with idempotent operations
-- This migration can be run multiple times safely

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  location TEXT,
  salary_range TEXT,
  status TEXT CHECK (status IN (
    'wishlist',           -- Want to apply
    'applied',            -- Application submitted
    'phone_screen',       -- Phone screening scheduled/completed
    'assessment',         -- Online assessment/test
    'take_home',          -- Take-home project/assignment
    'interviewing',       -- Technical/behavioral interviews
    'final_round',        -- Final round/onsite
    'offered',            -- Offer received
    'accepted',           -- Offer accepted
    'rejected',           -- Application rejected
    'withdrawn',          -- Application withdrawn
    'ghosted'             -- No response received
  )) DEFAULT 'applied' NOT NULL,
  date_applied DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (idempotent)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
-- Note: First run will show notices - this is expected behavior
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own applications" ON applications;
  DROP POLICY IF EXISTS "Users can insert own applications" ON applications;
  DROP POLICY IF EXISTS "Users can update own applications" ON applications;
  DROP POLICY IF EXISTS "Users can delete own applications" ON applications;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create RLS Policies
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
-- Note: First run will show notice - this is expected behavior
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create updated_at trigger
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes (idempotent with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON applications(date_applied DESC);
CREATE INDEX IF NOT EXISTS idx_applications_company_name ON applications(company_name);
