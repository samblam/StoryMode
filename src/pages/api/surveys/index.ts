import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { verifyAuthorization } from '../../../utils/accessControl';
import { handleRLSError, isRLSError } from '../../../utils/accessControl';
import type { User } from '../../../types/auth';
import type { PostgrestError } from '@supabase/supabase-js';

type SurveySound = {
  id: string;
  intended_function: string;
};

function getErrorMessage(error: PostgrestError): string {
  return error?.message || 'Unknown error occurred';
}

// Validation middleware
function validateSurveyData(data: any) {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }
  if (!data.client_id) {
    errors.client_id = 'Client is required';
  }
  if (!data.sound_profile_id) {
    errors.sound_profile_id = 'Sound profile is required';
  }
  if (data.sounds?.length === 0) {
    errors.sounds = 'At least one sound is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user as User | undefined;
    const { authorized, error: authError } = await verifyAuthorization(user, 'admin', 'read');
    
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError }), {
        status: 403,
      });
    }

    const supabase = getClient({ requiresAdmin: true });
    const { data, error } = await supabase
      .from('surveys')
      .select(`
        *,
        client:clients (
          id,
          name,
          email
        ),
        survey_sounds (
          id,
          sound_id,
          intended_function,
          order_index,
          sounds (
            id,
            name,
            url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const postgrestError = error as PostgrestError;
      if (isRLSError(postgrestError)) {
        return handleRLSError(postgrestError);
      }
      return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error in GET /api/surveys:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user as User | undefined;
    const { authorized, error: authError } = await verifyAuthorization(user, 'admin', 'write');
    
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError }), {
        status: 403,
      });
    }

    const body = await request.json();
    console.log('Received survey creation request:', body);

    // Validate request data
    const { isValid, errors } = validateSurveyData(body);
    if (!isValid) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: errors
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const {
      title,
      description,
      client_id,
      sound_profile_id,
      video_url,
      sounds = []
    } = body as {
      title: string;
      description?: string;
      client_id: string;
      sound_profile_id?: string;
      video_url?: string;
      sounds: SurveySound[];
    };

    const supabase = getClient({ requiresAdmin: true });

    // Start a transaction
    console.log('Creating survey with data:', {
      title,
      description,
      client_id,
      sound_profile_id,
      video_url
    });

    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        title: title.trim(),
        description: description?.trim(),
        client_id,
        sound_profile_id,
        video_url,
        active: true,
        approved: false,
        visible_to_client: false
      })
      .select()
      .single();

    if (surveyError) {
      const postgrestError = surveyError as PostgrestError;
      if (isRLSError(postgrestError)) {
        return handleRLSError(postgrestError);
      }
      console.error('Error creating survey:', surveyError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create survey',
        details: getErrorMessage(postgrestError)
      }), {
        status: 500,
      });
    }

    console.log('Survey created successfully with ID:', survey.id); // Add this line
    // Add survey sounds if any
    if (sounds && sounds.length > 0) {
      console.log('Adding survey sounds:', sounds);
      
      const surveySounds = sounds.map((sound, index) => ({
        survey_id: survey.id,
        sound_id: sound.id,
        intended_function: sound.intended_function,
        order_index: index
      }));

      const { error: soundsError } = await supabase
        .from('survey_sounds')
        .insert(surveySounds);

      if (soundsError) {
        console.error('Error adding survey sounds:', soundsError);
        const postgrestError = soundsError as PostgrestError;
        if (isRLSError(postgrestError)) {
          return handleRLSError(postgrestError);
        }
        // Don't fail the whole operation if sounds fail
        console.warn('Failed to add survey sounds:', getErrorMessage(postgrestError));
      } else {
        console.log('Successfully added survey sounds');
      }
    }

    return new Response(JSON.stringify({
      data: survey,
      message: 'Survey created successfully'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in POST /api/surveys:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};