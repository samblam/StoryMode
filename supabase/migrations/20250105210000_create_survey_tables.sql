-- Create surveys table
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  video_url TEXT,
  approved BOOLEAN DEFAULT FALSE,
  visible_to_client BOOLEAN DEFAULT FALSE
);

-- Create survey_sounds table
CREATE TABLE survey_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) NOT NULL,
  sound_id UUID REFERENCES sounds(id) NOT NULL,
  intended_function TEXT,
  order_index INTEGER
);

-- Create participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create survey_responses table
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) NOT NULL,
  participant_id UUID REFERENCES participants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE
);

-- Create survey_matches table
CREATE TABLE survey_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES survey_responses(id) NOT NULL,
  sound_id UUID REFERENCES sounds(id) NOT NULL,
  matched_function TEXT,
  correct_match BOOLEAN
);