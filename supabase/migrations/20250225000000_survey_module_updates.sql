-- Add sound_mapping_responses column to survey_responses if not exists
ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS sound_mapping_responses JSONB;

-- Create background_jobs table for handling long-running tasks
CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  data JSONB NOT NULL DEFAULT '{}',
  progress NUMERIC NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on job status for efficient querying
CREATE INDEX IF NOT EXISTS background_jobs_status_idx ON background_jobs(status);

-- Create index on job type for efficient querying
CREATE INDEX IF NOT EXISTS background_jobs_type_idx ON background_jobs(type);

-- Create index on survey ID in data for efficient querying of jobs by survey
CREATE INDEX IF NOT EXISTS background_jobs_survey_id_idx ON background_jobs((data->>'surveyId'));

-- Add function to update job progress
CREATE OR REPLACE FUNCTION update_job_progress(
  job_id UUID,
  new_progress NUMERIC,
  new_status TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE background_jobs
  SET 
    progress = new_progress,
    status = COALESCE(new_status, status),
    updated_at = NOW(),
    completed_at = CASE WHEN new_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Add last_emailed_at column to participants table if not exists
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS last_emailed_at TIMESTAMP WITH TIME ZONE;

-- Add contact_email column to surveys table if not exists
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add published_at column to surveys table if not exists
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;