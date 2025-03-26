  import { getClient } from '~/lib/supabase';
import { type APIRoute } from 'astro';
import { sendEmail, createSurveyCompletionEmail } from '~/utils/emailUtils';

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

    console.log(`[Survey Response] Received submission for survey ${surveyId}`);
    console.log(`[Survey Response] Attempting auth with participantId: ${participantId}, participantToken: ${participantToken}`);

    // Verify participant access
    const supabase = getClient({ requiresAdmin: true });
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      // Use the custom identifier for lookup, not the UUID 'id'
      .eq('participant_identifier', participantId)
      .eq('access_token', participantToken)
      .single();

    console.log(`[Survey Response] Supabase auth query result (using identifier): participant=${JSON.stringify(participant)}, error=${JSON.stringify(participantError)}`);

    if (participantError || !participant) {
      console.error(`[Survey Response] Auth failed for participantIdentifier: ${participantId}. Error: ${participantError ? JSON.stringify(participantError) : 'Participant not found or token mismatch'}`);
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

    // Prepare merged data for the single JSONB column
    const mergedData = {
      general: responses || {}, // Store general answers under 'general' key
      sound_mapping: soundMappingResponses || {} // Store sound mapping under 'sound_mapping' key
    };

    // Save response data using the existing sound_mapping_responses column
    const responseData = {
      survey_id: surveyId,
      // Correct: Use the actual participant UUID from the fetched object
      participant_id: participant.id,
      // Store the merged object in the existing JSONB column
      sound_mapping_responses: mergedData,
      created_at: new Date().toISOString()
    };

    console.log('[Survey Response] Saving merged data to sound_mapping_responses:', JSON.stringify(responseData));

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

    // Get survey details for the completion email
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (!surveyError && survey) {
      try {
        // Send completion email to participant if they have an email
        if (participant.email) {
          const { subject, html } = createSurveyCompletionEmail(
            survey,
            participant.name || ''
          );
          
          await sendEmail({
            to: participant.email,
            subject,
            html,
            replyTo: survey.contact_email || undefined
          });
        }
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
        // Don't fail the whole request if email sending fails
      }
    }

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