import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';

export const GET: APIRoute = async ({ params, request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('PROFILE_VIEW', {
      includeIP: true
    })(request);
    
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Profile ID is required' }),
        {
          status: 400,
          headers
        }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from('sound_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers
        }
      );
    }

    return new Response(
      JSON.stringify(profile),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Profile view error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch profile' }),
      {
        status: 500,
        headers
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals, request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
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

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Profile ID is required' }), 
        { 
          status: 400,
          headers
        }
      );
    }

    // 1. Get all sounds in the profile
    const { data: sounds, error: fetchError } = await supabaseAdmin
      .from('sounds')
      .select('storage_path')
      .eq('profile_id', id);

    if (fetchError) {
      console.error('Error fetching sounds:', fetchError);
      throw new Error('Failed to fetch profile sounds');
    }

    // 2. Delete all sound files from storage
    if (sounds && sounds.length > 0) {
      const storagePaths = sounds
        .map(sound => sound.storage_path)
        .filter((path): path is string => !!path);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('sounds')
          .remove(storagePaths);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          throw new Error('Failed to delete sound files');
        }
      }
    }

    // 3. Delete all sounds in the profile from the database
    const { error: soundsDeleteError } = await supabaseAdmin
      .from('sounds')
      .delete()
      .eq('profile_id', id);

    if (soundsDeleteError) {
      console.error('Sounds deletion error:', soundsDeleteError);
      throw new Error('Failed to delete sounds');
    }

    // 4. Finally delete the profile itself
    const { error: profileDeleteError } = await supabaseAdmin
      .from('sound_profiles')
      .delete()
      .eq('id', id);

    if (profileDeleteError) {
      console.error('Profile deletion error:', profileDeleteError);
      throw new Error('Failed to delete profile');
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