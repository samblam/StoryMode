import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { deleteSoundsByProfileId } from '../../../utils/soundUtils';
import { deleteSoundsByProfile } from '../../../utils/storageUtils';

export const DELETE: APIRoute = async ({ params }): Promise<Response> => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the profile to get its slug
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('sound_profiles')
      .select('slug')
      .eq('id', id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete associated sounds from storage
    await deleteSoundsByProfile(profile.slug);

    // Delete associated sounds from database
    await deleteSoundsByProfileId(id);

    // Delete the profile
    const { error: deleteError } = await supabaseAdmin
      .from('sound_profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Profile deletion error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to delete profile'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};