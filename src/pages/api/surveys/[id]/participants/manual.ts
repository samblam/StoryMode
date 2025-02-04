import { getClient } from '~/lib/supabase';
import { type Database } from '~/types/database';
import { generateUniqueIdentifier } from '~/utils/participantUtils';

type Participant = Database['public']['Tables']['participants']['Row'];
import { type APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, request }) => {
  const surveyId = params.id;
  if (!surveyId) {
    return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getClient({ requiresAdmin: true });

    // Check if participant already exists for this survey
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select()
      .eq('survey_id', surveyId)
      .eq('email', email)
      .single();

    if (existingParticipant) {
      return new Response(JSON.stringify({ 
        error: 'Participant with this email already exists for this survey' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique identifier for survey URL
    const participantIdentifier = await generateUniqueIdentifier();

    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        survey_id: surveyId,
        email,
        status: 'inactive', // Set initial status
        participant_identifier: participantIdentifier
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating participant:', error);
      return new Response(JSON.stringify({ error: 'Failed to create participant' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Participant created successfully', 
      participant 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};