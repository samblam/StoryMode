import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadSound } from '../../../utils/storageUtils';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';
import { validateField, COMMON_RULES, sanitizeInput } from '../../../utils/validation';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers
        }
      );
    }

    const { data: userData } = await supabaseAdmin
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
    const profileId = sanitizeInput(formData.get('profileId') as string);
    const profileSlug = sanitizeInput(formData.get('profileSlug') as string);
    const name = sanitizeInput(formData.get('name') as string);
    const description = sanitizeInput(formData.get('description') as string);

    // Validate required fields
    if (!file || !profileId || !profileSlug || !name || !description) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        {
          status: 400,
          headers
        }
      );
    }

    // Validate profile ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profileId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid profile ID format' }),
        {
          status: 400,
          headers
        }
      );
    }

    // Validate name
    const nameValidation = validateField(name, COMMON_RULES.name);
    if (!nameValidation.valid) {
      return new Response(
        JSON.stringify({ error: nameValidation.message }),
        {
          status: 400,
          headers
        }
      );
    }

    // Validate description
    if (description.length < 10 || description.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Description must be between 10 and 200 characters' }),
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
      const { data: newSound, error: dbError } = await supabaseAdmin
        .from('sounds')
        .insert({
          name: sanitizeInput(name),
          description: sanitizeInput(description),
          file_path: signedUrl,
          storage_path: storagePath,
          profile_id: sanitizeInput(profileId),
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
          await supabaseAdmin.storage.from('sounds').remove([storagePath]);
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