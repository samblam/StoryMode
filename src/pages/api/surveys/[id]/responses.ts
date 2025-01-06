import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { verifyAuthorization } from '../../../../utils/accessControl';
import { handleRLSError, isRLSError } from '../../../../utils/accessControl';
import type { User } from '../../../../types/auth';
import type { PostgrestError } from '@supabase/supabase-js';
import { validateParticipantAccess } from '../../../../utils/authUtils';

function getErrorMessage(error: PostgrestError): string {
  return error?.message || 'Unknown error occurred';
}

export const get: APIRoute = async ({ request, params, locals }) => {
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
      .from('survey_responses')
      .select(`
        *,
        participant:participants (
          id,
          email
        ),
        survey_matches (
          id,
          sound_id,
          matched_function,
          correct_match,
          sounds (
            id,
            name,
            url
          )
        )
      `)
      .eq('survey_id', id)
      .order('created_at', { ascending: false });

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
    console.error('Error in GET /api/surveys/[id]/responses:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};

export const post: APIRoute = async ({ request, params, locals, cookies }) => {
  try {
    const user = locals.user as User | undefined;
    const participantId = locals.participantId;
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing survey ID' }), {
        status: 400,
      });
    }

    if (user?.role === 'participant' && participantId) {
      const hasAccess = await validateParticipantAccess(participantId, id);
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
        });
      }
    } else {
      const { authorized, error: authError } = await verifyAuthorization(user, 'admin', 'write');
      if (!authorized) {
        return new Response(JSON.stringify({ error: authError }), {
          status: 403,
        });
      }
    }

    const body = await request.json();
    const { matches, completed } = body as {
      matches: { sound_id: string, matched_function: string, correct_match: boolean }[],
      completed: boolean
    };

    if (!Array.isArray(matches)) {
      return new Response(JSON.stringify({ error: 'Invalid matches data' }), {
        status: 400,
      });
    }

    const { data: response, error: responseError } = await supabase
      .from('survey_responses')
      .insert({
        survey_id: id,
        participant_id: locals.participantId,
        completed
      })
      .select()
      .single();

    if (responseError) {
      const postgrestError = responseError as PostgrestError;
      if (isRLSError(postgrestError)) {
        return handleRLSError(postgrestError);
      }
      return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
        status: 500,
      });
    }

    const surveyMatches = matches.map(match => ({
      response_id: response.id,
      sound_id: match.sound_id,
      matched_function: match.matched_function,
      correct_match: match.correct_match
    }));

    const { error: matchesError } = await supabase
      .from('survey_matches')
      .insert(surveyMatches);

    if (matchesError) {
      const postgrestError = matchesError as PostgrestError;
      if (isRLSError(postgrestError)) {
        return handleRLSError(postgrestError);
      }
      return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error in POST /api/surveys/[id]/responses:', error);
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
            .from('survey_responses')
            .delete()
            .eq('survey_id', id);

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
        console.error('Error in DELETE /api/surveys/[id]/responses:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
        });
    }
};