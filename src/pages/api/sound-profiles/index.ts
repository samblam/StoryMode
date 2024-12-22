import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
  try {
    const data = await request.json();
    const { user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Set client_id based on user role
    let clientId = null;
    if (user.role === 'admin') {
      // Admin can specify client_id
      clientId = data.clientId || null;
    } else if (user.role === 'client') {
      // Client users can only create profiles for themselves
      clientId = user.clientId;
    }

    // Create new profile
    const profileData = {
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      client_id: clientId,
      is_template: false
    };

    const { data: newProfile, error } = await supabaseAdmin
      .from('sound_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(newProfile), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to create profile'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }): Promise<Response> => {
  try {
    const data = await request.json();
    const { user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.id || !data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'ID, title, and description are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has permission to edit this profile
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('sound_profiles')
      .select('*')
      .eq('id', data.id)
      .single();

    if (fetchError || !existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions
    if (user.role === 'client') {
      if (existingProfile.client_id !== user.clientId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Clients can't change the client_id
      delete data.clientId;
    }

    // Prepare update data
    const updateData = {
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    // Only allow admins to update client_id
    if (user.role === 'admin' && 'clientId' in data) {
      updateData['client_id'] = data.clientId || null;
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('sound_profiles')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to update profile'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};