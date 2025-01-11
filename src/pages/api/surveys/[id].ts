import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { verifyAuthorization } from '../../../utils/accessControl';

// Add PATCH handler
export const PATCH: APIRoute = async ({ request, params, locals }) => {
    try {
        // Verify admin authorization
        const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
        if (!authError) {
            return new Response(JSON.stringify({ error: authError }), {
                status: 403
            });
        }

        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'Survey ID required' }), {
                status: 400
            });
        }

        const data = await request.json();
        
        // Update survey
        const { error: updateError } = await supabase
            .from('surveys')
            .update(data)
            .eq('id', id);

        if (updateError) {
            throw updateError;
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200
        });
    } catch (error) {
        console.error('Survey update error:', error);
        return new Response(
            JSON.stringify({ 
                error: error instanceof Error ? error.message : 'Failed to update survey' 
            }),
            { status: 500 }
        );
    }
};

// Add GET handler for stats
export const GET: APIRoute = async ({ params, locals }) => {
    try {
        // Similar authorization check
        
        const { id } = params;
        const { data, error } = await supabase
            .from('surveys')
            .select(`
                *,
                survey_responses (
                    id,
                    status,
                    created_at,
                    success_rate
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ data }), {
            status: 200
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to fetch survey data' }),
            { status: 500 }
        );
    }
};