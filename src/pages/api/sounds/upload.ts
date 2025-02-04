import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { uploadSound } from '../../../utils/storageUtils';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const supabase = getClient({ requiresAdmin: true });

    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('UPLOAD')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    // Get the token from cookies
    const token = cookies.get('sb-token')?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication token not found' }),
        {
          status: 401,
          headers
        }
      );
    }

    // Verify admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers
        }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        {
          status: 403,
          headers
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('sound') as File;
    const profileId = formData.get('profileId') as string;
    const profileSlug = formData.get('profileSlug') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!file || !profileId || !profileSlug || !name || !description) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { 
          status: 400,
          headers
        }
      );
    }

    // Validate file type and extension
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    const validExtensions = ['.mp3', '.wav', '.ogg'];
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    const isValidType = validTypes.includes(file.type) || 
                       validExtensions.includes(fileExtension);

    if (!isValidType) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Please upload MP3, WAV, or OGG files only.' }),
        { 
          status: 400,
          headers
        }
      );
    }

    let storagePath: string | undefined;
    try {
      // Upload to Supabase Storage with content-type
      const { path, signedUrl } = await uploadSound({
        file,
        profileSlug,
        contentType: file.type || 'audio/mpeg' // Default to audio/mpeg if type is empty
      });
      storagePath = path;

      // Create database entry
      const { data: newSound, error: dbError } = await supabase
        .from('sounds')
        .insert({
          name,
          description,
          file_path: signedUrl,
          storage_path: storagePath,
          profile_id: profileId,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          sound: newSound,
        }),
        {
          status: 200,
          headers
        }
      );
    } catch (error) {
      // Clean up uploaded file if it exists and there was an error
      if (storagePath) {
        try {
          await supabase.storage.from('sounds').remove([storagePath]);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
      }

      console.error('Upload error:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Upload failed'
        }),
        {
          status: 500,
          headers
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Request failed'
      }),
      {
        status: 500,
        headers
      }
    );
  }
};