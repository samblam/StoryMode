-- Add questions column to surveys table
ALTER TABLE surveys
ADD COLUMN questions JSONB;