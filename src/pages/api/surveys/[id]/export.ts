import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
    try {
        const surveyId = params.id;
        
        // Fetch survey data with responses
        const { data, error } = await supabase
            .from('survey_responses')
            .select('*')
            .eq('survey_id', surveyId);

        if (error) throw error;

        // Convert to CSV
        const csv = convertToCSV(data);

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="survey-${surveyId}-export.csv"`
            }
        });
    } catch (error) {
        console.error('Export error:', error);
        return new Response(
            JSON.stringify({ error: 'Export failed' }),
            { status: 500 }
        );
    }
};

function convertToCSV(data: any[]): string {
    // Implement CSV conversion
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => 
        Object.values(row).map(value => 
            typeof value === 'string' ? `"${value}"` : value
        ).join(',')
    );
    return [headers, ...rows].join('\n');
}