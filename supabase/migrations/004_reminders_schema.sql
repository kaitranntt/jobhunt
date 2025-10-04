-- Create reminders table with idempotent operations
-- This migration can be run multiple times safely

-- Create reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (idempotent)
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create RLS Policies
CREATE POLICY "Users can view own reminders"
  ON reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Drop trigger if exists (for idempotency)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create updated_at trigger
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes (idempotent with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_application_id ON reminders(application_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_date ON reminders(reminder_date DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_is_completed ON reminders(is_completed);
