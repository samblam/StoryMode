import type { APIContext, APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import type { Database } from '../../../../types/database';

interface FunctionRequest {
    functionName: string;
}

export const post: APIRoute = async (context: APIContext) => {
    const { params, request } = context;
    try {
        const body = await request.json() as FunctionRequest;
        const { id: surveyId } = params;

        if (!surveyId || !body.functionName) {
            return new Response(JSON.stringify({
                error: 'Missing required fields',
                details: {
                    surveyId: !surveyId ? 'Survey ID is required' : null,
                    functionName: !body.functionName ? 'Function name is required' : null
                }
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const functionName = body.functionName.trim();
        if (!functionName) {
            return new Response(JSON.stringify({
                error: 'Invalid function name',
                details: 'Function name cannot be empty'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get current functions
        const { data: survey, error: fetchError } = await supabase
            .from('surveys')
            .select('functions')
            .eq('id', surveyId)
            .single<Database['public']['Tables']['surveys']['Row']>();

        if (fetchError) {
            return new Response(JSON.stringify({
                error: 'Database fetch error',
                details: fetchError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const currentFunctions = Array.isArray(survey?.functions) ? survey.functions : [];

        // Check for duplicate
        if (currentFunctions.includes(functionName)) {
            return new Response(JSON.stringify({
                error: 'Duplicate function',
                details: 'This function already exists for this survey'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Add new function
        const { error: updateError } = await supabase
            .from('surveys')
            .update({
                functions: [...currentFunctions, functionName]
            })
            .eq('id', surveyId);

        if (updateError) {
            return new Response(JSON.stringify({
                error: 'Database update error',
                details: updateError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: {
                functionName,
                totalFunctions: currentFunctions.length + 1
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in survey functions POST:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const del: APIRoute = async (context: APIContext) => {
    const { params, request } = context;
    try {
        const body = await request.json() as FunctionRequest;
        const { id: surveyId } = params;

        if (!surveyId || !body.functionName) {
            return new Response(JSON.stringify({
                error: 'Missing required fields',
                details: {
                    surveyId: !surveyId ? 'Survey ID is required' : null,
                    functionName: !body.functionName ? 'Function name is required' : null
                }
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const functionName = body.functionName.trim();
        if (!functionName) {
            return new Response(JSON.stringify({
                error: 'Invalid function name',
                details: 'Function name cannot be empty'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get current functions
        const { data: survey, error: fetchError } = await supabase
            .from('surveys')
            .select('functions')
            .eq('id', surveyId)
            .single<Database['public']['Tables']['surveys']['Row']>();

        if (fetchError) {
            return new Response(JSON.stringify({
                error: 'Database fetch error',
                details: fetchError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const currentFunctions = Array.isArray(survey?.functions) ? survey.functions : [];

        // Check if function exists
        if (!currentFunctions.includes(functionName)) {
            return new Response(JSON.stringify({
                error: 'Function not found',
                details: 'The specified function does not exist in this survey'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Remove the function
        const { error: updateError } = await supabase
            .from('surveys')
            .update({
                functions: currentFunctions.filter(f => f !== functionName)
            })
            .eq('id', surveyId);

        if (updateError) {
            return new Response(JSON.stringify({
                error: 'Database update error',
                details: updateError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: {
                functionName,
                totalFunctions: currentFunctions.length - 1
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in survey functions DELETE:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};