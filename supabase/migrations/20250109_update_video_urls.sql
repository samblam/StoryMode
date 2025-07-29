-- Update existing video URLs to store just the file paths
UPDATE surveys
SET video_url = CASE
    WHEN video_url IS NOT NULL AND video_url != '' THEN
        -- Extract the survey ID and file name from the public URL
        -- Format: https://[project-ref].supabase.co/storage/v1/object/public/videos/[survey-id]/[survey-id]/video.[ext]
        regexp_replace(
            video_url,
            '^.*/videos/([^/]+)/[^/]+/video\.([^/]+)$',
            '\1/video.\2'
        )
    ELSE video_url
END
WHERE video_url IS NOT NULL AND video_url != '';

-- Add a comment to document the change
COMMENT ON COLUMN surveys.video_url IS 'Stores the file path relative to the videos bucket (e.g., survey-id/video.mp4)';