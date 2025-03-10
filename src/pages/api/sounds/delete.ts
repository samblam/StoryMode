
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check user is admin
    if (!locals.user || locals.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id: soundId } = await request.json();
    
    if (!soundId) {
      return new Response(JSON.stringify({ error: 'Sound ID is required' }), { status: 400 });
    }

    // 1. Get the sound details first
    const { data: sound, error: fetchError } = await supabaseAdmin
      .from('sounds')
      .select('storage_path')
      .eq('id', soundId)
      .single();

    if (fetchError) {
      console.error('Error fetching sound:', fetchError);
      throw new Error('Failed to fetch sound details');
    }

    if (!sound) {
      return new Response(JSON.stringify({ error: 'Sound not found' }), { status: 404 });
    }

    // 2. Delete from storage first
    if (sound.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('sounds')
        .remove([sound.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw new Error('Failed to delete sound file');
      }
    }

    // 3. Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('sounds')
      .delete()
      .eq('id', soundId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      throw new Error('Failed to delete sound record');
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Delete failed' }),
      { status: 500 }
    );
  }
};