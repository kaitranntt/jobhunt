-- Enhanced Kanban Board System Migration
-- Supports custom columns, board settings, analytics, and WIP limits

-- 1. Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Job Applications',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure user only has one default board
  CONSTRAINT unique_user_default_board
    EXCLUDE (user_id WITH =) WHERE (is_default = true)
);

-- 2. Create board_columns table for custom columns
CREATE TABLE IF NOT EXISTS board_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6', -- Default blue color
  position INTEGER NOT NULL,
  wip_limit INTEGER DEFAULT 0, -- 0 means no limit
  is_default BOOLEAN DEFAULT false, -- For migration compatibility
  is_archived BOOLEAN DEFAULT false, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure unique positions within a board for non-archived columns
  CONSTRAINT unique_board_column_position
    EXCLUDE (board_id WITH =, position WITH =) WHERE (is_archived = false)
);

-- 3. Create board_settings table for configuration
CREATE TABLE IF NOT EXISTS board_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'default',
  compact_mode BOOLEAN DEFAULT false,
  show_empty_columns BOOLEAN DEFAULT true,
  show_column_counts BOOLEAN DEFAULT true,
  enable_animations BOOLEAN DEFAULT true,
  auto_archive_days INTEGER DEFAULT 30, -- Auto-archive after X days
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure one settings record per board
  CONSTRAINT unique_board_settings UNIQUE (board_id)
);

-- 4. Create board_analytics table for metrics
CREATE TABLE IF NOT EXISTS board_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  column_id UUID REFERENCES board_columns(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure unique metric per column per day
  CONSTRAINT unique_daily_metric UNIQUE (board_id, column_id, metric_date)
);

-- Enable Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DO $$
BEGIN
  -- Boards policies
  DROP POLICY IF EXISTS "Users can view own boards" ON boards;
  DROP POLICY IF EXISTS "Users can insert own boards" ON boards;
  DROP POLICY IF EXISTS "Users can update own boards" ON boards;
  DROP POLICY IF EXISTS "Users can delete own boards" ON boards;

  -- Board columns policies
  DROP POLICY IF EXISTS "Users can view own board columns" ON board_columns;
  DROP POLICY IF EXISTS "Users can insert own board columns" ON board_columns;
  DROP POLICY IF EXISTS "Users can update own board columns" ON board_columns;
  DROP POLICY IF EXISTS "Users can delete own board columns" ON board_columns;

  -- Board settings policies
  DROP POLICY IF EXISTS "Users can view own board settings" ON board_settings;
  DROP POLICY IF EXISTS "Users can insert own board settings" ON board_settings;
  DROP POLICY IF EXISTS "Users can update own board settings" ON board_settings;
  DROP POLICY IF EXISTS "Users can delete own board settings" ON board_settings;

  -- Board analytics policies
  DROP POLICY IF EXISTS "Users can view own board analytics" ON board_analytics;
  DROP POLICY IF EXISTS "Users can insert own board analytics" ON board_analytics;
  DROP POLICY IF EXISTS "Users can update own board analytics" ON board_analytics;
  DROP POLICY IF EXISTS "Users can delete own board analytics" ON board_analytics;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create RLS Policies for boards
CREATE POLICY "Users can view own boards" ON boards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boards" ON boards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards" ON boards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards" ON boards
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for board_columns
CREATE POLICY "Users can view own board columns" ON board_columns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own board columns" ON board_columns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own board columns" ON board_columns
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own board columns" ON board_columns
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for board_settings
CREATE POLICY "Users can view own board settings" ON board_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own board settings" ON board_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own board settings" ON board_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own board settings" ON board_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for board_analytics
CREATE POLICY "Users can view own board analytics" ON board_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own board analytics" ON board_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own board analytics" ON board_analytics
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own board analytics" ON board_analytics
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist (for idempotency)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
  DROP TRIGGER IF EXISTS update_board_columns_updated_at ON board_columns;
  DROP TRIGGER IF EXISTS update_board_settings_updated_at ON board_settings;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create updated_at triggers for all new tables
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_columns_updated_at
  BEFORE UPDATE ON board_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_settings_updated_at
  BEFORE UPDATE ON board_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_is_default ON boards(is_default);
CREATE INDEX IF NOT EXISTS idx_boards_is_archived ON boards(is_archived);

CREATE INDEX IF NOT EXISTS idx_board_columns_board_id ON board_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_user_id ON board_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_position ON board_columns(position);
CREATE INDEX IF NOT EXISTS idx_board_columns_is_archived ON board_columns(is_archived);

CREATE INDEX IF NOT EXISTS idx_board_settings_board_id ON board_settings(board_id);
CREATE INDEX IF NOT EXISTS idx_board_settings_user_id ON board_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_board_analytics_board_id ON board_analytics(board_id);
CREATE INDEX IF NOT EXISTS idx_board_analytics_column_id ON board_analytics(column_id);
CREATE INDEX IF NOT EXISTS idx_board_analytics_metric_date ON board_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_board_analytics_user_id ON board_analytics(user_id);

-- Migration function to create default board and columns for existing users
CREATE OR REPLACE FUNCTION migrate_existing_user_to_kanban_v2(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_board_id UUID;
BEGIN
  -- Create default board for the user
  INSERT INTO boards (user_id, name, description, is_default)
  VALUES (
    target_user_id,
    'Job Applications',
    'Default job application tracking board',
    true
  )
  RETURNING id INTO new_board_id;

  -- Create default columns based on existing status system
  INSERT INTO board_columns (board_id, user_id, name, color, position, is_default) VALUES
    (new_board_id, target_user_id, 'Wishlist', '#94a3b8', 1, true),
    (new_board_id, target_user_id, 'Applied', '#3b82f6', 2, true),
    (new_board_id, target_user_id, 'Phone Screen', '#8b5cf6', 3, true),
    (new_board_id, target_user_id, 'Assessment', '#f59e0b', 4, true),
    (new_board_id, target_user_id, 'Take Home', '#f97316', 5, true),
    (new_board_id, target_user_id, 'Interviewing', '#10b981', 6, true),
    (new_board_id, target_user_id, 'Final Round', '#06b6d4', 7, true),
    (new_board_id, target_user_id, 'Offered', '#84cc16', 8, true),
    (new_board_id, target_user_id, 'Accepted', '#22c55e', 9, true),
    (new_board_id, target_user_id, 'Rejected', '#ef4444', 10, true),
    (new_board_id, target_user_id, 'Withdrawn', '#6b7280', 11, true),
    (new_board_id, target_user_id, 'Ghosted', '#a855f7', 12, true);

  -- Create default board settings
  INSERT INTO board_settings (board_id, user_id)
  VALUES (new_board_id, target_user_id);

  RETURN new_board_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create default board for a user
CREATE OR REPLACE FUNCTION get_or_create_default_board(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  board_id UUID;
BEGIN
  -- Try to get existing default board
  SELECT id INTO board_id
  FROM boards
  WHERE user_id = target_user_id AND is_default = true AND is_archived = false
  LIMIT 1;

  -- If no default board exists, create one
  IF board_id IS NULL THEN
    board_id := migrate_existing_user_to_kanban_v2(target_user_id);
  END IF;

  RETURN board_id;
END;
$$ LANGUAGE plpgsql;