import { getClient } from '~/lib/supabase';
import { type Database } from '~/types/database';
import { type APIRoute } from 'astro';
import { parse } from 'csv-parse/sync';
import { generateUniqueIdentifier } from '~/utils/participantUtils';

type Participant = Database['public']['Tables']['participants']['Row'];

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
    const csvFile = formData.get('csvFile') as File;

    if (!csvFile) {
      return new Response(JSON.stringify({ error: 'CSV file is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileBuffer = await csvFile.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Validate email format for all records
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = records.filter((record: any) => !emailRegex.test(record.email));
    if (invalidEmails.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format found in CSV',
        invalidEmails: invalidEmails.map((record: any) => record.email)
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
      errors: [] as string[],
    };

    // Split records into chunks
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      
      // Generate unique identifiers for each participant in the chunk
      const participantsToInsert = await Promise.all(
        chunk.map(async (record: any) => ({
          survey_id: surveyId,
          email: record.email,
          status: 'inactive' as const,
          participant_identifier: await generateUniqueIdentifier()
        }))
      );

      const { error } = await supabase
        .from('participants')
        .insert(participantsToInsert);

      if (error) {
        console.error('Error creating participants chunk:', error);
        results.errors.push(`Error processing records ${i + 1} to ${i + chunk.length}`);
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
    console.error('Error processing CSV upload:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};