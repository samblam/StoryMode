import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';

export const GET: APIRoute = async ({ request, locals }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('PROFILE_READ')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    const { user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers
        }
      );
    }

    const supabase = getClient({ requiresAdmin: true });

    // Build query
    let query = supabase
      .from('sound_profiles')
      .select('*');

    // Filter by client_id if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // If user is a client, only show their profiles
    if (user.role === 'client') {
      query = query.eq('client_id', user.clientId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch profiles'
      }),
      { 
        status: 500,
        headers
      }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('PROFILE_CREATE')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

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
        { 
          status: 401,
          headers
        }
      );
    }

    if (!data.title || !data.description) {
      console.log('Validation failed:', { data });
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { 
          status: 400,
          headers
        }
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

    const supabase = getClient({ requiresAdmin: true });
    const { data: newProfile, error } = await supabase
      .from('sound_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Profile created successfully:', newProfile);

    return new Response(
      JSON.stringify(newProfile),
      {
        status: 201,
        headers
      }
    );
  } catch (error) {
    console.error('Profile creation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create profile',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers
      }
    );
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('PROFILE_UPDATE')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    const data = await request.json();
    const { user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers
        }
      );
    }

    if (!data.id || !data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'ID, title, and description are required' }),
        { 
          status: 400,
          headers
        }
      );
    }

    const supabase = getClient({ requiresAdmin: true });

    // Verify user has permission to edit this profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('sound_profiles')
      .select('*')
      .eq('id', data.id)
      .single();

    if (fetchError || !existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers
        }
      );
    }

    // Check permissions
    if (user.role === 'client' && existingProfile.client_id !== user.clientId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 403,
          headers
        }
      );
    }

    // Prepare update data with proper typing
    interface UpdateData {
      title: string;
      description: string;
      slug: string;
      client_id?: string | null;
    }

    const updateData: UpdateData = {
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };

    // Only allow admins to update client_id
    if (user.role === 'admin' && 'clientId' in data) {
      updateData.client_id = data.clientId || null;
    }

    const { data: updatedProfile, error } = await supabase
      .from('sound_profiles')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return new Response(
      JSON.stringify(updatedProfile),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }),
      { 
        status: 500,
        headers
      }
    );
  }
};