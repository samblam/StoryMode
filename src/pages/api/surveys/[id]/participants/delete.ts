import { getClient } from '../../../../../lib/supabase';
import { verifyAuthorization } from '../../../../../utils/accessControl';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, request, locals }) => {
    console.log('Delete participant endpoint called');
    
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

        const surveyId = params.id;
        console.log('Survey ID from params:', surveyId);
        
        if (!surveyId) {
            console.error('Survey ID is missing');
            return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
                status: 400,
                headers
            });
        }

        // Parse the request body to get the participantId
        const body = await request.json();
        const participantId = body.participantId;
        console.log('Participant ID from request body:', participantId);

        if (!participantId) {
            console.error('Participant ID is missing in request body');
            return new Response(JSON.stringify({ error: 'Participant ID is required' }), {
                status: 400,
                headers
            });
        }

        console.log('Initializing Supabase client');
        const supabase = getClient({ requiresAdmin: true });
        console.log('Deleting participant with ID:', participantId, 'from survey:', surveyId);

        // Delete participant from the database
        const { error } = await supabase
            .from('participants')
            .delete()
            .eq('id', participantId)
            .eq('survey_id', surveyId);


        if (error) {
            console.error('Error deleting participant:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return new Response(JSON.stringify({
                error: 'Failed to delete participant',
                details: error.message,
                code: error.code
            }), {
                status: 500,
                headers
            });
        }

        console.log('Successfully deleted participant with ID:', participantId, 'from survey:', surveyId);

        return new Response(JSON.stringify({ message: 'Participant deleted successfully' }), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Error in delete participant endpoint:', error);
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