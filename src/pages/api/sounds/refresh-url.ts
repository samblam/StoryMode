import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { getSignedUrl } from '../../../utils/storageUtils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { soundId } = await request.json();

    if (!soundId) {
      return new Response(JSON.stringify({ error: 'Sound ID is required' }), {
        status: 400,
      });
    }

    // Get sound from database
    const { data: sound, error: fetchError } = await supabaseAdmin
      .from('sounds')
      .select('storage_path')
      .eq('id', soundId)
      .single();

    if (fetchError || !sound) {
      throw new Error('Sound not found');
    }

    // Get new signed URL
    const signedUrl = await getSignedUrl(sound.storage_path);

    // Update sound with new URL
    const { error: updateError } = await supabaseAdmin
      .from('sounds')
      .update({ file_path: signedUrl })
      .eq('id', soundId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: signedUrl,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('URL refresh error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to refresh URL',
      }),
      { status: 500 }
    );
  }
};
