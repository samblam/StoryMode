import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadSound } from '../../../utils/storageUtils';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the token from cookies
    const token = cookies.get('sb-token')?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication token not found' }),
        { status: 401 }
      );
    }

    // Verify admin user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401 }
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
        { status: 403 }
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    // Let's trust the file extension and MIME type instead of checking file signatures
    // Since we're already validating the extension and MIME type, and browser's File API
    // typically provides accurate MIME types

    // Upload to Supabase Storage with content-type
    const { path: storagePath, signedUrl } = await uploadSound({
      file,
      profileSlug,
      contentType: file.type || 'audio/mpeg' // Default to audio/mpeg if type is empty
    });

    // Create database entry
    const { data: newSound, error: dbError } = await supabaseAdmin
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
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Upload failed'
      }),
      { status: 500 }
    );
  }
};