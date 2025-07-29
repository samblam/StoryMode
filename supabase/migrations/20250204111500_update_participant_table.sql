ALTER TABLE participants
ADD COLUMN survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE;

ALTER TABLE participants
RENAME COLUMN email TO participant_identifier;