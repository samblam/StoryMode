import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
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

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user as User | undefined;
    const { authorized, error: authError } = await verifyAuthorization(user, 'admin', 'read');
    
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError }), {
        status: 403,
      });
    }

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

    // Validate required fields
    if (!title || !client_id) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), { status: 400 });
    }

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
        title,
        description,
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
      return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
        status: 500,
      });
    }

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
        return new Response(JSON.stringify({ error: getErrorMessage(postgrestError) }), {
          status: 500,
        });
      }
      
      console.log('Successfully added survey sounds');
    }

    return new Response(JSON.stringify({
      data: survey,
      message: 'Survey created successfully'
    }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error in POST /api/surveys:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};