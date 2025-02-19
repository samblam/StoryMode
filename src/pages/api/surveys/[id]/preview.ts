import { getClient } from '~/lib/supabase';
import { type APIRoute } from 'astro';
import { verifyAuthorization } from '../../../../utils/accessControl';

interface SurveyFunction {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface SurveySound {
  id: string;
  sound_id: string;
  intended_function: string;
  order_index: number;
  sounds: {
    id: string;
    name: string;
    url: string;
    duration: number;
  };
}

export const GET: APIRoute = async ({ params, request, locals }) => {
  const surveyId = params.id;
  if (!surveyId) {
    return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify admin authorization
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'read');
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getClient({ requiresAdmin: true });

    // Get survey details with all related data needed for preview
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select(`
        *,
        sound_profile:sound_profile_id (
          id,
          title,
          description,
          sounds (
            id,
            name,
            url,
            duration,
            description
          )
        ),
        functions:survey_functions (
          id,
          name,
          description,
          order_index
        ),
        survey_sounds (
          id,
          sound_id,
          intended_function,
          order_index,
          sounds (
            id,
            name,
            url,
            duration
          )
        )
      `)
      .eq('id', surveyId)
      .single();

    if (surveyError) {
      console.error('Error fetching survey:', surveyError);
      return new Response(JSON.stringify({ error: 'Failed to fetch survey data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!survey) {
      return new Response(JSON.stringify({ error: 'Survey not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required survey data
    if (!survey.sound_profile) {
      return new Response(JSON.stringify({ error: 'Survey sound profile not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!survey.functions?.length) {
      return new Response(JSON.stringify({ error: 'Survey functions not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!survey.survey_sounds?.length) {
      return new Response(JSON.stringify({ error: 'Survey sounds not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a preview context that mimics participant view
    const previewContext = {
      survey: {
        ...survey,
        // Sort functions by order_index
        functions: (survey.functions as SurveyFunction[]).sort((a: SurveyFunction, b: SurveyFunction) => a.order_index - b.order_index),
        // Sort survey sounds by order_index
        survey_sounds: (survey.survey_sounds as SurveySound[]).sort((a: SurveySound, b: SurveySound) => a.order_index - b.order_index)
      },
      isPreview: true, // Flag to indicate preview mode
      participant: {
        id: 'preview',
        email: 'preview@example.com',
        status: 'active',
        participant_identifier: 'PREVIEW_USER',
        created_at: new Date().toISOString(),
        survey_id: surveyId
      },
      // Add preview-specific settings
      settings: {
        allowSkip: true, // Allow skipping in preview mode
        showDebugInfo: true, // Show additional debug information
        saveResponses: false // Don't save responses in preview mode
      }
    };

    return new Response(JSON.stringify(previewContext), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating survey preview:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};