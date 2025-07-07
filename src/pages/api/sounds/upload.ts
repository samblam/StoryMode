import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { uploadSound } from '../../../utils/storageUtils';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('API: /api/sounds/upload - Request received');
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    console.log('API: /api/sounds/upload - Initializing Supabase client (admin)');
    const supabase = getClient({ requiresAdmin: true });
    console.log('API: /api/sounds/upload - Supabase client initialized');

    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('UPLOAD')(request);
    if (rateLimitResponse instanceof Response) {
      console.log('API: /api/sounds/upload - Rate limit exceeded');
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
    console.log('API: /api/sounds/upload - Rate limiting applied');

    // Get the token from cookies
    const token = cookies.get('sb-token')?.value;
    console.log('API: /api/sounds/upload - Token retrieved:', !!token);

    if (!token) {
      console.error('API: /api/sounds/upload - Authentication token not found');
      return new Response(
        JSON.stringify({ error: 'Authentication token not found' }),
        {
          status: 401,
          headers
        }
      );
    }

    // Verify admin user
    console.log('API: /api/sounds/upload - Verifying admin user');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('API: /api/sounds/upload - Invalid authentication token or user not found:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers
        }
      );
    }
    console.log('API: /api/sounds/upload - User authenticated:', user.id);

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    console.log('API: /api/sounds/upload - User role data:', userData?.role);

    if (!userData || userData.role !== 'admin') {
      console.error('API: /api/sounds/upload - Unauthorized: Admin access required for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        {
          status: 403,
          headers
        }
      );
    }
    console.log('API: /api/sounds/upload - User is admin');

    console.log('API: /api/sounds/upload - Parsing form data');
    const formData = await request.formData();
    const file = formData.get('sound') as File;
    const profileId = formData.get('profileId') as string;
    const profileSlug = formData.get('profileSlug') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    console.log('API: /api/sounds/upload - Form data parsed. File:', !!file, 'Profile ID:', profileId, 'Name:', name);

    if (!file || !profileId || !profileSlug || !name || !description) {
      console.error('API: /api/sounds/upload - Missing required fields');
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        {
          status: 400,
          headers
        }
      );
    }
    console.log('API: /api/sounds/upload - All required fields present');

    // Validate file type and extension
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    const validExtensions = ['.mp3', '.wav', '.ogg'];
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    const isValidType = validTypes.includes(file.type) ||
                       validExtensions.includes(fileExtension);
    console.log('API: /api/sounds/upload - File type:', file.type, 'Extension:', fileExtension, 'Is valid type:', isValidType);

    if (!isValidType) {
      console.error('API: /api/sounds/upload - Invalid file type:', file.type);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Please upload MP3, WAV, or OGG files only.' }),
        {
          status: 400,
          headers
        }
      );
    }
    console.log('API: /api/sounds/upload - File type validated');

    let storagePath: string | undefined;
    try {
      console.log('API: /api/sounds/upload - Calling uploadSound utility');
      // Upload to Supabase Storage with content-type
      const { path, signedUrl } = await uploadSound({
        file,
        profileSlug,
        contentType: file.type || 'audio/mpeg' // Default to audio/mpeg if type is empty
      });
      storagePath = path;
      console.log('API: /api/sounds/upload - uploadSound completed. Storage Path:', storagePath);

      // Create database entry
      console.log('API: /api/sounds/upload - Inserting sound into database');
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
        console.error('API: /api/sounds/upload - Database insert error:', dbError.message);
        throw dbError;
      }
      console.log('API: /api/sounds/upload - Sound inserted into database:', newSound?.id);

      console.log('API: /api/sounds/upload - Upload successful, returning response');
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
      console.error('API: /api/sounds/upload - Error during storage upload or DB insert:', error);
      // Clean up uploaded file if it exists and there was an error
      if (storagePath) {
        try {
          console.log('API: /api/sounds/upload - Attempting to clean up uploaded file:', storagePath);
          await supabase.storage.from('sounds').remove([storagePath]);
          console.log('API: /api/sounds/upload - File cleanup successful');
        } catch (cleanupError) {
          console.error('API: /api/sounds/upload - Failed to cleanup uploaded file:', cleanupError);
        }
      }

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
    console.error('API: /api/sounds/upload - Top-level request error:', error);
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