import { getClient } from '../lib/supabase';
import { sendEmail } from './emailUtils';
import { createSurveyInvitationEmail, createSurveyReminderEmail } from './emailUtils';
import { generateParticipantUrl } from './participantUtils';

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
    
    if (!surveyId || !participantIds || !Array.isArray(participantIds)) {
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
      const promises = batch.map(async (participant) => {
        try {
          // Generate unique URL
          const surveyUrl = await generateParticipantUrl(surveyId, participant.id);
          
          // Create email content
          const { subject, html } = createSurveyInvitationEmail(
            survey,
            participant.name || '',
            surveyUrl
          );
          
          // Send email
          await sendEmail({
            to: participant.email,
            subject,
            html,
            replyTo: survey.contact_email || undefined
          });
          
          // Update participant status
          await supabase
            .from('participants')
            .update({ status: 'active', last_emailed_at: new Date().toISOString() })
            .eq('id', participant.id);
            
          successCount++;
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
    const finalStatus = failureCount === 0 ? JobStatus.COMPLETED : 
                        successCount === 0 ? JobStatus.FAILED : JobStatus.COMPLETED;
                        
    const errorMessage = failureCount > 0 ? 
      `Failed to send ${failureCount} out of ${participants.length} emails` : undefined;
      
    await updateJobProgress(
      jobId, 
      100, 
      finalStatus, 
      errorMessage
    );
    
    // Update survey status if all emails were sent successfully
    if (finalStatus === JobStatus.COMPLETED && !errorMessage) {
      await supabase
        .from('surveys')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', surveyId);
    }
    
  } catch (error) {
    console.error(`Error processing publish job ${jobId}:`, error);
    await updateJobProgress(
      jobId, 
      0, 
      JobStatus.FAILED, 
      error instanceof Error ? error.message : 'Unknown error'
    );
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
          
          // Create email content
          const { subject, html } = createSurveyReminderEmail(
            survey,
            participant.name || '',
            surveyUrl
          );
          
          // Send email
          await sendEmail({
            to: participant.email,
            subject,
            html,
            replyTo: survey.contact_email || undefined
          });
          
          // Update participant last_emailed_at
          await supabase
            .from('participants')
            .update({ last_emailed_at: new Date().toISOString() })
            .eq('id', participant.id);
            
          successCount++;
        } catch (error) {
          console.error(`Failed to send reminder to participant ${participant.id}:`, error);
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
    const finalStatus = failureCount === 0 ? JobStatus.COMPLETED : 
                        successCount === 0 ? JobStatus.FAILED : JobStatus.COMPLETED;
                        
    const errorMessage = failureCount > 0 ? 
      `Failed to send ${failureCount} out of ${participants.length} reminder emails` : undefined;
      
    await updateJobProgress(
      jobId, 
      100, 
      finalStatus, 
      errorMessage
    );
    
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