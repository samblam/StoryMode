// src/pages/api/surveys/[id]/participants/index.ts
import type { APIRoute } from 'astro';
import { getClient } from '../../../../../lib/supabase';
import { verifyAuthorization } from '../../../../../utils/accessControl';

export const GET: APIRoute = async ({ params, locals }) => {
  console.log('Participants index endpoint called');
  
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    console.log('Verifying authorization');
    // Verify authorization
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'read');
    if (!authorized) {
      console.error('Authorization failed:', authError);
      return new Response(JSON.stringify({ error: authError }), {
        status: 403,
        headers
      });
    }
    console.log('Authorization successful');

    const { id } = params;
    console.log('Survey ID from params:', id);
    
    if (!id) {
      console.error('Survey ID is missing');
      return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
        status: 400,
        headers
      });
    }

    // Get participants for the survey
    console.log('Initializing Supabase client');
    const supabase = getClient({ requiresAdmin: true });
    console.log('Fetching participants for survey ID:', id);
    
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('survey_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching participants:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return new Response(JSON.stringify({
        error: 'Failed to fetch participants',
        details: error.message,
        code: error.code
      }), {
        status: 500,
        headers
      });
    }

    console.log(`Successfully fetched ${data?.length || 0} participants`);
    if (data && data.length > 0) {
      console.log('First participant:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No participants found for this survey');
    }

    return new Response(JSON.stringify({ data, error: null }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error in participants endpoint:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      data: []
    }), {
      status: 500,
      headers
    });
  }
};