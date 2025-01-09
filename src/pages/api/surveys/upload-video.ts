import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';

const MAX_FILE_SIZE = 52428800; // 50MB to match bucket config
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export const POST: APIRoute = async ({ request }) => {
    try {
        // Get admin client for storage operations
        const supabase = getClient({ requiresAdmin: true });

        // Get the form data
        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const surveyId = formData.get('surveyId') as string;

        if (!videoFile || !surveyId) {
            return new Response(JSON.stringify({ 
                error: 'Video file and survey ID are required' 
            }), { status: 400 });
        }

        // Validate file size
        if (videoFile.size > MAX_FILE_SIZE) {
            return new Response(JSON.stringify({ 
                error: 'File size exceeds 50MB limit' 
            }), { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(videoFile.type)) {
            return new Response(JSON.stringify({ 
                error: 'Invalid file type. Only MP4, WebM, and OGG videos are allowed' 
            }), { status: 400 });
        }

        // Check if videos bucket exists
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('Error listing buckets:', bucketsError);
            return new Response(JSON.stringify({ 
                error: 'Failed to verify storage configuration',
                details: bucketsError.message
            }), { status: 500 });
        }

        if (!buckets?.find(b => b.name === 'videos')) {
            return new Response(JSON.stringify({ 
                error: 'Video storage is not configured. Please run migrations first.' 
            }), { status: 500 });
        }

        // Upload the video
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `video.${fileExt}`;
        const filePath = `${surveyId}/${fileName}`;

        const { error: uploadError, data } = await supabase
            .storage
            .from('videos')
            .upload(filePath, videoFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return new Response(JSON.stringify({ 
                error: 'Failed to upload video',
                details: uploadError.message
            }), { status: 500 });
        }

        // Update the survey with the full video path including bucket
        const fullPath = `videos/${filePath}`;
        const { error: updateError } = await supabase
            .from('surveys')
            .update({ video_url: fullPath })
            .eq('id', surveyId);

        if (updateError) {
            console.error('Update error:', updateError);
            return new Response(JSON.stringify({ 
                error: 'Failed to update survey',
                details: updateError.message
            }), { status: 500 });
        }

        return new Response(JSON.stringify({
            url: filePath
        }), { status: 200 });

    } catch (error) {
        console.error('Server error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500 });
    }
};