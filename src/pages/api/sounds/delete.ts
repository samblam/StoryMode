import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, filePath } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Sound ID is required' }), {
        status: 400,
      });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('sounds')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw dbError;
    }

    // Delete file from disk if path provided
    if (filePath) {
      try {
        const publicDir = path.join(process.cwd(), 'public');
        const fullPath = path.join(publicDir, filePath.replace(/^\//, ''));
        await fs.unlink(fullPath);
      } catch (fileError) {
        console.error('File deletion error:', fileError);
        // Continue even if file deletion fails
      }
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
