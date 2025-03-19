import { getClient } from '../../../../../lib/supabase';
import { type Database } from '../../../../../types/database';
import { generateUniqueIdentifier, generateSecureToken } from '../../../../../utils/participantUtils';

type Participant = Database['public']['Tables']['participants']['Row'];
import { type APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, request }) => {
  console.log('Manual participant creation started');
  
  const surveyId = params.id;
  if (!surveyId) {
    console.error('Survey ID is missing');
    return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Processing form data for survey ID:', surveyId);
    const formData = await request.formData();
    
    // Log all form data entries for debugging
    console.log('All form data entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`- ${key}: ${value}`);
    }
    
    const email = formData.get('email')?.toString();
    const name = formData.get('name')?.toString() || null;
    
    console.log('Parsed form data:', { email, name });
    
    if (!email) {
      console.error('Email is missing in form data');
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Getting Supabase client');
    const supabase = getClient({ requiresAdmin: true });
    console.log('Supabase client initialized');

    // Check if participant already exists for this survey
    console.log('Checking if participant already exists');
    const { data: existingParticipant, error: existingError } = await supabase
      .from('participants')
      .select()
      .eq('survey_id', surveyId)
      .eq('email', email)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing participant:', existingError);
      return new Response(JSON.stringify({ error: 'Error checking existing participant' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (existingParticipant) {
      console.log('Participant already exists:', existingParticipant);
      return new Response(JSON.stringify({
        error: 'Participant with this email already exists for this survey'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique identifier and access token for survey URL
    console.log('Generating unique identifier and access token');
    const participantIdentifier = await generateUniqueIdentifier();
    const accessToken = await generateSecureToken();
    console.log('Generated identifier:', participantIdentifier);
    console.log('Generated access token:', accessToken);

    console.log('Creating participant with data:', {
      survey_id: surveyId,
      email,
      name,
      status: 'inactive',
      participant_identifier: participantIdentifier,
      access_token: accessToken
    });

    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        survey_id: surveyId,
        email,
        name,
        status: 'inactive', // Set initial status
        participant_identifier: participantIdentifier,
        access_token: accessToken
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating participant:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Log the SQL query that failed if available
      if (error.details) {
        console.error('SQL details:', error.details);
      }
      
      // Log the constraint that failed if it's a constraint error
      if (error.code === '23502') {
        console.error('NOT NULL constraint violation - a required field is missing');
      } else if (error.code === '23503') {
        console.error('Foreign key constraint violation - referenced record does not exist');
        console.error('This likely means the survey_id is invalid or does not exist');
      } else if (error.code === '23505') {
        console.error('Unique constraint violation - record with this key already exists');
      }
      
      // Log the complete participant data that failed
      console.error('Attempted to insert participant with data:', {
        survey_id: surveyId,
        email,
        name,
        status: 'inactive',
        participant_identifier: participantIdentifier
      });
      
      // Create a proper JSON-serializable error object
      const errorObj = {
        message: error.message,
        code: error.code,
        details: error.details ? JSON.stringify(error.details) : null
      };
      
      // Determine the hint based on error code
      const hint = error.code === '23503' ? 'The survey ID may be invalid or does not exist' :
                   error.code === '23502' ? 'A required field is missing' :
                   error.code === '23505' ? 'A participant with this email may already exist for this survey' :
                   'Check server logs for more details';
      
      return new Response(JSON.stringify({
        error: 'Failed to create participant',
        details: JSON.stringify(errorObj), // Properly stringify the error object
        code: error.code,
        hint: hint
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Participant created successfully:', participant);
    return new Response(JSON.stringify({
      message: 'Participant created successfully',
      participant
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};