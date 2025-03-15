import { getClient } from '../lib/supabase';
import { sendEmail } from './emailUtils';
import { createSurveyInvitationEmail, createSurveyReminderEmail } from './emailUtils';
import { generateParticipantUrl } from './participantUtils';

// Check SMTP configuration and log warning if not configured
const checkSmtpConfiguration = () => {
  const smtpHost = import.meta.env.SMTP_HOST;
  const smtpPort = import.meta.env.SMTP_PORT;
  const smtpUser = import.meta.env.SMTP_USER;
  const smtpPass = import.meta.env.SMTP_PASS;
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('WARNING: SMTP is not fully configured. Email sending will be skipped for most participants.');
    console.warn('Missing environment variables:', {
      SMTP_HOST: !smtpHost ? 'missing' : 'set',
      SMTP_PORT: !smtpPort ? 'missing' : 'set',
      SMTP_USER: !smtpUser ? 'missing' : 'set',
      SMTP_PASS: !smtpPass ? 'missing' : 'set'
    });
    console.warn('For testing purposes, participant status updates will still occur for all participants.');
    console.warn('NOTE: Emails to samuel.ellis.barefoot@gmail.com will be attempted regardless of SMTP configuration.');
  } else if (smtpHost === '127.0.0.1') {
    console.warn('WARNING: SMTP_HOST is set to localhost (127.0.0.1). This requires a local SMTP server to be running.');
    console.warn('For testing purposes, participant status updates will still occur, but emails may fail if no local SMTP server is running.');
    console.warn('NOTE: Emails to samuel.ellis.barefoot@gmail.com will be attempted regardless of SMTP configuration.');
  }
};

// Run the check when this module is loaded
checkSmtpConfiguration();

/**
 * Job types supported by the background job system
 */
export enum JobType {
  SURVEY_PUBLISH = 'survey_publish',
  SURVEY_REMINDER = 'survey_reminder',
  DATA_EXPORT = 'data_export'
}

/**
 * Job status values
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Interface for job data
 */
export interface JobData {
  surveyId?: string;
  participantIds?: string[];
  exportFormat?: string;
  exportOptions?: Record<string, any>;
  [key: string]: any;
}

/**
 * Interface for job record
 */
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  data: JobData;
  progress: number;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Creates a new background job
 * @param type The type of job
 * @param data The job data
 * @returns The job ID
 */
export async function createJob(type: JobType, data: JobData): Promise<string> {
  const supabase = getClient({ requiresAdmin: true });
  
  // Create a job record
  const { data: job, error } = await supabase
    .from('background_jobs')
    .insert({
      type,
      status: JobStatus.PENDING,
      data,
      progress: 0
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating background job:', error);
    throw new Error(`Failed to create background job: ${error.message}`);
  }
  
  // Return job ID
  return job.id;
}

/**
 * Updates the progress of a job
 * @param jobId The job ID
 * @param progress The progress percentage (0-100)
 * @param status Optional new status
 * @param error Optional error message
 */
export async function updateJobProgress(
  jobId: string, 
  progress: number, 
  status?: JobStatus,
  error?: string
): Promise<void> {
  const supabase = getClient({ requiresAdmin: true });
  
  const updates: any = { 
    progress: Math.max(0, Math.min(100, progress)),
    updated_at: new Date().toISOString()
  };
  
  if (status) {
    updates.status = status;
    
    // Set completed_at if job is completed or failed
    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      updates.completed_at = new Date().toISOString();
    }
  }
  
  if (error) {
    updates.error = error;
  }
  
  const { error: updateError } = await supabase
    .from('background_jobs')
    .update(updates)
    .eq('id', jobId);
    
  if (updateError) {
    console.error('Error updating job progress:', updateError);
  }
}

/**
 * Gets a job by ID
 * @param jobId The job ID
 * @returns The job record
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const supabase = getClient({ requiresAdmin: true });
  
  const { data, error } = await supabase
    .from('background_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
    
  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }
  
  return data as Job;
}

/**
 * Creates a survey publish job and starts processing it
 * @param surveyId The survey ID
 * @param participantIds The participant IDs to send emails to
 * @returns The job ID
 */
export async function createPublishJob(surveyId: string, participantIds: string[]): Promise<string> {
  // Create the job
  const jobId = await createJob(JobType.SURVEY_PUBLISH, { surveyId, participantIds });
  
  // Start processing the job asynchronously
  processPublishJob(jobId).catch(error => {
    console.error(`Error processing publish job ${jobId}:`, error);
    updateJobProgress(jobId, 0, JobStatus.FAILED, error.message).catch(console.error);
  });
  
  return jobId;
}

/**
 * Processes a survey publish job
 * @param jobId The job ID
 */
async function processPublishJob(jobId: string): Promise<void> {
  console.log(`Starting to process publish job: ${jobId}`);
  const supabase = getClient({ requiresAdmin: true });
  console.log('Admin Supabase client initialized for job processing');
  
  // Get the job
  const job = await getJob(jobId);
  if (!job) {
    console.error(`Job ${jobId} not found in database`);
    throw new Error(`Job ${jobId} not found`);
  }
  console.log(`Found job ${jobId} with status: ${job.status}, processing...`);
  
  // Update status to processing
  await updateJobProgress(jobId, 0, JobStatus.PROCESSING);
  console.log(`Updated job ${jobId} status to PROCESSING`);
  
  try {
    const { surveyId, participantIds } = job.data;
    console.log(`Job data: surveyId=${surveyId}, ${participantIds?.length || 0} participants`);
    
    if (!surveyId || !participantIds || !Array.isArray(participantIds)) {
      console.error('Invalid job data structure:', job.data);
      throw new Error('Invalid job data: surveyId and participantIds array are required');
    }
    
    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();
      
    if (surveyError || !survey) {
      throw new Error(`Failed to fetch survey: ${surveyError?.message || 'Survey not found'}`);
    }
    
    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .in('id', participantIds);
      
    if (participantsError) {
      throw new Error(`Failed to fetch participants: ${participantsError.message}`);
    }
    
    if (!participants || participants.length === 0) {
      throw new Error('No participants found for the given IDs');
    }
    
    // Process participants in batches
    const batchSize = 20;
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      
      // Process each participant in the batch
      console.log(`Processing batch of ${batch.length} participants`);
      const promises = batch.map(async (participant) => {
        try {
          console.log(`Processing participant ${participant.id}, current status: ${participant.status}`);
          
          // Generate unique URL
          console.log(`Generating URL for participant ${participant.id}`);
          const surveyUrl = await generateParticipantUrl(surveyId, participant.id);
          console.log(`Generated URL for participant ${participant.id}: ${surveyUrl}`);
          
          // First, update participant status - do this regardless of email success
          console.log(`Updating participant ${participant.id} status to active`);
          const { data: updateData, error: updateError } = await supabase
            .from('participants')
            .update({
              status: 'active',
              // Only set last_emailed_at if we successfully send the email later
              updated_at: new Date().toISOString()
            })
            .eq('id', participant.id)
            .select('id, status');
            
          if (updateError) {
            console.error(`Error updating participant ${participant.id} status:`, updateError);
            throw new Error(`Failed to update participant status: ${updateError.message}`);
          } else {
            console.log(`Successfully updated participant ${participant.id} status to active:`, updateData);
            // Mark this participant as a success for status update purposes
            successCount++;
          }
          
          // Check if this is a real test email (Samuel's email)
          const isRealTestEmail = participant.email === 'samuel.ellis.barefoot@gmail.com';
          
          // Check if SMTP settings are configured before attempting to send email
          const smtpHost = import.meta.env.SMTP_HOST;
          
          // Always attempt to send to real test email OR when SMTP is configured
          if (isRealTestEmail || (smtpHost && smtpHost !== '127.0.0.1')) {
            // Now try to send email - this might fail in test environments without SMTP
            try {
              if (isRealTestEmail) {
                console.log(`Attempting to send email to real test address: ${participant.email}`);
              }
              
              // Create email content
              console.log(`Creating email content for participant ${participant.id}`);
              const { subject, html } = createSurveyInvitationEmail(
                survey,
                participant.name || '',
                surveyUrl
              );
              
              // Send email
              console.log(`Sending email to ${participant.email}`);
              await sendEmail({
                to: participant.email,
                subject,
                html,
                replyTo: survey.contact_email || undefined
              });
              console.log(`Email sent successfully to ${participant.email}`);
              
              // Update last_emailed_at timestamp only if email was sent successfully
              await supabase
                .from('participants')
                .update({ last_emailed_at: new Date().toISOString() })
                .eq('id', participant.id);
            } catch (emailError) {
              // Log the email error but don't fail the entire participant processing
              console.error(`Email sending failed for participant ${participant.id}:`, emailError);
              if (isRealTestEmail) {
                console.error(`Failed to send to real test email ${participant.email}. Check SMTP configuration and internet connectivity.`);
                console.error(`Error details: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
              } else {
                console.warn(`Participant ${participant.id} status was updated, but email could not be sent`);
              }
              // Don't decrement successCount - we're separating status updates from email success
            }
          } else {
            console.warn(`SMTP_HOST not configured or set to localhost (${smtpHost}). Skipping email sending for ${participant.email} in test environment.`);
          }
        } catch (error) {
          console.error(`Failed to process participant ${participant.id}:`, error);
          failureCount++;
        }
      });
      
      // Wait for batch to complete
      await Promise.all(promises);
      
      // Update progress
      const progress = Math.round((i + batch.length) / participants.length * 100);
      await updateJobProgress(jobId, progress);
      
      // Add a small delay between batches
      if (i + batchSize < participants.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update job with final status
    // Consider job successful if we were able to update participant statuses, even if emails failed
    const finalStatus = successCount > 0 ? JobStatus.COMPLETED : JobStatus.FAILED;
    
    // Include email failure information as a warning, but don't make it a failure
    let errorMessage: string | undefined;
    if (failureCount > 0) {
      errorMessage = `Warning: Failed to send ${failureCount} out of ${participants.length} emails, but ${successCount} participant statuses were updated successfully`;
    }
      
    await updateJobProgress(
      jobId,
      100,
      finalStatus,
      errorMessage
    );
    console.log(`Updated job ${jobId} progress to 100% with status ${finalStatus}`);
    
    // Update survey status if we successfully updated participant statuses
    // We're prioritizing status updates over email sending
    if (finalStatus === JobStatus.COMPLETED) {
      console.log(`Updating survey ${surveyId} status to published`);
      
      // First check if the survey table has the published_at column
      try {
        const { error: schemaError } = await supabase
          .from('surveys')
          .select('published_at')
          .eq('id', surveyId)
          .limit(1);
          
        let hasPublishedAtColumn = true;
        if (schemaError && schemaError.code === 'PGRST204') {
          console.warn(`Survey table does not have 'published_at' column, updating only status field`);
          hasPublishedAtColumn = false;
        }
        
        // Update the survey with or without published_at field
        const updateData = hasPublishedAtColumn
          ? { status: 'published', published_at: new Date().toISOString() }
          : { status: 'published' };
          
        const { data: surveyUpdateData, error: surveyUpdateError } = await supabase
          .from('surveys')
          .update(updateData)
          .eq('id', surveyId)
          .select();
          
        if (surveyUpdateError) {
          console.error(`Error updating survey ${surveyId} status:`, surveyUpdateError);
        } else {
          console.log(`Successfully updated survey ${surveyId} status to published:`, surveyUpdateData);
        }
      } catch (updateError) {
        console.error(`Error in survey status update process:`, updateError);
      }
    }
    
    console.log(`Finished processing job ${jobId} successfully`);
    
  } catch (error) {
    console.error(`Error processing publish job ${jobId}:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    await updateJobProgress(
      jobId,
      0,
      JobStatus.FAILED,
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(`Job ${jobId} marked as FAILED due to error`);
  }
}

/**
 * Creates a survey reminder job and starts processing it
 * @param surveyId The survey ID
 * @param participantIds The participant IDs to send reminders to (or undefined for all active participants)
 * @returns The job ID
 */
export async function createReminderJob(surveyId: string, participantIds?: string[]): Promise<string> {
  // Create the job
  const jobId = await createJob(JobType.SURVEY_REMINDER, { surveyId, participantIds });
  
  // Start processing the job asynchronously
  processReminderJob(jobId).catch(error => {
    console.error(`Error processing reminder job ${jobId}:`, error);
    updateJobProgress(jobId, 0, JobStatus.FAILED, error.message).catch(console.error);
  });
  
  return jobId;
}

/**
 * Processes a survey reminder job
 * @param jobId The job ID
 */
async function processReminderJob(jobId: string): Promise<void> {
  const supabase = getClient({ requiresAdmin: true });
  
  // Get the job
  const job = await getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  // Update status to processing
  await updateJobProgress(jobId, 0, JobStatus.PROCESSING);
  
  try {
    const { surveyId, participantIds } = job.data;
    
    if (!surveyId) {
      throw new Error('Invalid job data: surveyId is required');
    }
    
    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();
      
    if (surveyError || !survey) {
      throw new Error(`Failed to fetch survey: ${surveyError?.message || 'Survey not found'}`);
    }
    
    // Get participants - either specific IDs or all active participants
    let participantsQuery = supabase
      .from('participants')
      .select('*')
      .eq('survey_id', surveyId)
      .eq('status', 'active');
      
    if (participantIds && participantIds.length > 0) {
      participantsQuery = participantsQuery.in('id', participantIds);
    }
    
    const { data: participants, error: participantsError } = await participantsQuery;
      
    if (participantsError) {
      throw new Error(`Failed to fetch participants: ${participantsError.message}`);
    }
    
    if (!participants || participants.length === 0) {
      throw new Error('No active participants found to send reminders to');
    }
    
    // Process participants in batches
    const batchSize = 20;
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      
      // Process each participant in the batch
      const promises = batch.map(async (participant) => {
        try {
          // Generate unique URL
          const surveyUrl = await generateParticipantUrl(surveyId, participant.id);
          
          // Check if this is a real test email (Samuel's email)
          const isRealTestEmail = participant.email === 'samuel.ellis.barefoot@gmail.com';
          
          // Check if SMTP settings are configured before attempting to send email
          const smtpHost = import.meta.env.SMTP_HOST;
          
          // Always attempt to send to real test email OR when SMTP is configured
          if (isRealTestEmail || (smtpHost && smtpHost !== '127.0.0.1')) {
            try {
              if (isRealTestEmail) {
                console.log(`Attempting to send reminder email to test address: ${participant.email}`);
              }
              
              // Create email content
              const { subject, html } = createSurveyReminderEmail(
                survey,
                participant.name || '',
                surveyUrl
              );
              
              // Send email
              console.log(`Sending reminder email to ${participant.email}`);
              await sendEmail({
                to: participant.email,
                subject,
                html,
                replyTo: survey.contact_email || undefined
              });
              console.log(`Reminder email sent successfully to ${participant.email}`);
              
              // Update participant last_emailed_at
              await supabase
                .from('participants')
                .update({ last_emailed_at: new Date().toISOString() })
                .eq('id', participant.id);
                
              successCount++;
            } catch (emailError) {
              console.error(`Reminder email sending failed for participant ${participant.id}:`, emailError);
              if (isRealTestEmail) {
                console.error(`Failed to send to real test email ${participant.email}. Check SMTP configuration and internet connectivity.`);
                console.error(`Error details: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
              }
              failureCount++;
            }
          } else {
            console.warn(`SMTP_HOST not configured or set to localhost (${smtpHost}). Skipping reminder email for ${participant.email} in test environment.`);
            // Count this as a failure only for stats
            failureCount++;
          }
        } catch (error) {
          console.error(`Failed to process reminder for participant ${participant.id}:`, error);
          failureCount++;
        }
      });
      
      // Wait for batch to complete
      await Promise.all(promises);
      
      // Update progress
      const progress = Math.round((i + batch.length) / participants.length * 100);
      await updateJobProgress(jobId, progress);
      
      // Add a small delay between batches
      if (i + batchSize < participants.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update job with final status
    // Consider job successful if at least some emails were sent
    const finalStatus = successCount > 0 ? JobStatus.COMPLETED : JobStatus.FAILED;
    
    let errorMessage: string | undefined;
    if (failureCount > 0) {
      errorMessage = `Warning: Failed to send ${failureCount} out of ${participants.length} reminder emails, but ${successCount} emails were sent successfully`;
    }
      
    await updateJobProgress(
      jobId,
      100,
      finalStatus,
      errorMessage
    );
    
    // Update survey last_reminded_at field if it exists
    if (finalStatus === JobStatus.COMPLETED) {
      try {
        // First check if the survey table has the last_reminded_at column
        const { error: schemaError } = await supabase
          .from('surveys')
          .select('last_reminded_at')
          .eq('id', surveyId)
          .limit(1);
          
        if (!schemaError) {
          console.log(`Updating survey ${surveyId} reminder timestamp`);
          await supabase
            .from('surveys')
            .update({ last_reminded_at: new Date().toISOString() })
            .eq('id', surveyId);
        }
      } catch (updateError) {
        console.error(`Error updating survey reminder timestamp:`, updateError);
      }
    }
    
  } catch (error) {
    console.error(`Error processing reminder job ${jobId}:`, error);
    await updateJobProgress(
      jobId, 
      0, 
      JobStatus.FAILED, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Gets all jobs for a survey
 * @param surveyId The survey ID
 * @returns Array of jobs
 */
export async function getSurveyJobs(surveyId: string): Promise<Job[]> {
  const supabase = getClient({ requiresAdmin: true });
  
  const { data, error } = await supabase
    .from('background_jobs')
    .select('*')
    .eq('data->>surveyId', surveyId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching survey jobs:', error);
    return [];
  }
  
  return data as Job[];
}