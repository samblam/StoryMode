import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { verifyAuthorization } from '../../../utils/accessControl';

// Add PUT handler for complete survey update
export const PUT: APIRoute = async ({ request, params, locals }) => {
    try {
        // Verify admin authorization
        const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
        if (!authorized) {
            console.error('Survey PUT: Authorization failed:', authError);
            return new Response(JSON.stringify({ error: authError }), {
                status: 403
            });
        }

        const { id } = params;
        if (!id) {
            console.error('Survey PUT: No ID provided');
            return new Response(JSON.stringify({ error: 'Survey ID required' }), {
                status: 400
            });
        }

        const data = await request.json();
        
        // Validate required fields
        const requiredFields = ['title', 'description', 'status'];
        const missingFields = requiredFields.filter(field => !(field in data));
        if (missingFields.length > 0) {
            console.error('Survey PUT: Missing required fields:', missingFields);
            return new Response(JSON.stringify({ 
                error: 'Missing required fields',
                details: `Required fields missing: ${missingFields.join(', ')}`
            }), {
                status: 400
            });
        }

        // Update survey with complete data
        const { error: updateError } = await supabase
            .from('surveys')
            .update({
                title: data.title,
                description: data.description,
                status: data.status,
                client_id: data.client_id,
                sound_profile_id: data.sound_profile_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Survey PUT: Database error:', updateError);
            throw updateError;
        }

        // Log successful update
        console.log('Survey PUT: Successfully updated survey:', id);

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Survey updated successfully'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Survey PUT: Unexpected error:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Failed to update survey',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};

// Add PATCH handler
export const PATCH: APIRoute = async ({ request, params, locals }) => {
    try {
        // Verify admin authorization
        const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
        if (!authorized) {
            console.error('Authorization failed:', authError);
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

// Add GET handler for survey data
export const GET: APIRoute = async ({ request, params, locals }) => {
    try {
        const { id } = params;
        if (!id) {
            console.error('Survey GET: No ID provided');
            return new Response(JSON.stringify({ error: 'Survey ID required' }), {
                status: 400
            });
        }

        // Log authentication context
        console.log('Survey GET: Auth context', {
            user: locals.user ? {
                id: locals.user.id,
                role: locals.user.role,
                email: locals.user.email
            } : null,
            headers: {
                auth: request.headers.get('Authorization'),
                cookie: request.headers.get('Cookie')
            }
        });

        // Verify authorization
        const { authorized, error: authError } = await verifyAuthorization(locals.user, locals.user?.role || 'client', 'read');
        if (!authorized) {
            console.error('Survey GET: Authorization failed', authError);
            return new Response(JSON.stringify({ error: authError }), {
                status: 403
            });
        }

        // Fetch survey with all related data
        const { data, error } = await supabase
            .from('surveys')
            .select(`
                *,
                client:clients (
                    id,
                    name,
                    email
                ),
                sound_profiles (
                    id,
                    title
                ),
                survey_sounds (
                    id,
                    sound_id,
                    intended_function,
                    order_index,
                    sounds (
                        id,
                        name,
                        file_path,
                        storage_path,
                        profile_id
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Survey GET: Database error', error);
            throw error;
        }

        if (!data) {
            console.error('Survey GET: No data found for ID', id);
            return new Response(JSON.stringify({ 
                error: 'Survey not found',
                details: `No survey found with ID: ${id}`
            }), {
                status: 404
            });
        }

        // Log successful fetch
        console.log('Survey GET: Successfully fetched data for ID', id);

        return new Response(JSON.stringify({ data }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Survey GET: Unexpected error', error);
        return new Response(
            JSON.stringify({ 
                error: 'Failed to fetch survey data',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};