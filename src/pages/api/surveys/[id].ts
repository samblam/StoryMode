import type { APIRoute } from 'astro';
import type { AstroCookies } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { verifyAuthorization } from '../../../utils/accessControl';
import { handleRLSError, isRLSError } from '../../../utils/accessControl';
import { getCurrentUser } from '../../../utils/authUtils';
import type { User } from '../../../types/auth';
import type { PostgrestError } from '@supabase/supabase-js';

function getErrorMessage(error: PostgrestError): string {
  return error?.message || 'Unknown error occurred';
}

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'No authorization token provided' }), {
        status: 401,
      });
    }

    // Get user from token using admin client directly
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
      });
    }

    // Get user data with admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        clients!client_id (
          id,
          name,
          email,
          active
        )
      `)
      .eq('id', authUser.id)
      .single();

    if (userError) {
      return new Response(JSON.stringify({ error: 'Error fetching user data' }), {
        status: 500,
      });
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      role: userData.role || 'client',
      clientId: userData.client_id,
      client: userData.clients ? {
        id: userData.clients.id,
        name: userData.clients.name,
        email: userData.clients.email,
        active: userData.clients.active
      } : null,
      createdAt: authUser.created_at || new Date().toISOString(),
    };

    const { authorized, error: authzError } = await verifyAuthorization(user, 'admin', 'read');
    
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError }), {
        status: 403,
      });
    }

    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing survey ID' }), {
            status: 400,
        });
    }

    // First get the survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (surveyError) {
      return new Response(JSON.stringify({ error: getErrorMessage(surveyError) }), {
        status: 500,
      });
    }

    // Then get the survey sounds
    const { data: surveySounds, error: soundsError } = await supabase
      .from('survey_sounds')
      .select(`
        id,
        sound_id,
        intended_function,
        order_index,
        sounds (
          id,
          name,
          file_path,
          storage_path,
          profile_id
        )
      `)
      .eq('survey_id', id)
      .order('order_index');

    if (soundsError) {
      return new Response(JSON.stringify({ error: getErrorMessage(soundsError) }), {
        status: 500,
      });
    }

    // Combine the data
    const data = {
      ...survey,
      survey_sounds: surveySounds
    };

    return new Response(JSON.stringify({ data }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error in GET /api/surveys/[id]:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};

export const PUT: APIRoute = async ({ request, params, locals }) => {
    try {
        const user = locals.user as User | undefined;
        const { authorized, error: authError } = await verifyAuthorization(user, 'admin', 'write');

        if (!authorized) {
            return new Response(JSON.stringify({ error: authError }), {
                status: 403,
            });
        }

        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing survey ID' }), {
                status: 400,
            });
        }

        const body = await request.json();
        // Allow updating all survey fields
        const { data, error } = await supabase
            .from('surveys')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            const postgrestError = error as PostgrestError;
            if (isRLSError(postgrestError)) {
                return handleRLSError(postgrestError);
            }
            return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
                status: 500,
            });
        }

        return new Response(JSON.stringify({ data }), {
            status: 200,
        });
    } catch (error) {
        console.error('Error in PUT /api/surveys/[id]:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
        });
    }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
    try {
        const user = locals.user as User | undefined;
        const { authorized, error: authError } = await verifyAuthorization(user, 'admin', 'admin');

        if (!authorized) {
            return new Response(JSON.stringify({ error: authError }), {
                status: 403,
            });
        }

        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing survey ID' }), {
                status: 400,
            });
        }

        const { error } = await supabase
            .from('surveys')
            .delete()
            .eq('id', id);

        if (error) {
            const postgrestError = error as PostgrestError;
            if (isRLSError(postgrestError)) {
                return handleRLSError(postgrestError);
            }
            return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
                status: 500,
            });
        }

        return new Response(null, {
            status: 204,
        });
    } catch (error) {
        console.error('Error in DELETE /api/surveys/[id]:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
        });
    }
};