import { getClient } from '~/lib/supabase';
import { type APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const surveyId = params.id;
    if (!surveyId) {
      return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { 
      participantId, 
      participantToken,
      responses, 
      soundMappingResponses 
    } = body;

    if (!participantId || !participantToken || !responses) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify participant access
    const supabase = getClient({ requiresAdmin: true });
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .eq('access_token', participantToken)
      .single();

    if (participantError || !participant) {
      return new Response(JSON.stringify({ error: 'Invalid participant access' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For preview mode, we skip actual verification and saving
    const isPreview = participantId === 'preview' || participant.id === 'preview';
    if (isPreview) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Preview mode - responses not saved',
        previewData: { responses, soundMappingResponses }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if participant is in active status
    if (participant.status && participant.status !== 'active') {
      return new Response(JSON.stringify({ 
        error: 'This survey is no longer available or has already been completed' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save response data
    const responseData = {
      survey_id: surveyId,
      participant_id: participantId,
      responses,
      sound_mapping_responses: soundMappingResponses || null,
      created_at: new Date().toISOString()
    };

    const { data: savedResponse, error: responseError } = await supabase
      .from('survey_responses')
      .insert([responseData])
      .select()
      .single();

    if (responseError) {
      console.error('Error saving survey response:', responseError);
      return new Response(JSON.stringify({ error: 'Failed to save responses' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update participant status to completed
    const { error: statusError } = await supabase
      .from('participants')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (statusError) {
      console.error('Error updating participant status:', statusError);
      // Don't fail the whole request, we've already saved the response
    }

    // Send completion email if needed (would be implemented in a real system)
    // This would call a function like sendSurveyCompletionEmail(surveyId, participant)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Survey responses saved successfully',
      responseId: savedResponse.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving survey responses:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};