import { getClient } from '../../../../../lib/supabase';
import { type APIRoute } from 'astro';
import { generateUniqueIdentifier, generateSecureToken } from '../../../../../utils/participantUtils';


const CHUNK_SIZE = 100; // Process participants in chunks of 100

export const POST: APIRoute = async ({ params, request }) => {
  const surveyId = params.id;
  if (!surveyId) {
    return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const jsonFile = formData.get('jsonFile') as File;

    if (!jsonFile) {
      return new Response(JSON.stringify({ error: 'JSON file is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileBuffer = await jsonFile.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    let records;
    try {
      records = JSON.parse(fileContent);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(records)) {
      return new Response(JSON.stringify({ error: 'Invalid JSON format: expected an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format for all records
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = records.filter((record: any) => !record.email || !emailRegex.test(record.email));
    if (invalidEmails.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format found in JSON',
        invalidEmails: invalidEmails.map((record: any) => record.email || 'missing email')
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getClient({ requiresAdmin: true });

    // Check for existing participants
    const emails = records.map((record: any) => record.email);
    const { data: existingParticipants } = await supabase
      .from('participants')
      .select('email')
      .eq('survey_id', surveyId)
      .in('email', emails);

    if (existingParticipants && existingParticipants.length > 0) {
      const existingEmails = existingParticipants.map(p => p.email);
      return new Response(JSON.stringify({ 
        error: 'Some participants already exist for this survey',
        existingEmails 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process participants in chunks
    const results = {
      success: 0,
      errors: [] as Array<string | { range: string; error: string; code: string; details: string }>,
    };

    // Split records into chunks
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      
      // Generate unique identifiers and access tokens for each participant in the chunk
      const participantsToInsert = await Promise.all(
        chunk.map(async (record: any) => ({
          survey_id: surveyId,
          email: record.email,
          name: record.name || null, // Include name field if present
          status: 'inactive' as const,
          participant_identifier: await generateUniqueIdentifier(),
          access_token: await generateSecureToken()
        }))
      );
      console.log('Generated access tokens for chunk: ' + chunk.map((record: any) => record.email).join(', '));

      const { error } = await supabase
        .from('participants')
        .insert(participantsToInsert);

      if (error) {
        console.error('Error creating participants chunk:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('First participant data:', JSON.stringify(participantsToInsert[0], null, 2));
        
        // Log specific error information based on error code
        if (error.code === '23502') {
          console.error('NOT NULL constraint violation - a required field is missing');
        } else if (error.code === '23503') {
          console.error('Foreign key constraint violation - referenced record does not exist');
          console.error('This likely means the survey_id is invalid or does not exist');
        } else if (error.code === '23505') {
          console.error('Unique constraint violation - record with this key already exists');
        }
        
        // Add more detailed error information
        results.errors.push({
          range: `Records ${i + 1} to ${i + chunk.length}`,
          error: error.message,
          code: error.code,
          details: JSON.stringify(error.details || {})
        });
      } else {
        results.success += chunk.length;
      }
    }

    if (results.errors.length > 0) {
      return new Response(JSON.stringify({ 
        warning: 'Some participants could not be created',
        results 
      }), {
        status: 207,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: 'All participants created successfully',
      count: results.success
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing JSON upload:', error);
    
    // Create a more detailed error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('Error stack:', errorStack);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: errorMessage,
      hint: 'Check server logs for more information'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};