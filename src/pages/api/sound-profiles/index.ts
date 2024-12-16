import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import type { SoundProfile } from '../../../types/sound';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { status: 400 }
      );
    }

    // Create new profile directly in Supabase
    const { data: newProfile, error } = await supabase
      .from('sound_profiles')
      .insert({
        title: data.title,
        description: data.description,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(newProfile), { status: 201 });
  } catch (error) {
    console.error('Profile creation error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to create profile',
      }),
      { status: 500 }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.id || !data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'ID, title, and description are required' }),
        { status: 400 }
      );
    }

    const { data: updatedProfile, error } = await supabase
      .from('sound_profiles')
      .update({
        title: data.title,
        description: data.description,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(updatedProfile), { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to update profile',
      }),
      { status: 500 }
    );
  }
};
