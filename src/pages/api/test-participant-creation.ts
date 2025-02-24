import type { APIRoute } from 'astro';
import { getClient } from '../../lib/supabase';
import { generateUniqueIdentifier } from '../../utils/participantUtils';

export const GET: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    console.log('Test participant creation endpoint called');
    
    // Initialize admin client
    console.log('Initializing Supabase admin client');
    const supabase = getClient({ requiresAdmin: true });
    
    // Generate a unique identifier
    console.log('Generating unique identifier');
    const participantIdentifier = await generateUniqueIdentifier();
    console.log('Generated identifier:', participantIdentifier);
    
    // Create test participant
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test Participant';
    
    console.log('Creating test participant with data:', {
      email: testEmail,
      name: testName,
      status: 'inactive',
      participant_identifier: participantIdentifier,
      survey_id: '00000000-0000-0000-0000-000000000000' // This is a placeholder UUID
    });
    
    // First, try to query the participants table to verify access
    console.log('Testing table access...');
    const { data: tableTest, error: tableError } = await supabase
      .from('participants')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Error accessing participants table:', tableError);
      console.error('Error details:', JSON.stringify(tableError, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Failed to access participants table',
        details: tableError
      }), {
        status: 500,
        headers
      });
    }
    
    console.log('Table access successful, found', tableTest?.length || 0, 'records');
    
    // Now try to insert a test participant
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        email: testEmail,
        name: testName,
        status: 'inactive',
        participant_identifier: participantIdentifier,
        survey_id: '00000000-0000-0000-0000-000000000000' // This is a placeholder UUID
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating test participant:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a foreign key constraint error
      if (error.code === '23503') {
        console.log('Foreign key constraint error detected. Trying with a valid survey ID...');
        
        // Get a valid survey ID from the database
        const { data: surveys } = await supabase
          .from('surveys')
          .select('id')
          .limit(1);
          
        if (surveys && surveys.length > 0) {
          const validSurveyId = surveys[0].id;
          console.log('Found valid survey ID:', validSurveyId);
          
          // Try again with a valid survey ID
          const { data: retryParticipant, error: retryError } = await supabase
            .from('participants')
            .insert({
              email: testEmail,
              name: testName,
              status: 'inactive',
              participant_identifier: participantIdentifier,
              survey_id: validSurveyId
            })
            .select()
            .single();
            
          if (retryError) {
            console.error('Error creating test participant with valid survey ID:', retryError);
            console.error('Error details:', JSON.stringify(retryError, null, 2));
            return new Response(JSON.stringify({ 
              error: 'Failed to create test participant with valid survey ID',
              details: retryError
            }), {
              status: 500,
              headers
            });
          }
          
          console.log('Test participant created successfully with valid survey ID:', retryParticipant);
          return new Response(JSON.stringify({ 
            message: 'Test participant created successfully with valid survey ID',
            participant: retryParticipant
          }), {
            status: 200,
            headers
          });
        } else {
          console.error('No valid surveys found in the database');
          return new Response(JSON.stringify({ 
            error: 'No valid surveys found in the database',
            details: error
          }), {
            status: 500,
            headers
          });
        }
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create test participant',
        details: error
      }), {
        status: 500,
        headers
      });
    }
    
    console.log('Test participant created successfully:', participant);
    return new Response(JSON.stringify({ 
      message: 'Test participant created successfully',
      participant
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error in test participant creation endpoint:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers
    });
  }
};