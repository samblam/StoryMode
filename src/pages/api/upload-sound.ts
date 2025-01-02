import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('sound') as File;
    const profile = formData.get('profile') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    if (!file || !profile || !name || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Please upload MP3, WAV, or OGG files only.' }),
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 5MB limit.' }),
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    // Generate safe filename
    const extension = file.type.split('/')[1];
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filePath = `${profile}/${safeName}.${extension}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('sounds')
      .upload(filePath, file);

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 500 }
      );
    }

    // Get public URL of uploaded file
    const { data: urlData } = supabase
      .storage
      .from('sounds')
      .getPublicUrl(filePath);

    // Store metadata in database
    const { error: dbError } = await supabase
      .from('sounds')
      .insert({
        profile,
        name,
        description,
        file_path: filePath,
        url: urlData.publicUrl
      });

    if (dbError) {
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        url: urlData.publicUrl
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