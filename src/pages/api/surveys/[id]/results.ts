import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { verifyAuthorization, canViewSurveyResults } from '../../../../utils/accessControl';
import { handleRLSError, isRLSError } from '../../../../utils/accessControl';
import type { User } from '../../../../types/auth';
import type { PostgrestError } from '@supabase/supabase-js';

function getErrorMessage(error: PostgrestError): string {
  return error?.message || 'Unknown error occurred';
}

interface SurveySound {
  sound_id: string;
  intended_function: string;
  sounds: {
    id: string;
    name: string;
  }[];
}

interface SurveyResult {
  total_responses: number;
  completed_responses: number;
  sound_matches: {
    sound_id: string;
    sound_name: string;
    intended_function: string;
    correct_matches: number;
    incorrect_matches: number;
    matched_functions: { function: string; count: number }[];
  }[];
}

export const get: APIRoute = async ({ params, locals }) => {
  try {
    const user = locals.user as User | undefined;
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing survey ID' }), {
        status: 400,
      });
    }

    // First, get the survey to check permissions and status
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('client_id, visible_to_client, status')
      .eq('id', id)
      .single();

    if (surveyError) {
      const postgrestError = surveyError as PostgrestError;
      if (isRLSError(postgrestError)) {
        return handleRLSError(postgrestError);
      }
      return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
        status: 500,
      });
    }

    if (!survey) {
      return new Response(JSON.stringify({ error: 'Survey not found' }), {
        status: 404,
      });
    }

    // Check if survey is completed
    if (survey.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Results are only available for completed surveys' }), {
        status: 403,
      });
    }

    // Check if user can view results
    if (!canViewSurveyResults(user, survey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Get all responses and matches
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select(`
        id,
        completed,
        survey_matches (
          sound_id,
          matched_function,
          correct_match,
          sounds (
            id,
            name
          )
        )
      `)
      .eq('survey_id', id);

    if (responsesError) {
      const postgrestError = responsesError as PostgrestError;
      if (isRLSError(postgrestError)) {
        return handleRLSError(postgrestError);
      }
      return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
        status: 500,
      });
    }

    // Get survey sounds for intended functions
    const { data: surveySounds, error: soundsError } = await supabase
      .from('survey_sounds')
      .select(`
        sound_id,
        intended_function,
        sounds (
          id,
          name
        )
      `)
      .eq('survey_id', id);

    if (soundsError) {
      const postgrestError = soundsError as PostgrestError;
      if (isRLSError(postgrestError)) {
        return handleRLSError(postgrestError);
      }
      return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
        status: 500,
      });
    }

    // Calculate results
    const results: SurveyResult = {
      total_responses: responses?.length || 0,
      completed_responses: responses?.filter(r => r.completed).length || 0,
      sound_matches: (surveySounds as SurveySound[])?.map(sound => {
        const matches = responses?.flatMap(r => r.survey_matches)
          .filter(m => m.sound_id === sound.sound_id) || [];

        const matchedFunctions = matches.reduce((acc, match) => {
          const existing = acc.find(f => f.function === match.matched_function);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ function: match.matched_function, count: 1 });
          }
          return acc;
        }, [] as { function: string; count: number }[]);

        return {
          sound_id: sound.sound_id,
          sound_name: sound.sounds && sound.sounds[0] ? sound.sounds[0].name : 'Unknown Sound',
          intended_function: sound.intended_function,
          correct_matches: matches.filter(m => m.correct_match).length,
          incorrect_matches: matches.filter(m => !m.correct_match).length,
          matched_functions: matchedFunctions,
        };
      }) || [],
    };

    return new Response(JSON.stringify({ data: results }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error in GET /api/surveys/[id]/results:', error);
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
    const { visible_to_client } = body;

    const { data, error } = await supabase
      .from('surveys')
      .update({ visible_to_client })
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
    console.error('Error in PUT /api/surveys/[id]/results:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};