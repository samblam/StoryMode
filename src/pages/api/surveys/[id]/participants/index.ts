// src/pages/api/surveys/[id]/participants/index.ts
import type { APIRoute } from 'astro';
import { getClient } from '../../../../../lib/supabase';
import { verifyAuthorization } from '../../../../../utils/accessControl';

export const GET: APIRoute = async ({ params, locals, request }) => {
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

    // Extract query parameters
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search') || '';
    const filterEmail = url.searchParams.get('email') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get participants for the survey
    console.log('Initializing Supabase client');
    const supabase = getClient({ requiresAdmin: true });
    console.log('Fetching participants for survey ID:', id);
    
    let query = supabase
      .from('participants')
      .select('*', { count: 'exact' })
      .eq('survey_id', id)
      .order('created_at', { ascending: true });

    // Apply search filter
    if (searchTerm) {
      query = query.ilike('email', `%${searchTerm}%`); // Example: searching by email
    }

    // Apply email filter
    if (filterEmail) {
      query = query.eq('email', filterEmail);
    }

    // Apply status filter
    if (filterStatus) {
      query = query.eq('status', filterStatus);
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

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

    return new Response(JSON.stringify({ 
      data, 
      error: null,
      total: count || 0 // total number of items
    }), {
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