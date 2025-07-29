import type { APIRoute } from 'astro';
import { migrateSurveyResponseMatching, previewSurveyResponseMatching } from '../../../utils/dataMigration';
import { getCurrentUser } from '../../../utils/authUtils';
import { verifyAuthorization } from '../../../utils/accessControl';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify admin access
    const user = await getCurrentUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { authorized } = await verifyAuthorization(user, 'admin', 'admin');
    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { action, surveyId } = body;

    if (!action || !['preview', 'migrate'].includes(action)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid action. Must be "preview" or "migrate"' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔧 Admin ${user.email} initiated data migration: ${action}${surveyId ? ` for survey ${surveyId}` : ' for all surveys'}`);

    let result;
    if (action === 'preview') {
      result = await previewSurveyResponseMatching(surveyId);
    } else {
      result = await migrateSurveyResponseMatching(surveyId);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      surveyId: surveyId || 'all',
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return new Response(JSON.stringify({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};