import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadSound } from '../../../utils/storageUtils';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the token from cookies
    const token = cookies.get('sb-token')?.value;

    console.log('Cookie token found:', !!token);

    if (!token) {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication token not found'
        }),
        { status: 401 }
      );
    }

    // First get the user identity from the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401 }
      );
    }

    // Now get the user data including role for this specific user
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)  // This was the missing filter
      .single();

    if (userError) {
      console.error('User data error:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user data'
        }),
        { status: 500 }
      );
    }

    if (!userData || userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403 }
      );
    }

    console.log('Admin user verified:', user.id);

    // Rest of the upload code remains the same...
    const formData = await request.formData();

    // Get form fields
    const file = formData.get('sound') as File;
    const profileId = formData.get('profileId') as string;
    const profileSlug = formData.get('profileSlug') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    // Validation checks
    if (!file || !profileId || !profileSlug || !name || !description) {
      return new Response(
        JSON.stringify({
          error: 'All fields are required',
          receivedFields: {
            file: !!file,
            profileId: !!profileId,
            profileSlug: !!profileSlug,
            name: !!name,
            description: !!description,
          },
        }),
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    console.log('Uploading to storage...');
    const { path: storagePath, signedUrl } = await uploadSound({
      file,
      profileSlug,
    });
    console.log('File uploaded, storage path:', storagePath);

    // Create database entry using admin client
    console.log('Creating database entry...');
    const { data: newSound, error } = await supabaseAdmin
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

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Sound entry created successfully');
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