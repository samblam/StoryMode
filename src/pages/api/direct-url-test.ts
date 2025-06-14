import { type APIRoute } from 'astro';
import { generateSurveyUrl } from '../../utils/participantUtils';

/**
 * This endpoint directly tests the URL generation fix without requiring authentication.
 * It uses the updated generateSurveyUrl function to create a test URL with both
 * participant_id and token parameters, then verifies the parameters are correctly included.
 */
export const GET: APIRoute = async () => {
  try {
    // Get base URL from environment or use fallbacks
    let baseUrl = process.env.PUBLIC_BASE_URL;
    
    // If not set in environment, try other environment variables
    if (!baseUrl) {
      baseUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
      
      // For testing purposes, we can use a placeholder URL if needed
      if (!baseUrl) {
        // Using example.com as a valid URL for testing purposes
        // This won't actually be used to make requests, it's just to test parameter handling
        baseUrl = 'https://example.com';
      }
    }
    
    // Other test values
    const surveyId = 'test-survey-123';
    const participantId = 'TEST12345678';
    const accessToken = 'test-token-abcdefg123456';
    
    // Generate URL using the fixed function
    const url = generateSurveyUrl(baseUrl, surveyId, participantId, accessToken);
    
    // Parse the URL to verify the parameters
    const parsedUrl = new URL(url);
    const extractedParticipantId = parsedUrl.searchParams.get('participant_id');
    const extractedToken = parsedUrl.searchParams.get('token');
    
    // Verify the parameters are included correctly
    const isSuccess = 
      extractedParticipantId === participantId && 
      extractedToken === accessToken;
    
    return new Response(JSON.stringify({
      success: isSuccess,
      url,
      details: {
        original: {
          participantId,
          accessToken
        },
        extracted: {
          participantId: extractedParticipantId,
          accessToken: extractedToken
        }
      },
      verification: {
        participantIdMatches: extractedParticipantId === participantId,
        tokenMatches: extractedToken === accessToken
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in direct URL test:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};