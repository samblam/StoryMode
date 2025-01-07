// src/pages/api/surveys/[id]/delete.ts
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import { rateLimitMiddleware } from '../../../../utils/rateLimit';
import { verifyAuthorization } from '../../../../utils/accessControl';

export const POST: APIRoute = async ({ request, params, locals }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('DELETE')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    // Verify admin authorization
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'admin');
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError }), { 
        status: 403,
        headers 
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Survey ID is required' }), { 
        status: 400,
        headers 
      });
    }

    // First get survey responses to delete their associated matches
    const { data: responses } = await supabaseAdmin
      .from('survey_responses')
      .select('id')
      .eq('survey_id', id);

    if (responses && responses.length > 0) {
      // Delete sound matches for each response
      for (const response of responses) {
        const { error: matchError } = await supabaseAdmin
          .from('sound_matches')
          .delete()
          .eq('response_id', response.id);

        if (matchError) {
          console.error('Error deleting sound matches:', matchError);
          throw new Error(`Failed to delete sound matches for response ${response.id}`);
        }
      }
    }

    // Delete survey responses
    const { error: responsesError } = await supabaseAdmin
      .from('survey_responses')
      .delete()
      .eq('survey_id', id);

    if (responsesError) {
      console.error('Error deleting survey responses:', responsesError);
      throw new Error('Failed to delete survey responses');
    }

    // Delete survey sounds
    const { error: soundsError } = await supabaseAdmin
      .from('survey_sounds')
      .delete()
      .eq('survey_id', id);

    if (soundsError) {
      console.error('Error deleting survey sounds:', soundsError);
      throw new Error('Failed to delete survey sounds');
    }

    // Finally, delete the survey itself
    const { error: surveyError } = await supabaseAdmin
      .from('surveys')
      .delete()
      .eq('id', id);

    if (surveyError) {
      console.error('Error deleting survey:', surveyError);
      throw new Error('Failed to delete survey');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to delete survey'
    }), {
      status: 500,
      headers
    });
  }
};