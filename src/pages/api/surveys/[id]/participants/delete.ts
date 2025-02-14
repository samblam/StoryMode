import { getClient } from '../../../../../lib/supabase';
import { checkAdminAccess } from '../../../../../utils/accessControl';
import type { APIContext, AstroGlobal } from 'astro'; // Import AstroGlobal type

export async function post(context: APIContext) { // Pass APIContext as context
    try {
        // Check admin access
        const accessGranted = await checkAdminAccess(context as AstroGlobal); // Cast context to AstroGlobal
        if (!accessGranted) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const participantId = context.request.headers.get('participant-id'); // Use context.request
        const surveyId = context.params.id; // Use context.params


        if (!participantId) {
            return new Response(JSON.stringify({ error: 'Participant ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!surveyId) {
            return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const supabase = getClient(); // Call getClient without context argument

        // Delete participant from the database
        const { error } = await supabase
            .from('participants')
            .delete()
            .eq('id', participantId)
            .eq('survey_id', surveyId); // Removed .auth(...)


        if (error) {
            console.error('Error deleting participant:', error);
            return new Response(JSON.stringify({ error: 'Failed to delete participant' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ message: 'Participant deleted successfully' }), {
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
}