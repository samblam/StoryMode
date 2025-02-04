import { getClient } from '~/lib/supabase';
import { type APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request }) => {
  const surveyId = params.id;
  if (!surveyId) {
    return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getClient({ requiresAdmin: true });

    // Get survey details with all related data needed for preview
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select(`
        *,
        sound_profile:sound_profile_id (
          *
        ),
        functions:survey_functions (
          *
        )
      `)
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      return new Response(JSON.stringify({ error: 'Survey not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a preview context that mimics participant view
    const previewContext = {
      survey,
      isPreview: true, // Flag to indicate preview mode
      participant: {
        id: 'preview',
        email: 'preview@example.com',
        status: 'active',
        participant_identifier: 'preview',
        created_at: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(previewContext), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating survey preview:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};