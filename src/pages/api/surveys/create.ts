import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = getClient({ requiresAdmin: true });
    const { user } = locals;

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { title, description, client_id, sound_profile_id, functions } = body;

    if (!title || !client_id || !sound_profile_id || !Array.isArray(functions)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure functions have the correct format
    const formattedFunctions = functions.map((func: string) => ({
      id: crypto.randomUUID(),
      text: func,
    }));

    const { data, error } = await supabase
      .from('surveys')
      .insert([{
        title,
        description,
        client_id,
        sound_profile_id,
        functions: formattedFunctions,
        active: false,
        approved: false,
        visible_to_client: false,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating survey:', error);
      return new Response(JSON.stringify({ error: 'Failed to create survey' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};