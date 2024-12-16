import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { deleteSoundsByProfile } from '../../../utils/storageUtils';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
      });
    }

    // First, get the profile to get its slug
    const { data: profile, error: profileError } = await supabase
      .from('sound_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Delete associated sounds from database
    const { error: soundsError } = await supabase
      .from('sounds')
      .delete()
      .eq('profile_id', id);

    if (soundsError) {
      throw soundsError;
    }

    // Delete associated sound files from storage
    await deleteSoundsByProfile(profile.slug);

    // Finally, delete the profile itself
    const { error: deleteError } = await supabase
      .from('sound_profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Profile deletion error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to delete profile',
      }),
      { status: 500 }
    );
  }
};
