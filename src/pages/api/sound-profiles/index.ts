import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const data = await request.json();
    const { user } = locals;

    // Debug logging
    console.log('Profile Creation Debug:', {
      requestData: data,
      user,
      timestamp: new Date().toISOString()
    });

    if (!user) {
      console.log('Unauthorized: No user in locals');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (!data.title || !data.description) {
      console.log('Validation failed:', { data });
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { status: 400 }
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

    console.log('Preparing to create profile:', {
      title: data.title,
      description: data.description,
      clientId,
      userRole: user.role
    });

    // Create new profile with explicit type checking
    const profileData = {
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      client_id: clientId,
      is_template: false // Add any default fields needed
    };

    console.log('Sending to Supabase:', profileData);

    const { data: newProfile, error } = await supabaseAdmin
      .from('sound_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Profile created successfully:', newProfile);

    // Get the current session token from cookies
    const token = cookies.get('sb-token');
    
    return new Response(
      JSON.stringify(newProfile), 
      { 
        status: 201,
        headers: {
          'Set-Cookie': `sb-token=${token?.value}; Path=/; HttpOnly; Secure; SameSite=Lax` 
        }
      }
    );
  } catch (error) {
    console.error('Profile creation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create profile',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500 }
    );
  }
};


export const PUT: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const data = await request.json();
    const { user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (!data.id || !data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'ID, title, and description are required' }),
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'client' && existingProfile.client_id !== user.clientId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };

    // Only allow admins to update client_id
    if (user.role === 'admin' && 'clientId' in data) {
      updateData.client_id = data.clientId || null;
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

    // Get the current session token from cookies
    const token = cookies.get('sb-token');
    
    return new Response(
      JSON.stringify(updatedProfile), 
      { 
        status: 200,
        headers: {
          'Set-Cookie': `sb-token=${token?.value}; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }),
      { status: 500 }
    );
  }
};