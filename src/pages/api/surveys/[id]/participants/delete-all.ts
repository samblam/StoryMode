import type { APIRoute } from 'astro';
import { getClient } from '../../../../../lib/supabase';
import { verifyAuthorization } from '../../../../../utils/accessControl';

export const POST: APIRoute = async ({ params, locals }) => {
  console.log('Delete all participants endpoint called');

  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    console.log('Verifying authorization');
    // Verify authorization
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
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

    // Delete all participants for the survey
    console.log('Initializing Supabase client');
    const supabase = getClient({ requiresAdmin: true });
    console.log('Deleting all participants for survey ID:', id);

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('survey_id', id);

    if (error) {
      console.error('Error deleting participants:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return new Response(JSON.stringify({
        error: 'Failed to delete participants',
        details: error.message,
        code: error.code
      }), {
        status: 500,
        headers
      });
    }

    console.log('Successfully deleted all participants for survey ID:', id);

    return new Response(JSON.stringify({ message: 'Successfully deleted all participants' }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error in delete all participants endpoint:', error);
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