import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '../../../lib/supabase';

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

    // Delete the profile from database
    const { error: deleteError } = await supabase
      .from('sound_profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Delete associated sound files
    try {
      const publicDir = path.join(process.cwd(), 'public');
      const profileDir = path.join(publicDir, 'sounds', profile.slug);
      await fs.rm(profileDir, { recursive: true, force: true });
    } catch (fsError) {
      console.error('Error deleting sound files:', fsError);
      // Continue even if file deletion fails
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
