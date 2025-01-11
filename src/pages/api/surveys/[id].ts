import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { verifyAuthorization } from '../../../utils/accessControl';

// Add PUT handler for complete survey update
export const PUT: APIRoute = async ({ request, params, locals }) => {
    console.log('Survey PUT: Starting request processing');
    try {
        // Log request details
        console.log('Survey PUT: Request details', {
            params,
            user: locals.user,
            headers: {
                contentType: request.headers.get('Content-Type'),
                authorization: request.headers.get('Authorization')
            }
        });

        // Verify admin authorization
        console.log('Survey PUT: Verifying authorization');
        const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
        if (!authorized) {
            console.error('Survey PUT: Authorization failed:', authError);
            return new Response(JSON.stringify({ error: authError }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { id } = params;
        if (!id) {
            console.error('Survey PUT: No ID provided');
            return new Response(JSON.stringify({ error: 'Survey ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse request body
        console.log('Survey PUT: Parsing request body');
        const rawData = await request.text();
        console.log('Survey PUT: Raw request body:', rawData);
        
        let data;
        try {
            data = JSON.parse(rawData);
        } catch (parseError) {
            console.error('Survey PUT: JSON parse error:', parseError);
            return new Response(JSON.stringify({ 
                error: 'Invalid JSON in request body',
                details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Survey PUT: Parsed data:', data);

        // Fetch existing survey data
        console.log('Survey PUT: Fetching existing survey data');
        const { data: existingSurvey, error: fetchError } = await supabase
            .from('surveys')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Survey PUT: Error fetching existing survey:', fetchError);
            return new Response(JSON.stringify({ 
                error: 'Failed to fetch existing survey',
                details: fetchError.message
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!existingSurvey) {
            console.error('Survey PUT: Survey not found:', id);
            return new Response(JSON.stringify({ 
                error: 'Survey not found'
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if this is a status update only
        const isStatusUpdate = Object.keys(data).length === 1 && ('active' in data);
        console.log('Survey PUT: Operation type:', isStatusUpdate ? 'status update' : 'full update');

        // Prepare update data by merging with existing data
        const updateData: Record<string, any> = {
            ...existingSurvey,
            ...data
        };

        // Validate the merged data
        if (!isStatusUpdate) {
            if (!updateData.title || typeof updateData.title !== 'string' || !updateData.title.trim()) {
                return new Response(JSON.stringify({ 
                    error: 'Title is required and must be a non-empty string' 
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Clean up the data
            updateData.title = updateData.title.trim();
            updateData.description = updateData.description ? String(updateData.description).trim() : null;
            updateData.client_id = updateData.client_id || null;
            updateData.sound_profile_id = updateData.sound_profile_id || null;
            updateData.video_url = updateData.video_url || null;
            updateData.functions = Array.isArray(updateData.functions) ? updateData.functions : null;
        }

        // Ensure boolean fields are properly typed
        updateData.active = typeof updateData.active === 'boolean' ? updateData.active : existingSurvey.active;
        updateData.approved = typeof updateData.approved === 'boolean' ? updateData.approved : existingSurvey.approved;
        updateData.visible_to_client = typeof updateData.visible_to_client === 'boolean' ? updateData.visible_to_client : existingSurvey.visible_to_client;

        console.log('Survey PUT: Final update data:', updateData);

        // Update survey
        console.log('Survey PUT: Executing database update');
        const { data: updatedData, error: updateError } = await supabase
            .from('surveys')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Survey PUT: Database error:', updateError);
            return new Response(JSON.stringify({ 
                error: 'Database update failed',
                details: updateError.message
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!updatedData) {
            console.error('Survey PUT: No data returned after update');
            return new Response(JSON.stringify({ 
                error: 'Survey not found or update failed',
                details: 'No data returned from database'
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Log successful update
        console.log('Survey PUT: Successfully updated survey:', id);

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Survey updated successfully',
            data: updatedData
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Survey PUT: Unexpected error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to update survey',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
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