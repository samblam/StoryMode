-- Enable storage if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "storage";

-- Create videos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos', 
    'videos', 
    false, 
    52428800,  -- 50MB limit (within Supabase constraints)
    ARRAY['video/mp4', 'video/webm', 'video/ogg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Set up storage policy for authenticated users
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
    ('Upload videos for authenticated users only', 
     'videos', 
     'INSERT', 
     '(role() = ''authenticated''::text)'),
    ('Read videos for authenticated users only',
     'videos',
     'SELECT',
     '(role() = ''authenticated''::text)'),
    ('Update videos for authenticated users only',
     'videos',
     'UPDATE',
     '(role() = ''authenticated''::text)'),
    ('Delete videos for authenticated users only',
     'videos',
     'DELETE',
     '(role() = ''authenticated''::text)')
ON CONFLICT (name, bucket_id, operation) 
DO UPDATE SET definition = EXCLUDED.definition;