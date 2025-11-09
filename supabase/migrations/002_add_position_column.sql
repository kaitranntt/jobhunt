-- ============================================================================
-- ADD POSITION COLUMN FOR CUSTOM CARD ORDERING
-- Enables users to freely reorder job application cards within columns
-- ============================================================================

-- Add position column to applications table
ALTER TABLE applications ADD COLUMN position INTEGER;

-- Set initial positions based on current created_at order
-- This ensures existing data has valid position values
WITH numbered_apps AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at DESC) as pos
  FROM applications
)
UPDATE applications
SET position = numbered_apps.pos
FROM numbered_apps
WHERE applications.id = numbered_apps.id;

-- Make position NOT NULL after setting initial values
ALTER TABLE applications ALTER COLUMN position SET NOT NULL;

-- Set default value for new records
ALTER TABLE applications ALTER COLUMN position SET DEFAULT 1;

-- Add composite index for optimal query performance
-- This index supports queries that filter by status and order by position
CREATE INDEX idx_applications_status_position ON applications(status, position);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Position column migration completed successfully at %', NOW();
  RAISE NOTICE 'Added position column with composite index (status, position)';
  RAISE NOTICE 'Existing applications assigned positions based on created_at order';
  RAISE NOTICE 'Cards can now be freely reordered within columns!';
END $$;
