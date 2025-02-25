import type { APIRoute } from 'astro';
import { getClient } from '../../../../lib/supabase';
import { exportSurveyData, type ExportOptions } from '../../../../utils/surveyExport';
import { verifyAuthorization } from '../../../../utils/accessControl';

export const GET: APIRoute = async ({ params, request, locals }) => {
    try {
        const surveyId = params.id;
        if (!surveyId) {
            return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Verify admin authorization
        const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'read');
        if (!authorized) {
            return new Response(JSON.stringify({ error: authError }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Parse query parameters for export options
        const url = new URL(request.url);
        const format = url.searchParams.get('format') as ExportOptions['format'] || 'csv';
        const includeParticipantInfo = url.searchParams.get('includeParticipantInfo') !== 'false';
        const includeMetadata = url.searchParams.get('includeMetadata') !== 'false';
        const anonymize = url.searchParams.get('anonymize') === 'true';
        const includeTimestamps = url.searchParams.get('includeTimestamps') !== 'false';
        
        // Create export options
        const options: ExportOptions = {
            format,
            includeParticipantInfo,
            includeMetadata,
            anonymize,
            includeTimestamps,
            filterByStatus: url.searchParams.get('filterByStatus')?.split(',') as string[] || ['completed'],
            sortBy: url.searchParams.get('sortBy') || 'created_at',
            sortDirection: url.searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc',
            excludeFields: url.searchParams.get('excludeFields')?.split(',') || []
        };

        // Export the data
        const { data, contentType, filename } = await exportSurveyData(surveyId, options);

        return new Response(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error('Export error:', error);
        return new Response(
            JSON.stringify({
                error: 'Export failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};

// Also support POST for more complex export options
export const POST: APIRoute = async ({ params, request, locals }) => {
    try {
        const surveyId = params.id;
        if (!surveyId) {
            return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Verify admin authorization
        const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'read');
        if (!authorized) {
            return new Response(JSON.stringify({ error: authError }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Parse request body for export options
        const requestData = await request.json();
        const options: ExportOptions = {
            format: requestData.format || 'csv',
            includeParticipantInfo: requestData.includeParticipantInfo !== false,
            includeMetadata: requestData.includeMetadata !== false,
            anonymize: requestData.anonymize === true,
            includeTimestamps: requestData.includeTimestamps !== false,
            filterByStatus: requestData.filterByStatus || ['completed'],
            sortBy: requestData.sortBy || 'created_at',
            sortDirection: requestData.sortDirection || 'desc',
            excludeFields: requestData.excludeFields || []
        };

        // Export the data
        const { data, contentType, filename } = await exportSurveyData(surveyId, options);

        return new Response(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error('Export error:', error);
        return new Response(
            JSON.stringify({
                error: 'Export failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};