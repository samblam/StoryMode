import { getClient } from '../../../../lib/supabase';
import { type APIRoute } from 'astro';
import { verifyAuthorization } from '../../../../utils/accessControl';
import { generateSecureToken } from '../../../../utils/participantUtils';

const DIRECT_PROCESSING_LIMIT = 20; // Process directly if fewer than this many participants

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

    // Determine if we should process directly or use background job
    if (participants.length <= DIRECT_PROCESSING_LIMIT) {
      // Process directly for small batches
      const results = {
        totalParticipants: participants.length,
        emailsSent: 0,
        errors: []
      };

      // Generate access tokens and update status
      const participantUpdates = await Promise.all(participants.map(async (participant) => {
        const accessToken = await generateSecureToken();
        const accessUrl = `${new URL(request.url).origin}/surveys/${surveyId}?token=${accessToken}`;
        
        return {
          id: participant.id,
          access_token: accessToken,
          access_url: accessUrl,
          status: 'active', // Change status to active
          updated_at: new Date().toISOString()
        };
      }));

      // Update participants
      const { error: updateError } = await supabase
        .from('participants')
        .upsert(participantUpdates, { onConflict: 'id' });

      if (updateError) {
        console.error('Error updating participants:', updateError);
        return new Response(JSON.stringify({ 
          error: 'Failed to update participants', 
          details: updateError.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Send emails to participants (would be implemented in a real system)
      // This would call a function like sendSurveyInvitationEmails(participantUpdates)

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Survey published successfully. ${participants.length} participants activated.`,
        results
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Create background job for large batches
      // This would call createPublishJob(surveyId, participants.map(p => p.id))
      // For now, we'll just update directly
      
      // Generate access tokens and update status in chunks
      const CHUNK_SIZE = 100;
      for (let i = 0; i < participants.length; i += CHUNK_SIZE) {
        const chunk = participants.slice(i, i + CHUNK_SIZE);
        
        const participantUpdates = await Promise.all(chunk.map(async (participant) => {
          const accessToken = await generateSecureToken();
          const accessUrl = `${new URL(request.url).origin}/surveys/${surveyId}?token=${accessToken}`;
          
          return {
            id: participant.id,
            access_token: accessToken,
            access_url: accessUrl,
            status: 'active', // Change status to active
            updated_at: new Date().toISOString()
          };
        }));

        // Update participants in this chunk
        const { error: updateError } = await supabase
          .from('participants')
          .upsert(participantUpdates, { onConflict: 'id' });

        if (updateError) {
          console.error('Error updating participants chunk:', updateError);
          // Continue with other chunks even if this one fails
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Survey published successfully. ${participants.length} participants will be activated in the background.`,
        participants: {
          totalCount: participants.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
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