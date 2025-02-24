import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';

export const GET: APIRoute = async ({ params, locals, request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('PROFILE_READ')(request);
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

    const { user } = locals;
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers
        }
      );
    }

    const supabase = getClient({ requiresAdmin: true });

    // 1. Get the sound profile
    const { data: profile, error: profileError } = await supabase
      .from('sound_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sound profile' }),
        {
          status: profileError.code === 'PGRST116' ? 404 : 500,
          headers
        }
      );
    }

    // Check permissions for client users
    if (user.role === 'client' && profile.client_id !== user.clientId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 403,
          headers
        }
      );
    }

    // 2. Get all sounds in the profile
    const { data: sounds, error: soundsError } = await supabase
      .from('sounds')
      .select('*')
      .eq('profile_id', id)
      .order('created_at', { ascending: false });

    if (soundsError) {
      console.error('Error fetching sounds:', soundsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile sounds' }),
        {
          status: 500,
          headers
        }
      );
    }

    // 3. Format the response
    const formattedSounds = sounds.map(sound => ({
      id: sound.id,
      name: sound.name,
      description: sound.description,
      file: sound.file_path,
      storage_path: sound.storage_path
    }));

    const result = {
      ...profile,
      sounds: formattedSounds
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
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

    interface Sound {
      storage_path: string | null;
    }

    // 1. Get all sounds in the profile
    const { data: sounds, error: fetchError } = await supabase
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
        .map((sound: Sound) => sound.storage_path)
        .filter((path: string | null): path is string => !!path);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('sounds')
          .remove(storagePaths);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          throw new Error('Failed to delete sound files');
        }
      }
    }

    // 3. Delete all sounds in the profile from the database
    const { error: soundsDeleteError } = await supabase
      .from('sounds')
      .delete()
      .eq('profile_id', id);

    if (soundsDeleteError) {
      console.error('Sounds deletion error:', soundsDeleteError);
      throw new Error('Failed to delete sounds');
    }

    // 4. Finally delete the profile itself
    const { error: profileDeleteError } = await supabase
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