import { getClient } from '../../../../lib/supabase';
import { type APIRoute } from 'astro';
import { verifyAuthorization } from '../../../../utils/accessControl';
import { createPublishJob } from '../../../../utils/backgroundJobs';
import { generateSecureToken, generateParticipantUrl } from '../../../../utils/participantUtils';

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

    console.log('PUBLIC_BASE_URL environment variable:', process.env.PUBLIC_BASE_URL);
    console.log('Total participants to process:', participants.length);
    
    // Log participants for debugging
    console.log('Participants to be processed:', participants.map(p => ({
      id: p.id,
      email: p.email,
      identifier: p.participant_identifier,
      token: p.access_token ? 'exists' : 'missing'
    })));
    
    // Generate access tokens for inactive participants
    const participantsWithTokens = await Promise.all(
      participants.map(async (participant) => {
        console.log(`Generating token for participant ${participant.id} (${participant.email})`);
        const accessToken = await generateSecureToken();
        console.log(`Generated token for participant ${participant.id}: ${accessToken.substring(0, 8)}...`);
        
        try {
          // Test URL generation directly to check for issues
          const testUrl = await generateParticipantUrl(surveyId, participant.id);
          console.log(`Test URL generation for ${participant.email}: ${testUrl}`);
        } catch (urlError) {
          console.error(`ERROR testing URL generation for ${participant.id}:`, urlError);
        }
        
        // Update participant with access token and published_at
        const now = new Date().toISOString();
        const { data: updatedParticipant, error: updateError } = await supabase
          .from('participants')
          .update({
            access_token: accessToken,
            published_at: now, // Add published_at timestamp
            updated_at: now
          })
          .eq('id', participant.id)
          .select('*')
          .single();
          
        if (updateError) {
          console.error(`Error updating participant ${participant.id} with access token:`, updateError);
          throw new Error(`Failed to update participant ${participant.id} with access token: ${updateError.message}`);
        }
        
        console.log(`Successfully updated participant ${participant.id} (${participant.email}) with token`);
        return updatedParticipant;
      })
    );

    // Verify participants have tokens before creating job
    console.log('Participants after token generation:', participantsWithTokens.map(p => ({
      id: p.id,
      email: p.email,
      hasToken: !!p.access_token,
      tokenPrefix: p.access_token ? p.access_token.substring(0, 8) : 'none'
    })));

    // Create a background job to handle the email sending and participant activation
    const participantIds = participantsWithTokens.map(p => p.id);
    console.log(`Creating background job for ${participantIds.length} participants`);
    const jobId = await createPublishJob(surveyId, participantIds);
    console.log(`Created background job with ID: ${jobId}`);

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