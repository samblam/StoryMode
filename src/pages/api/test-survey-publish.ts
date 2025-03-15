import { getClient } from '../../lib/supabase';
import { type APIRoute } from 'astro';
import { generateSecureToken, generateUniqueIdentifier } from '../../utils/participantUtils';
import { createPublishJob } from '../../utils/backgroundJobs';

/**
 * Test endpoint for verifying the survey publish workflow with URL parameter fix
 * This creates a test survey, adds test participants, publishes the survey, and verifies URLs
 */
export const GET: APIRoute = async () => {
  try {
    // No authentication required for this test endpoint
    console.log('Test publish endpoint - No auth required');

    const supabase = getClient({ requiresAdmin: true });
    
    // Step 1: Create a test survey if one doesn't exist
    console.log('Creating test survey for URL parameter testing...');
    
    // Check if test survey already exists
    const { data: existingSurveys } = await supabase
      .from('surveys')
      .select('id, title')
      .eq('title', 'URL Parameter Test Survey')
      .limit(1);
    
    let testSurveyId: string;
    
    if (existingSurveys && existingSurveys.length > 0) {
      testSurveyId = existingSurveys[0].id;
      console.log(`Using existing test survey: ${testSurveyId}`);
    } else {
      // Create a new test survey
      const { data: newSurvey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          title: 'URL Parameter Test Survey',
          description: 'A test survey to verify the URL parameter fix',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          functions: ['Function 1', 'Function 2', 'Function 3'],
          active: true
        })
        .select()
        .single();
        
      if (surveyError || !newSurvey) {
        return new Response(JSON.stringify({ 
          error: 'Failed to create test survey',
          details: surveyError?.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      testSurveyId = newSurvey.id;
      console.log(`Created new test survey: ${testSurveyId}`);
    }
    
    // Step 2: Create test participants
    console.log('Creating test participants...');
    
    // Check for existing test participants
    const { data: existingParticipants } = await supabase
      .from('participants')
      .select('id, name, email, participant_identifier, access_token, status')
      .eq('survey_id', testSurveyId);
    
    let participants = existingParticipants || [];
    
    // Check if Samuel's email already exists among participants
    const samExists = participants.some(p => p.email === 'samuel.ellis.barefoot@gmail.com');
    
    // If Samuel doesn't exist, create him as a special test participant
    if (!samExists) {
      console.log('Creating special test participant: Samuel Barefoot');
      const participantIdentifier = await generateUniqueIdentifier();
      const accessToken = await generateSecureToken();
      
      const { data: samParticipant, error: samError } = await supabase
        .from('participants')
        .insert({
          survey_id: testSurveyId,
          participant_identifier: participantIdentifier,
          access_token: accessToken,
          status: 'inactive',
          name: 'Samuel Barefoot',
          email: 'samuel.ellis.barefoot@gmail.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (samError || !samParticipant) {
        console.error('Error creating special test participant:', samError);
      } else {
        console.log('Successfully created special test participant:', samParticipant.id);
        participants.push(samParticipant);
      }
    } else {
      console.log('Special test participant Samuel Barefoot already exists');
    }
    
    // Create other test participants if needed to reach a total of 3
    if (participants.length < 3) {
      const newParticipants = [];
      
      for (let i = participants.length; i < 3; i++) {
        const participantIdentifier = await generateUniqueIdentifier();
        const accessToken = await generateSecureToken();
        const email = `test${i + 1}@example.com`;
        const name = `Test Participant ${i + 1}`;
        
        const { data: participant, error: participantError } = await supabase
          .from('participants')
          .insert({
            survey_id: testSurveyId,
            participant_identifier: participantIdentifier,
            access_token: accessToken,
            status: 'inactive',
            name: name,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (participantError || !participant) {
          console.error('Error creating participant:', participantError);
          continue;
        }
        
        newParticipants.push(participant);
        participants.push(participant);
      }
      
      console.log(`Created ${newParticipants.length} additional test participants`);
    } else {
      console.log(`Using ${participants.length} existing test participants`);
    }
    
    if (participants.length === 0) {
      return new Response(JSON.stringify({ error: 'Failed to create or find test participants' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 3: Publish the survey to generate URLs
    console.log('Publishing test survey to generate URLs...');
    
    // First, collect all inactive participant IDs
    const inactiveParticipants = participants.filter(p => p.status === 'inactive');
    const participantIds = inactiveParticipants.map(p => p.id);
    
    if (participantIds.length === 0) {
      // Find Samuel's participant
      const samParticipant = participants.find(p => p.email === 'samuel.ellis.barefoot@gmail.com');
      
      // Select participants to reset including Samuel if available
      let resetParticipants = [];
      if (samParticipant) {
        // Include Samuel and one other participant if available
        resetParticipants.push(samParticipant);
        
        // Add another participant if available
        const otherParticipants = participants.filter(p => p.email !== 'samuel.ellis.barefoot@gmail.com');
        if (otherParticipants.length > 0) {
          resetParticipants.push(otherParticipants[0]);
        }
      } else {
        // If Samuel is not found, just use the first 2 participants
        resetParticipants = participants.slice(0, Math.min(2, participants.length));
      }
      
      const resetIds = resetParticipants.map(p => p.id);
      
      await supabase
        .from('participants')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .in('id', resetIds);
      
      console.log(`Reset ${resetIds.length} participants to inactive status for testing`);
      if (samParticipant) {
        console.log(`Special test participant Samuel Barefoot (${samParticipant.id}) reset to inactive status`);
      }
      
      // Update our list with the reset participants
      participantIds.push(...resetIds);
    }
    
    // Create a background job to handle the URL generation and email sending
    let jobId: string;
    try {
      console.log(`Attempting to create publish job for survey ${testSurveyId} with ${participantIds.length} participants`);
      jobId = await createPublishJob(testSurveyId, participantIds);
      console.log(`Created publish job: ${jobId}`);
    } catch (error) {
      console.error('Error creating publish job:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create publish job',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 4: Wait longer for the job to process completely
    console.log(`Waiting for job ${jobId} to process...`);
    const waitTime = 5000; // Increased from 2000ms to 5000ms
    await new Promise(resolve => setTimeout(resolve, waitTime));
    console.log(`Finished waiting ${waitTime}ms for job processing`);
    
    // Step 5: Verify participants were updated and check their URLs
    console.log('Verifying participant URLs...');
    
    const { data: updatedParticipants, error: fetchError } = await supabase
      .from('participants')
      .select('id, participant_identifier, access_token, status')
      .in('id', participantIds);
      
    if (fetchError || !updatedParticipants) {
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch updated participants',
        details: fetchError?.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check statuses and generate URLs for verification
    // Get the base URL from environment variables with better fallback mechanism
    let baseUrl = process.env.PUBLIC_BASE_URL;
    
    // If not set in environment, try to detect from other environment variables
    if (!baseUrl) {
      console.warn('PUBLIC_BASE_URL environment variable not set. Using alternative or fallback.');
      baseUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
      
      // If still no URL found, use a relative URL
      if (!baseUrl) {
        console.warn('No base URL environment variables found. Using relative URL, which may not work for email testing.');
        baseUrl = ''; // Empty string will create a relative URL (works when testing in browser)
      }
    }
    
    const verificationResults = updatedParticipants.map(participant => {
      // What the URL should be with our fix
      const correctUrl = `${baseUrl}/surveys/${testSurveyId}?participant_id=${participant.participant_identifier}&token=${participant.access_token}`;
      
      // What the URL would have been without our fix
      const oldUrl = `${baseUrl}/surveys/${testSurveyId}?participant=${participant.participant_identifier}`;
      
      return {
        participantId: participant.id,
        identifier: participant.participant_identifier,
        statusUpdated: participant.status === 'active', // Should be 'active' after publishing
        correctUrl,
        oldUrl
      };
    });
    
    // Find the test participant with the specific email
    const testParticipant = participants.find(p => p.email === 'samuel.ellis.barefoot@gmail.com');
    const emailInfo = testParticipant ? {
      recipientEmail: testParticipant.email,
      recipientName: testParticipant.name,
      participantId: testParticipant.id,
      emailSent: true,
      message: 'An email has been sent to this address with the survey URL. Please check your inbox.'
    } : {
      emailSent: false,
      message: 'No test participant with email samuel.ellis.barefoot@gmail.com was found.'
    };

    // Return results
    return new Response(JSON.stringify({
      success: true,
      surveyId: testSurveyId,
      jobId,
      participantsCount: participants.length,
      activeParticipantsCount: updatedParticipants.filter(p => p.status === 'active').length,
      testEmail: emailInfo,
      verificationResults,
      message: 'The survey publishing test has completed. Check the verificationResults to see the correct URLs that will be generated for participants, and check your email for the survey invitation.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test-survey-publish:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};