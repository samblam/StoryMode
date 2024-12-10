import type { APIRoute } from 'astro';
import { deleteSound } from '../../../utils/soundUtils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { soundFile } = await request.json();
    
    if (!soundFile) {
      return new Response(
        JSON.stringify({ error: 'Sound file path is required' }),
        { status: 400 }
      );
    }

    await deleteSound(soundFile);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Delete failed' 
      }),
      { status: 500 }
    );
  }
};