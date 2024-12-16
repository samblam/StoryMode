import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
      });
    }

    // Fetch profile with its current sounds
    const { data: profile, error } = await supabaseAdmin
      .from('sound_profiles')
      .select(
        `
        *,
        sounds (*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!profile) throw new Error('Profile not found');

    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to fetch profile',
      }),
      { status: 500 }
    );
  }
};

// Keep existing DELETE method
export const DELETE: APIRoute = async ({ params }) => {
  // ... existing delete code ...
};
