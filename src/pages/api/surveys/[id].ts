import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { verifyAuthorization } from '../../../utils/accessControl';
import { handleRLSError, isRLSError } from '../../../utils/accessControl';
import type { User } from '../../../types/auth';
import type { PostgrestError } from '@supabase/supabase-js';

function getErrorMessage(error: PostgrestError): string {
  return error?.message || 'Unknown error occurred';
}

export const get: APIRoute = async ({ params, locals }) => {
  try {
    const user = locals.user as User | undefined;
    const { authorized, error: authError } = await verifyAuthorization(user, 'admin', 'read');
    
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

    const { data, error } = await supabase
      .from('surveys')
      .select(`
        *,
        client:clients (
          id,
          name,
          email
        ),
        survey_sounds (
          id,
          sound_id,
          intended_function,
          order_index,
          sounds (
            id,
            name,
            url
          )
        )
      `)
      .eq('id', id)
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
    console.error('Error in GET /api/surveys/[id]:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};

export const put: APIRoute = async ({ request, params, locals }) => {
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
        const { active, approved, visible_to_client } = body;

        const { data, error } = await supabase
            .from('surveys')
            .update({ active, approved, visible_to_client })
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

export const del: APIRoute = async ({ params, locals }) => {
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