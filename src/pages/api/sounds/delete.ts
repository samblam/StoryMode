import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { deleteSound } from '../../../utils/storageUtils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, filePath } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Sound ID is required' }), {
        status: 400,
      });
    }

    // Delete from database first
    const { error: dbError } = await supabase
      .from('sounds')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw dbError;
    }

    // Then delete from storage if path provided
    if (filePath) {
      await deleteSound(filePath);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Delete failed',
      }),
      { status: 500 }
    );
  }
};
