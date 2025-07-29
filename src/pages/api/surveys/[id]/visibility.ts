import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
    try {
        const surveyId = params.id;
        const { data, error } = await supabase
            .from('surveys')
            .select('visible_to_client')
            .eq('id', surveyId)
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ data }), {
            status: 200
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to get visibility settings' }),
            { status: 500 }
        );
    }
};

export const PATCH: APIRoute = async ({ params, request }) => {
    try {
        const surveyId = params.id;
        const { visible_to_client } = await request.json();

        const { error } = await supabase
            .from('surveys')
            .update({ visible_to_client })
            .eq('id', surveyId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 200
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to update visibility' }),
            { status: 500 }
        );
    }
};