-- Add functions array to surveys table
ALTER TABLE surveys 
ADD COLUMN functions jsonb DEFAULT '[]'::jsonb;

-- Migrate any existing functions from survey_sounds
WITH unique_functions AS (
  SELECT DISTINCT survey_id, intended_function
  FROM survey_sounds
  WHERE intended_function IS NOT NULL
)
UPDATE surveys s
SET functions = (
  SELECT jsonb_agg(intended_function)
  FROM unique_functions
  WHERE survey_id = s.id
)
WHERE EXISTS (
  SELECT 1
  FROM unique_functions
  WHERE survey_id = s.id
);