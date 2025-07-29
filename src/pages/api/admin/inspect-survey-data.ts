import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { surveyId } = await request.json();
    
    if (!surveyId) {
      return new Response(JSON.stringify({ error: 'Survey ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = getClient({ requiresAdmin: true });
    
    // Get all survey responses for this survey
    const { data: responses, error } = await supabaseAdmin
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId);

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${responses?.length || 0} responses for survey ${surveyId}`);
    
    // Analyze the data structure
    const analysis = {
      totalResponses: responses?.length || 0,
      sampleResponse: responses?.[0] || null,
      responsesWithSoundMapping: 0,
      soundMappingStructure: null
    };

    if (responses && responses.length > 0) {
      // Check how many have sound_mapping_responses
      analysis.responsesWithSoundMapping = responses.filter(r => 
        r.sound_mapping_responses && 
        typeof r.sound_mapping_responses === 'object' &&
        r.sound_mapping_responses.sound_mapping
      ).length;

      // Get a sample sound mapping structure
      const responseWithMapping = responses.find(r => 
        r.sound_mapping_responses && 
        typeof r.sound_mapping_responses === 'object' &&
        r.sound_mapping_responses.sound_mapping
      );

      if (responseWithMapping) {
        analysis.soundMappingStructure = responseWithMapping.sound_mapping_responses.sound_mapping;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Inspection error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};