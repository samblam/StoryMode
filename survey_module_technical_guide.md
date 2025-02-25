# Survey Module Technical Implementation Guide

This guide provides specific technical instructions for implementing the remaining features and fixing bugs in the survey management module. It's intended for an AI engineer to follow when completing the module.

## 1. Fix Survey Preview Functionality

### 1.1 Debug and Fix 404 Error

1. First, check the client-side code in `SurveyPreview.astro`:
   ```javascript
   // Line 46 in SurveyPreview.astro
   const previewUrl = `/surveys/${surveyId}?preview=true&context=${encodeURIComponent(JSON.stringify(data))}`;
   ```

2. Verify that the survey page (`/src/pages/surveys/[id].astro`) properly handles the `preview` query parameter:
   ```javascript
   // Add to surveys/[id].astro
   const url = new URL(Astro.request.url);
   const isPreview = url.searchParams.get('preview') === 'true';
   const previewContext = isPreview ? JSON.parse(decodeURIComponent(url.searchParams.get('context') || '{}')) : null;
   
   // Use previewContext instead of fetching data if in preview mode
   const survey = isPreview ? previewContext.survey : /* existing fetch logic */;
   ```

### 1.2 Fix `previewSurvey` Function Undefined

1. Check the script section in `SurveyPreview.astro` to ensure the function is properly defined and accessible:
   ```javascript
   // Ensure this function is properly defined in the script section
   async function previewSurvey(surveyId) {
     // Implementation
   }
   
   // Make sure the event listener is properly attached
   document.addEventListener('astro:page-load', initializePreviewButton);
   initializePreviewButton();
   ```

2. Add console logging to debug the function availability:
   ```javascript
   function initializePreviewButton() {
     console.log('Initializing preview button');
     const button = document.querySelector(`.preview-button[data-survey-id="${surveyId}"]`);
     console.log('Button found:', button);
     // Rest of the function
   }
   ```

### 1.3 Fix VideoPlayer Callback Errors

1. Check the VideoPlayer component for callback issues:
   ```javascript
   // In VideoPlayer.astro
   // Ensure callbacks are properly defined and handled
   function handleVideoEnd() {
     if (typeof onVideoEnd === 'function') {
       onVideoEnd();
     }
   }
   ```

2. Add error handling for callbacks:
   ```javascript
   // Wrap callback execution in try-catch
   try {
     if (typeof onVideoEnd === 'function') {
       onVideoEnd();
     }
   } catch (error) {
     console.error('Error in video end callback:', error);
   }
   ```

## 2. Complete Survey Publishing Workflow

### 2.1 Enhance Email Templates

1. Create a dedicated email template function in `emailUtils.ts`:
   ```typescript
   export function createSurveyInvitationEmail(survey: Survey, participantName: string, surveyUrl: string): string {
     return `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <h2 style="color: #4a5568;">You're invited to participate in a survey</h2>
         <p>Hello ${participantName || 'Participant'},</p>
         <p>You have been invited to participate in the survey: <strong>${survey.title}</strong></p>
         <p>${survey.description || ''}</p>
         <p>Please click the button below to access your unique survey:</p>
         <div style="text-align: center; margin: 30px 0;">
           <a href="${surveyUrl}" style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
             Start Survey
           </a>
         </div>
         <p style="font-size: 0.8em; color: #718096;">This link is unique to you and should not be shared with others.</p>
       </div>
     `;
   }
   ```

2. Update the publish endpoint to use this template:
   ```typescript
   // In publish.ts
   const emailHtml = createSurveyInvitationEmail(
     survey,
     participant.name || '',
     surveyUrl
   );
   
   await sendEmail({
     to: participant.email,
     subject: `Survey Invitation: ${survey.title}`,
     html: emailHtml
   });
   ```

### 2.2 Implement Background Job Handling

1. Create a background job handler in a new file `src/utils/backgroundJobs.ts`:
   ```typescript
   import { getClient } from '../lib/supabase';
   
   export async function createPublishJob(surveyId: string, participantIds: string[]): Promise<string> {
     const supabase = getClient({ requiresAdmin: true });
     
     // Create a job record
     const { data: job, error } = await supabase
       .from('background_jobs')
       .insert({
         type: 'survey_publish',
         status: 'pending',
         data: { surveyId, participantIds },
         progress: 0
       })
       .select()
       .single();
       
     if (error) throw error;
     
     // Return job ID
     return job.id;
   }
   
   export async function updateJobProgress(jobId: string, progress: number, status?: string): Promise<void> {
     const supabase = getClient({ requiresAdmin: true });
     
     const updates: any = { progress };
     if (status) updates.status = status;
     
     await supabase
       .from('background_jobs')
       .update(updates)
       .eq('id', jobId);
   }
   ```

2. Update the publish endpoint to use background jobs for large batches:
   ```typescript
   // In publish.ts
   const DIRECT_PROCESSING_LIMIT = 20;
   
   if (participants.length > DIRECT_PROCESSING_LIMIT) {
     // Create background job
     const jobId = await createPublishJob(surveyId, participants.map(p => p.id));
     
     // Return job ID to client
     return new Response(JSON.stringify({
       message: 'Survey publishing started as background job',
       jobId
     }), {
       status: 202,
       headers: { 'Content-Type': 'application/json' },
     });
   } else {
     // Process directly for small batches
     // Existing code...
   }
   ```

## 3. Enhance Data Export

### 3.1 Improve CSV Export

1. Update the export endpoint in `src/pages/api/surveys/[id]/export.ts`:
   ```typescript
   function convertToCSV(data: any[], options: any = {}): string {
     if (!data.length) return '';
     
     // Get all possible headers from all objects
     const allHeaders = new Set<string>();
     data.forEach(item => {
       Object.keys(item).forEach(key => allHeaders.add(key));
     });
     
     // Filter headers based on options
     let headers = Array.from(allHeaders);
     if (options.excludeFields?.length) {
       headers = headers.filter(h => !options.excludeFields.includes(h));
     }
     
     // Create header row
     const headerRow = headers.join(',');
     
     // Create data rows
     const rows = data.map(row => {
       return headers.map(header => {
         const value = row[header];
         
         // Handle different value types
         if (value === null || value === undefined) return '';
         if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
         if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
         return value;
       }).join(',');
     });
     
     return [headerRow, ...rows].join('\n');
   }
   ```

2. Add options for data transformation:
   ```typescript
   // In export.ts
   const { format, options } = await request.json();
   
   // Apply transformations based on options
   let processedData = data;
   
   if (options.anonymize) {
     processedData = anonymizeData(processedData);
   }
   
   if (options.includeMetadata === false) {
     options.excludeFields = ['created_at', 'updated_at', 'id', ...options.excludeFields || []];
   }
   
   const csv = convertToCSV(processedData, options);
   ```

### 3.2 Implement PDF Export

1. Install a PDF generation library:
   ```bash
   npm install pdfkit
   ```

2. Create a PDF generator in `src/utils/pdfGenerator.ts`:
   ```typescript
   import PDFDocument from 'pdfkit';
   
   export async function generateSurveyPDF(survey: any, responses: any[], options: any = {}): Promise<Buffer> {
     return new Promise((resolve, reject) => {
       try {
         const doc = new PDFDocument({ margin: 50 });
         const chunks: Buffer[] = [];
         
         // Collect PDF data chunks
         doc.on('data', chunk => chunks.push(chunk));
         doc.on('end', () => resolve(Buffer.concat(chunks)));
         
         // Add title
         doc.fontSize(25).text(`Survey Report: ${survey.title}`, { align: 'center' });
         doc.moveDown();
         
         // Add summary
         doc.fontSize(14).text('Summary', { underline: true });
         doc.fontSize(12).text(`Total Responses: ${responses.length}`);
         doc.moveDown();
         
         // Add response data
         doc.fontSize(14).text('Responses', { underline: true });
         doc.moveDown();
         
         // Table headers
         const tableTop = doc.y;
         const tableHeaders = ['Date', 'Status', 'Success Rate'];
         
         // Draw table
         // ... table drawing code ...
         
         doc.end();
       } catch (error) {
         reject(error);
       }
     });
   }
   ```

3. Add PDF export to the export endpoint:
   ```typescript
   // In export.ts
   if (format === 'pdf') {
     const pdfBuffer = await generateSurveyPDF(survey, data, options);
     
     return new Response(pdfBuffer, {
       status: 200,
       headers: {
         'Content-Type': 'application/pdf',
         'Content-Disposition': `attachment; filename="survey-${surveyId}-export.pdf"`
       }
     });
   }
   ```

## 4. General Improvements

### 4.1 Fix Supabase Client Initialization Warnings

1. Update `src/lib/supabase.ts` to use a singleton pattern:
   ```typescript
   let supabaseClient: SupabaseClient | null = null;
   let supabaseAdminClient: SupabaseClient | null = null;
   
   export function getClient(options: { requiresAdmin?: boolean; bypassRLS?: boolean } = {}): SupabaseClient {
     const { requiresAdmin = false, bypassRLS = false } = options;
     
     if (requiresAdmin || bypassRLS) {
       if (!supabaseAdminClient) {
         supabaseAdminClient = createClient(
           import.meta.env.PUBLIC_SUPABASE_URL,
           import.meta.env.SUPABASE_SERVICE_KEY,
           {
             auth: {
               autoRefreshToken: false,
               persistSession: false
             }
           }
         );
       }
       return supabaseAdminClient;
     }
     
     if (!supabaseClient) {
       supabaseClient = createClient(
         import.meta.env.PUBLIC_SUPABASE_URL,
         import.meta.env.PUBLIC_SUPABASE_ANON_KEY
       );
     }
     
     return supabaseClient;
   }
   ```

2. Update imports across the codebase to use the getClient function:
   ```typescript
   // Replace direct imports
   // import { supabase } from '../../../../lib/supabase';
   import { getClient } from '../../../../lib/supabase';
   
   // Then use
   const supabase = getClient();
   // Or for admin operations
   const supabase = getClient({ requiresAdmin: true });
   ```

### 4.2 Implement Comprehensive Error Handling

1. Create a standardized error handler in `src/utils/errorHandler.ts`:
   ```typescript
   export interface ApiError {
     status: number;
     message: string;
     details?: any;
   }
   
   export function createErrorResponse(error: any, defaultMessage = 'An error occurred'): Response {
     console.error('API Error:', error);
     
     let status = 500;
     let message = defaultMessage;
     let details = undefined;
     
     // Handle known error types
     if (error.status && error.message) {
       status = error.status;
       message = error.message;
       details = error.details;
     } else if (error.code === 'PGRST116') {
       status = 404;
       message = 'Resource not found';
     } else if (error.code === '23505') {
       status = 409;
       message = 'Duplicate resource';
     } else if (error instanceof Error) {
       message = error.message;
     }
     
     return new Response(JSON.stringify({ error: message, details }), {
       status,
       headers: { 'Content-Type': 'application/json' },
     });
   }
   ```

2. Use the standardized error handler in API endpoints:
   ```typescript
   // In API endpoints
   try {
     // API logic
   } catch (error) {
     return createErrorResponse(error, 'Failed to process survey data');
   }
   ```

## 5. Database Schema Updates

Create a new migration file `supabase/migrations/20250225000000_survey_module_updates.sql`:

```sql
-- Add sound_mapping_responses column to survey_responses if not exists
ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS sound_mapping_responses JSONB;

-- Create background_jobs table for handling long-running tasks
CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  data JSONB NOT NULL DEFAULT '{}',
  progress NUMERIC NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on job status for efficient querying
CREATE INDEX IF NOT EXISTS background_jobs_status_idx ON background_jobs(status);

-- Add function to update job progress
CREATE OR REPLACE FUNCTION update_job_progress(
  job_id UUID,
  new_progress NUMERIC,
  new_status TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE background_jobs
  SET 
    progress = new_progress,
    status = COALESCE(new_status, status),
    updated_at = NOW(),
    completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;
```

## Testing Plan

For each feature, implement the following tests:

1. **Unit Tests**:
   - Test individual functions with various inputs
   - Mock external dependencies

2. **Integration Tests**:
   - Test API endpoints with various request scenarios
   - Verify database interactions

3. **End-to-End Tests**:
   - Test complete workflows from UI to database
   - Verify email sending with test accounts

4. **Performance Tests**:
   - Test with large datasets
   - Verify background job processing

## Conclusion

This technical guide provides specific implementation details for completing the survey module. Follow these instructions to fix the bugs and implement the remaining features. Remember to test thoroughly after each implementation step.