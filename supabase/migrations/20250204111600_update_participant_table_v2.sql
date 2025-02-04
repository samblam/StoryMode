ALTER TABLE participants
ADD COLUMN survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE;

ALTER TABLE participants
ADD COLUMN participant_identifier VARCHAR(255);