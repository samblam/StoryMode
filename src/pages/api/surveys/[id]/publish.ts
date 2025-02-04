import { getClient } from '~/lib/supabase';
import { type APIRoute } from 'astro';
import { generateSurveyUrl } from '~/utils/participantUtils';
import { sendEmail } from '~/utils/emailUtils';

const BATCH_SIZE = 50; // Process emails in batches

export const POST: APIRoute = async ({ params, request }) => {
  const surveyId = params.id;
  if (!surveyId) {
    return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getClient({ requiresAdmin: true });

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      return new Response(JSON.stringify({ error: 'Survey not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if survey is already published
    if (survey.status === 'published') {
      return new Response(JSON.stringify({ error: 'Survey is already published' }), {
        status: 400,
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

    // Update survey status to published
    const { error: updateSurveyError } = await supabase
      .from('surveys')
      .update({ status: 'published' })
      .eq('id', surveyId);

    if (updateSurveyError) {
      return new Response(JSON.stringify({ error: 'Failed to update survey status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = {
      totalParticipants: participants.length,
      emailsSent: 0,
      emailErrors: [] as string[],
    };

    // Process participants in batches
    for (let i = 0; i < participants.length; i += BATCH_SIZE) {
      const batch = participants.slice(i, i + BATCH_SIZE);
      
      // Update participant statuses to active
      const { error: updateError } = await supabase
        .from('participants')
        .update({ status: 'active' })
        .in('id', batch.map(p => p.id));

      if (updateError) {
        console.error('Error updating participant statuses:', updateError);
        continue;
      }

      // Send emails in parallel for the batch
      const emailPromises = batch.map(async (participant) => {
        try {
          const surveyUrl = generateSurveyUrl(
            new URL(request.url).origin,
            surveyId,
            participant.participant_identifier
          );

          await sendEmail({
            to: participant.email,
            subject: `Survey Invitation: ${survey.title}`,
            html: `
              <h2>You're invited to participate in a survey</h2>
              <p>You have been invited to participate in the survey: ${survey.title}</p>
              <p>Please click the link below to access your unique survey:</p>
              <p><a href="${surveyUrl}">${surveyUrl}</a></p>
              <p>This link is unique to you and should not be shared with others.</p>
            `
          });

          results.emailsSent++;
        } catch (error) {
          console.error('Error sending email:', error);
          results.emailErrors.push(participant.email);
        }
      });

      await Promise.all(emailPromises);
    }

    // Return results
    if (results.emailErrors.length > 0) {
      return new Response(JSON.stringify({
        warning: 'Survey published with some email sending failures',
        results
      }), {
        status: 207,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      message: 'Survey published successfully',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error publishing survey:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};