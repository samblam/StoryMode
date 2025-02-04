-- Create enum type for participant status
CREATE TYPE participant_status AS ENUM ('inactive', 'active', 'completed');

-- Add status column to participants table
ALTER TABLE participants
ADD COLUMN status participant_status NOT NULL DEFAULT 'inactive';

-- Add sound_mapping_responses column to survey_responses table
ALTER TABLE survey_responses
ADD COLUMN sound_mapping_responses JSONB;