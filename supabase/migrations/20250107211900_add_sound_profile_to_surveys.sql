-- Add sound_profile_id to surveys table
ALTER TABLE surveys
ADD COLUMN sound_profile_id UUID REFERENCES sound_profiles(id);