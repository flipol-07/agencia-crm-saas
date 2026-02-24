-- Drop the unique index that prevents multiple meetings from sharing the same external_id
DROP INDEX IF EXISTS idx_meetings_external_id;

-- Re-create it as a regular index for performance, without the UNIQUE constraint
CREATE INDEX idx_meetings_external_id ON meetings (external_id);
