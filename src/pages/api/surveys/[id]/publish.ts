import { getClient } from '../../../../lib/supabase';
import { type APIRoute } from 'astro';
import { verifyAuthorization } from '../../../../utils/accessControl';
import { createPublishJob } from '../../../../utils/backgroundJobs';

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const surveyId = params.id;
    if (!surveyId) {
      return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify admin authorization
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError?.message || 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getClient({ requiresAdmin: true });

    // Mark survey as published
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .update({
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', surveyId)
      .select('*')
      .single();

    if (surveyError) {
      console.error('Error updating survey publish status:', surveyError);
      return new Response(JSON.stringify({ error: 'Failed to publish survey' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all inactive participants for this survey
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('survey_id', surveyId)
      .eq('status', 'inactive');

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch participants' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!participants || participants.length === 0) {
      return new Response(JSON.stringify({ error: 'No participants found for this survey' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a background job to handle the email sending and participant activation
    const participantIds = participants.map(p => p.id);
    const jobId = await createPublishJob(surveyId, participantIds);

    return new Response(JSON.stringify({
      success: true,
      message: `Survey published successfully. ${participants.length} participants will be activated in the background.`,
      jobId,
      participants: {
        totalCount: participants.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error publishing survey:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};