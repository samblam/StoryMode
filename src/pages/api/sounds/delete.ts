import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const supabase = getClient({ requiresAdmin: true });

    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('DELETE')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    // Check user is admin
    if (!locals.user || locals.user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers
        }
      );
    }

    const { id: soundId } = await request.json();
    
    if (!soundId) {
      return new Response(
        JSON.stringify({ error: 'Sound ID is required' }),
        {
          status: 400,
          headers
        }
      );
    }

    // 1. Get the sound details first
    const { data: sound, error: fetchError } = await supabase
      .from('sounds')
      .select('storage_path')
      .eq('id', soundId)
      .single();

    if (fetchError) {
      console.error('Error fetching sound:', fetchError);
      throw new Error('Failed to fetch sound details');
    }

    if (!sound) {
      return new Response(
        JSON.stringify({ error: 'Sound not found' }),
        {
          status: 404,
          headers
        }
      );
    }

    // 2. Delete from storage first
    if (sound.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('sounds')
        .remove([sound.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw new Error('Failed to delete sound file');
      }
    }

    // 3. Delete from database
    const { error: dbError } = await supabase
      .from('sounds')
      .delete()
      .eq('id', soundId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      throw new Error('Failed to delete sound record');
    }

    return new Response(
      JSON.stringify({ success: true }), 
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Delete failed' }),
      { 
        status: 500,
        headers
      }
    );
  }
};