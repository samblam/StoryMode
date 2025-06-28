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
      matches, // Expected format from matching.astro
      responses, // Keep for general responses if any
      soundMappingResponses // Keep for other response types if any
    } = body;

    if (!participantId || !participantToken || (!matches && !responses)) {
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
      .select('*') // Select necessary fields
      .eq('id', participantId) // Use participant ID from payload
      .eq('access_token', participantToken)
      .maybeSingle(); // Handle potential null result gracefully

    console.log(`[Survey Response] Supabase auth query result: participant=${JSON.stringify(participant)}, error=${JSON.stringify(participantError)}`);

    if (participantError || !participant) {
      console.error(`[Survey Response] Auth failed for participantIdentifier: ${participantId}. Error: ${participantError ? JSON.stringify(participantError) : 'Participant not found or token mismatch'}`);
      return new Response(JSON.stringify({ error: 'Invalid participant access' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
     // Check survey ID match
     if (participant.survey_id !== surveyId) {
        console.error(`[Survey Response] Participant ${participant.id} attempting to access wrong survey ${surveyId} (expected ${participant.survey_id})`);
        return new Response(JSON.stringify({ error: 'Participant not authorized for this survey' }), {
            status: 403, headers: { 'Content-Type': 'application/json' }
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
      console.warn(`[Survey Response] Participant ${participant.id} status is not active: ${participant.status}`);
      return new Response(JSON.stringify({
        error: 'This survey is no longer available or has already been completed'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare merged data for the single JSONB column in survey_responses
    const mergedData = {
      general: responses || {}, // Store general answers under 'general' key
      sound_mapping: soundMappingResponses || {} // Store sound mapping under 'sound_mapping' key
    };

    // Save main response data
    const responseData = {
      survey_id: surveyId,
      participant_id: participant.id, // Use the actual participant UUID
      sound_mapping_responses: mergedData, // Store the merged object
      created_at: new Date().toISOString(),
      completed: false // Initially set to false, will be updated later
    };

    console.log('[Survey Response] Saving main response data:', JSON.stringify(responseData));

    const { data: savedResponse, error: responseError } = await supabase
      .from('survey_responses')
      .insert([responseData])
      .select()
      .single();

    if (responseError || !savedResponse) {
      console.error('Error saving survey response:', responseError);
      return new Response(JSON.stringify({ error: 'Failed to save survey response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
     console.log(`[Survey Response] Main response saved with ID: ${savedResponse.id}`);


    // ** Save individual answers to survey_matches **
    if (matches && Array.isArray(matches)) {
      console.log('[Survey Response] Processing matches for survey_matches:', JSON.stringify(matches));
      const matchesToInsert = matches.map(match => {
        const isCorrect = match.soundId === match.intendedSoundId;
        return {
          response_id: savedResponse.id,
          sound_id: match.soundId,
          question_id: match.functionId, // The unique ID of the function box
          matched_function: match.matchedFunctionDescription,
          correct_match: isCorrect,
        };
      });

      if (matchesToInsert.length > 0) {
        console.log(`[Survey Response] Inserting ${matchesToInsert.length} records into survey_matches...`);
        const { error: matchError } = await supabase
          .from('survey_matches')
          .insert(matchesToInsert);

        if (matchError) {
          console.error(`[Survey Response] Error saving to survey_matches for response ${savedResponse.id}:`, matchError);
          // Decide if this should be a fatal error or just logged
        } else {
          console.log(`[Survey Response] Successfully saved ${matchesToInsert.length} records to survey_matches for response ${savedResponse.id}`);
        }
      } else {
        console.log(`[Survey Response] No valid entries found in matches array to save to survey_matches.`);
      }
    } else {
      console.warn(`[Survey Response] Matches array is missing or not an array, skipping survey_matches save.`);
    }
    // ** END Save to survey_matches **

     // Update survey_responses table to set completed to true NOW that matches are saved (or attempted)
     console.log(`[Survey Response] Updating survey_responses record ${savedResponse.id} to completed=true`);
     const { error: surveyResponseUpdateError } = await supabase
       .from('survey_responses')
       .update({ completed: true })
       .eq('id', savedResponse.id);

     if (surveyResponseUpdateError) {
       // Log error but don't necessarily fail the request
       console.error(`[Survey Response] Error updating survey_responses completed field for ${savedResponse.id}:`, surveyResponseUpdateError);
     }


    // Update participant status to completed and invalidate token
    console.log(`[Survey Response] Attempting to update participant ${participant.id} status to completed and invalidate token...`);
    const { error: statusError } = await supabase
      .from('participants')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        access_token: null // Invalidate the token
      })
      .eq('id', participant.id); // Correct: Use the actual participant UUID

    if (statusError) {
      console.error('Error updating participant status:', statusError);
      // Don't fail the whole request, we've already saved the response
    } else {
      console.log(`[Survey Response] Successfully updated participant ${participant.id} status to completed and invalidated token.`);
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
           console.log(`[Survey Response] Completion email sent to ${participant.email}`);
        } else {
             console.log(`[Survey Response] Participant ${participant.id} has no email, skipping completion email.`);
        }
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
        // Don't fail the whole request if email sending fails
      }
    } else {
         console.error(`[Survey Response] Could not fetch survey details (ID: ${surveyId}) for completion email. Error: ${surveyError}`);
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