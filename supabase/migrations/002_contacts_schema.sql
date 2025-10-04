-- Create contacts table with idempotent operations
-- This migration can be run multiple times safely

-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (idempotent)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
-- Note: First run will show notices - this is expected behavior
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create RLS Policies
CREATE POLICY "Users can view own contacts"
  ON contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Drop trigger if exists (for idempotency)
-- Note: First run will show notice - this is expected behavior
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create updated_at trigger (reuse the function from applications migration)
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes (idempotent with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_application_id ON contacts(application_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
