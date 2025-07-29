import { getClient } from '../../lib/supabase';
import { type APIRoute } from 'astro';
import { generateParticipantUrl, generateSecureToken, generateUniqueIdentifier } from '../../utils/participantUtils';

export const GET: APIRoute = async () => {
  try {
    // No authentication required for this test endpoint
    console.log('Test endpoint - No auth required');

    const supabase = getClient({ requiresAdmin: true });

    // Get an existing survey for testing
    const { data: surveys, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title')
      .limit(1);

    if (surveyError || !surveys || surveys.length === 0) {
      return new Response(JSON.stringify({ error: 'No surveys found for testing' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const testSurvey = surveys[0];

    // Create a test participant
    const participantIdentifier = await generateUniqueIdentifier();
    const accessToken = await generateSecureToken();
    
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        survey_id: testSurvey.id,
        participant_identifier: participantIdentifier,
        access_token: accessToken,
        status: 'active',
        name: 'Test Participant',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (participantError || !participant) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create test participant',
        details: participantError?.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate URL for the participant
    const url = await generateParticipantUrl(testSurvey.id, participant.id);

    // Parse the URL to verify the parameters
    const parsedUrl = new URL(url);
    const participantId = parsedUrl.searchParams.get('participant_id');
    const token = parsedUrl.searchParams.get('token');

    return new Response(JSON.stringify({
      success: true,
      survey: testSurvey,
      participant: {
        id: participant.id,
        identifier: participant.participant_identifier,
        accessToken: participant.access_token
      },
      url,
      urlParameters: {
        participantId,
        token
      },
      verification: {
        idMatches: participantId === participant.participant_identifier,
        tokenMatches: token === participant.access_token
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test-participant-url:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};