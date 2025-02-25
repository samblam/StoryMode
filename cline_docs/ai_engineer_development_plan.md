# AI Engineer Development Plan for StoryMode

## Project Overview

StoryMode is a full-stack application for creating, managing, and analyzing surveys. The application allows users to create surveys, associate them with sound profiles, collect responses, and analyze the results. The project is built using Astro, TypeScript, and PostgreSQL with Supabase for authentication and storage.

## Current Status

The project is in active development with core functionality for user management, survey creation, and sound management implemented. Recent work has focused on participant management features and fixing critical bugs in the survey preview functionality. There are several critical bugs and incomplete features that need to be addressed.

## Development Plan

This plan outlines the steps required to address the current issues and implement the next features in the development roadmap.

### Phase 1: Fix Critical Bugs

#### 1. Survey Preview UI Issues

**Objective:** Fix the remaining UI issues in the survey preview to ensure proper display and functionality.

**Tasks:**
1. Update the survey page to display videos correctly
   - Examine video loading in the survey preview component
   - Implement proper video URL generation and display
   - Update the SurveyPreview.astro component to handle video display

2. Change input fields to multiple choice selections
   - Modify the survey preview UI to display multiple choice options instead of fill-in-the-blank
   - Use the survey functions data to generate the correct question types
   - Implement the appropriate UI components for multiple choice selections

3. Replace navigation buttons with a submit button
   - Remove next/previous navigation buttons
   - Add a single submit button at the end of the survey
   - Update the navigation logic to handle single-page submission

4. Implement proper response submission
   - Create or update the response submission API endpoint
   - Handle the mapping between sound profiles and responses
   - Update participant status upon submission
   - Add confirmation message after submission

**Implementation Details:**
```typescript
// Example changes for video display in SurveyPreview.astro
{video && (
  <div class="video-container">
    <video controls src={video.url} poster={video.thumbnail}>
      <source src={video.url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>
)}

// Example changes for multiple choice questions
{survey.functions && survey.functions.map((func, index) => (
  <div class="question-container">
    <h3>{func.question}</h3>
    <div class="options-container">
      {func.options.map((option) => (
        <label class="option">
          <input type="radio" name={`question-${index}`} value={option} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  </div>
))}

// Example submit button implementation
<div class="submit-container">
  <button type="submit" id="submit-survey" class="primary-button">
    Submit Survey
  </button>
</div>
```

**Validation:**
- Verify videos load and play correctly in the preview
- Ensure multiple choice questions display correctly and can be selected
- Check that the submit button appears and functions properly
- Test the entire submission flow from start to completion

#### 2. Fix Other Critical Bugs

**Objective:** Address all remaining critical bugs to ensure stable functionality.

**Tasks:**
1. Fix Survey Creation Bug (400 Bad Request)
   - Implement proper validation in CreateSurveyForm.astro
   - Update API endpoint validation
   - Add comprehensive error handling
   - Provide clear error messages to the user

2. Fix Participant Management UI Issues
   - Resolve Sortable.js integration problems
   - Fix UI elements that are not selectable/viewable
   - Eliminate multiple Supabase client initialization warnings

**Implementation Details:**
```typescript
// Example validation in CreateSurveyForm.astro
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('survey-form');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Form validation
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      
      let hasErrors = false;
      const errors = {};
      
      if (!title) {
        errors.title = 'Title is required';
        hasErrors = true;
      }
      
      if (!description) {
        errors.description = 'Description is required';
        hasErrors = true;
      }
      
      // Display errors if any
      if (hasErrors) {
        displayErrors(errors);
        return;
      }
      
      // If no errors, submit the form
      const formData = new FormData(form);
      
      try {
        const response = await fetch('/api/surveys', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create survey');
        }
        
        const data = await response.json();
        window.location.href = `/admin/surveys/${data.id}/edit`;
      } catch (error) {
        displayServerError(error.message);
      }
    });
  });
  
  function displayErrors(errors) {
    // Clear previous errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
    
    // Display new errors
    Object.entries(errors).forEach(([field, message]) => {
      const errorElement = document.getElementById(`${field}-error`);
      if (errorElement) {
        errorElement.textContent = message;
      }
    });
  }
  
  function displayServerError(message) {
    const serverErrorElement = document.getElementById('server-error');
    serverErrorElement.textContent = message;
    serverErrorElement.style.display = 'block';
  }
</script>
```

**Validation:**
- Test survey creation with valid and invalid data
- Verify error messages appear correctly
- Check that sortable elements in participant management function properly
- Ensure all UI elements are selectable and viewable
- Monitor browser console for Supabase client warnings

### Phase 2: Database Schema Updates

**Objective:** Implement necessary database schema updates to support new features.

**Tasks:**
1. Create a new migration file for remaining schema changes
   - Add status column to participants table (if not already done)
   - Verify sound_mapping_responses column in survey_responses table

**Implementation Details:**
```sql
-- Example migration file content: 20250226000000_participant_status_updates.sql

-- Add status if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'participants' AND column_name = 'status') THEN
        ALTER TABLE participants 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'inactive' 
        CHECK (status IN ('inactive', 'active', 'completed', 'expired'));
    END IF;
END $$;

-- Add index on status column for faster queries
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- Add constraint for status transitions
ALTER TABLE participants
DROP CONSTRAINT IF EXISTS status_transition_check;

ALTER TABLE participants
ADD CONSTRAINT status_transition_check
CHECK (status IN ('inactive', 'active', 'completed', 'expired'));

-- Verify sound_mapping_responses column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'survey_responses' AND column_name = 'sound_mapping_responses') THEN
        ALTER TABLE survey_responses 
        ADD COLUMN sound_mapping_responses JSONB;
    END IF;
END $$;
```

**Validation:**
- Run the migration against the development database
- Verify the columns are created correctly
- Test with some sample data to ensure constraints work properly

### Phase 3: Participant Status Management

**Objective:** Implement a comprehensive participant status management system.

**Tasks:**
1. Update participant creation endpoints to set initial status
   - Modify API endpoints to set 'inactive' status on creation
   - Update ParticipantManager.astro to display status
   - Add status filtering and sorting

2. Implement status update logic
   - Create API endpoint for updating participant status
   - Implement batch status update functionality
   - Add UI elements for status management

**Implementation Details:**
```typescript
// Example endpoint for participant status update
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check for admin access
    const user = locals.user;
    if (!user || !user.isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { participantId, newStatus } = body;

    if (!participantId || !newStatus) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate status
    const validStatuses = ['inactive', 'active', 'completed', 'expired'];
    if (!validStatuses.includes(newStatus)) {
      return new Response(JSON.stringify({ error: 'Invalid status value' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update participant status
    const supabase = getClient({ requiresAdmin: true });
    const { data, error } = await supabase
      .from('participants')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', participantId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating participant status:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, participant: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error updating participant status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Example status UI changes in ParticipantManager.astro
<div class="status-filter">
  <label for="status-select">Filter by Status:</label>
  <select id="status-select">
    <option value="all">All</option>
    <option value="inactive">Inactive</option>
    <option value="active">Active</option>
    <option value="completed">Completed</option>
    <option value="expired">Expired</option>
  </select>
</div>

<table class="participants-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="participants-list">
    {participants.map((participant) => (
      <tr data-id={participant.id}>
        <td>{participant.name || 'N/A'}</td>
        <td>{participant.email}</td>
        <td>
          <span class={`status-badge status-${participant.status}`}>
            {participant.status}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="edit-btn" data-id={participant.id}>Edit</button>
            <button class="delete-btn" data-id={participant.id}>Delete</button>
            <select class="status-update" data-id={participant.id}>
              <option value="">Change Status</option>
              <option value="inactive">Set Inactive</option>
              <option value="active">Set Active</option>
              <option value="completed">Set Completed</option>
              <option value="expired">Set Expired</option>
            </select>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Validation:**
- Test creating new participants and verify status is set to 'inactive'
- Check that status is displayed correctly in the UI
- Test status updates through the UI and API
- Verify status filtering works properly

### Phase 4: Survey Publishing

**Objective:** Implement a complete survey publishing workflow with unique URLs for participants.

**Tasks:**
1. Create publish endpoint
   - Add API endpoint for publishing a survey
   - Update survey record with publish status
   - Generate unique access URLs for participants

2. Implement URL generation
   - Create secure URL generation function
   - Store URLs with participant records
   - Verify URL uniqueness and security

3. Set up email sending
   - Create email templates for survey invitations
   - Implement email sending functionality
   - Add tracking for sent emails

4. Handle participant status updates
   - Update participant status to 'active' when survey is published
   - Add background job handling for large participant lists

**Implementation Details:**
```typescript
// Example survey publish endpoint
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authorization
    const user = locals.user;
    if (!user || !user.isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const surveyId = params.id;
    if (!surveyId) {
      return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { sendEmails = true } = body;

    // Get survey data
    const supabase = getClient({ requiresAdmin: true });
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (surveyError) {
      return new Response(JSON.stringify({ error: 'Survey not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('survey_id', surveyId);

    if (participantsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch participants' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!participants || participants.length === 0) {
      return new Response(JSON.stringify({ error: 'No participants found for this survey' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark survey as published
    const { error: publishError } = await supabase
      .from('surveys')
      .update({ 
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', surveyId);

    if (publishError) {
      return new Response(JSON.stringify({ error: 'Failed to publish survey' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a background job for processing participants
    const jobData = {
      type: 'publish_survey',
      status: 'pending',
      data: {
        surveyId,
        sendEmails,
        participantCount: participants.length
      },
      created_at: new Date().toISOString()
    };

    const { data: job, error: jobError } = await supabase
      .from('background_jobs')
      .insert([jobData])
      .select()
      .single();

    if (jobError) {
      return new Response(JSON.stringify({ error: 'Failed to create background job' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Start processing in background
    processParticipantsInBackground(job.id, survey, participants, sendEmails);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Survey published successfully. Processing ${participants.length} participants.`,
      jobId: job.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error publishing survey:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Background processing function
async function processParticipantsInBackground(jobId, survey, participants, sendEmails) {
  const supabase = getClient({ requiresAdmin: true });
  
  try {
    // Update job status to processing
    await supabase
      .from('background_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    const batchSize = 50;
    const totalParticipants = participants.length;
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Process participants in batches
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      
      // Generate access URLs and update status
      const participantUpdates = batch.map(participant => {
        const accessToken = generateSecureToken();
        const accessUrl = `${process.env.PUBLIC_SITE_URL}/surveys/${survey.id}?token=${accessToken}`;
        
        return {
          id: participant.id,
          access_token: accessToken,
          access_url: accessUrl,
          status: 'active',
          updated_at: new Date().toISOString()
        };
      });
      
      // Update participants
      const { data, error } = await supabase
        .from('participants')
        .upsert(participantUpdates, { onConflict: 'id' })
        .select();
        
      if (error) {
        console.error('Error updating participants:', error);
        errorCount += batch.length;
      } else {
        successCount += data.length;
        
        // Send emails if requested
        if (sendEmails) {
          for (const participant of data) {
            try {
              await sendSurveyInvitation(survey, participant);
              
              // Update last_emailed_at
              await supabase
                .from('participants')
                .update({ last_emailed_at: new Date().toISOString() })
                .eq('id', participant.id);
            } catch (emailError) {
              console.error('Error sending email to participant:', participant.id, emailError);
              // Don't count this as a failure for the overall process
            }
          }
        }
      }
      
      processedCount += batch.length;
      
      // Update job progress
      await supabase
        .from('background_jobs')
        .update({ 
          progress: Math.floor((processedCount / totalParticipants) * 100),
          data: {
            ...job.data,
            processedCount,
            successCount,
            errorCount
          }
        })
        .eq('id', jobId);
    }
    
    // Mark job as completed
    await supabase
      .from('background_jobs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
        data: {
          ...job.data,
          processedCount,
          successCount,
          errorCount,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Error in background processing:', error);
    
    // Mark job as failed
    await supabase
      .from('background_jobs')
      .update({ 
        status: 'failed',
        error: error.message,
        completed_at: new Date().toISOString(),
        data: {
          ...job.data,
          error: error.message
        }
      })
      .eq('id', jobId);
  }
}

// Generate secure token for participant access
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send survey invitation email
async function sendSurveyInvitation(survey, participant) {
  const emailTemplate = getEmailTemplate('survey_invitation', {
    surveyTitle: survey.title,
    participantName: participant.name || 'Participant',
    accessUrl: participant.access_url,
    expiryDate: addDays(new Date(), 14).toLocaleDateString()
  });
  
  return await sendEmail({
    to: participant.email,
    subject: `Invitation to participate in survey: ${survey.title}`,
    html: emailTemplate,
    replyTo: survey.contact_email || undefined
  });
}
```

**Validation:**
- Test publishing a survey with a small number of participants
- Verify unique URLs are generated correctly
- Check that emails are sent properly
- Monitor background job processing
- Verify participant status updates

### Phase 5: Response Saving

**Objective:** Enhance response saving with sound mapping data and participant status updates.

**Tasks:**
1. Update response saving logic
   - Modify API endpoint for saving responses
   - Add sound mapping data handling
   - Implement participant status updates

2. Add validation and error handling
   - Validate response data before saving
   - Provide clear error messages
   - Implement transaction-based saving

**Implementation Details:**
```typescript
// Example response saving endpoint
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const surveyId = params.id;
    if (!surveyId) {
      return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { 
      participantId, 
      participantToken,
      responses, 
      soundMappingResponses 
    } = body;

    if (!participantId || !participantToken || !responses) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify participant access
    const supabase = getClient({ requiresAdmin: true });
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .eq('access_token', participantToken)
      .single();

    if (participantError || !participant) {
      return new Response(JSON.stringify({ error: 'Invalid participant access' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if participant is in active status
    if (participant.status !== 'active') {
      return new Response(JSON.stringify({ 
        error: 'This survey is no longer available or has already been completed' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save response data
    const responseData = {
      survey_id: surveyId,
      participant_id: participantId,
      responses,
      sound_mapping_responses: soundMappingResponses || null,
      created_at: new Date().toISOString()
    };

    const { data: savedResponse, error: responseError } = await supabase
      .from('survey_responses')
      .insert([responseData])
      .select()
      .single();

    if (responseError) {
      console.error('Error saving survey response:', responseError);
      return new Response(JSON.stringify({ error: 'Failed to save responses' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update participant status to completed
    const { error: statusError } = await supabase
      .from('participants')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (statusError) {
      console.error('Error updating participant status:', statusError);
      // Don't fail the whole request, we've already saved the response
    }

    // Send completion email if needed
    try {
      await sendSurveyCompletionEmail(surveyId, participant);
    } catch (emailError) {
      console.error('Error sending completion email:', emailError);
      // Don't fail the request for email errors
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Survey responses saved successfully',
      responseId: savedResponse.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving survey responses:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Send survey completion email
async function sendSurveyCompletionEmail(surveyId, participant) {
  const supabase = getClient({ requiresAdmin: true });
  
  // Get survey details
  const { data: survey, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single();
    
  if (error || !survey) {
    throw new Error('Survey not found');
  }
  
  const emailTemplate = getEmailTemplate('survey_completion', {
    surveyTitle: survey.title,
    participantName: participant.name || 'Participant',
    completionDate: new Date().toLocaleDateString()
  });
  
  return await sendEmail({
    to: participant.email,
    subject: `Thank you for completing the survey: ${survey.title}`,
    html: emailTemplate,
    replyTo: survey.contact_email || undefined
  });
}
```

**Validation:**
- Test submitting survey responses with and without sound mapping data
- Verify responses are saved correctly in the database
- Check that participant status is updated to 'completed'
- Test error handling with invalid data
- Verify completion emails are sent

### Phase 6: Testing and Documentation

**Objective:** Ensure the implemented features are thoroughly tested and documented.

**Tasks:**
1. Write tests for new functionality
   - Unit tests for critical functions
   - Integration tests for API endpoints
   - End-to-end tests for key workflows

2. Update documentation
   - Update API documentation
   - Document database schema changes
   - Document new functionality

3. Create user guides
   - Survey creation and publishing workflow
   - Participant management guide
   - Response collection and analysis guide

**Implementation Details:**
```typescript
// Example test for participant status update API
describe('Participant Status Update API', () => {
  let supabase;
  let testSurveyId;
  let testParticipantId;

  beforeAll(async () => {
    supabase = getClient({ requiresAdmin: true });
    
    // Create test survey
    const { data: survey } = await supabase
      .from('surveys')
      .insert([{
        title: 'Test Survey',
        description: 'For testing participant status',
        created_by: 'test-user',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
      
    testSurveyId = survey.id;
    
    // Create test participant
    const { data: participant } = await supabase
      .from('participants')
      .insert([{
        survey_id: testSurveyId,
        email: 'test@example.com',
        name: 'Test Participant',
        status: 'inactive',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
      
    testParticipantId = participant.id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await supabase.from('participants').delete().eq('id', testParticipantId);
    await supabase.from('surveys').delete().eq('id', testSurveyId);
  });
  
  it('should update participant status', async () => {
    const res = await fetch(`/api/participants/${testParticipantId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newStatus: 'active'
      })
    });
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.participant.status).toBe('active');
    
    // Verify in database
    const { data: updatedParticipant } = await supabase
      .from('participants')
      .select('*')
      .eq('id', testParticipantId)
      .single();
      
    expect(updatedParticipant.status).toBe('active');
  });
  
  it('should reject invalid status values', async () => {
    const res = await fetch(`/api/participants/${testParticipantId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newStatus: 'invalid-status'
      })
    });
    
    expect(res.status).toBe(400);
    
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
```

**Example Documentation:**
```markdown
# Participant Status Management

This document describes the participant status management system in the StoryMode application.

## Status Lifecycle

Participants go through the following status transitions:

1. **Inactive**: Initial status when a participant is created but not yet invited to the survey.
2. **Active**: Status after survey is published and participant is invited.
3. **Completed**: Status after participant submits survey responses.
4. **Expired**: Optional status when survey access has expired.

## API Endpoints

### Update Participant Status

```
POST /api/participants/:id/status
```

**Request Body:**
```json
{
  "newStatus": "active" // One of: inactive, active, completed, expired
}
```

**Response:**
```json
{
  "success": true,
  "participant": {
    "id": "123",
    "status": "active",
    "updated_at": "2025-02-26T12:00:00Z"
  }
}
```

## Database Schema

The `participants` table includes the following status-related columns:

- `status`: TEXT NOT NULL DEFAULT 'inactive' - Current status of the participant
- `created_at`: TIMESTAMP - When the participant was created
- `updated_at`: TIMESTAMP - When the participant was last updated
- `completed_at`: TIMESTAMP - When the participant completed the survey
- `last_emailed_at`: TIMESTAMP - When the participant was last sent an email

## User Interface

The ParticipantManager component includes status filtering and bulk status update options. Administrators can:

1. Filter participants by status
2. Update individual participant status
3. Perform bulk status updates
4. Track status changes over time
```

**Validation:**
- Run automated tests to verify functionality
- Perform manual testing of critical workflows
- Review documentation for accuracy and completeness
- Get feedback from stakeholders

## Implementation Timeline

### Week 1: Bug Fixes and Schema Updates
- Day 1-2: Fix Survey Preview UI issues
- Day 3-4: Fix other critical bugs
- Day 5: Implement database schema updates

### Week 2: Participant Status and Survey Publishing
- Day 1-2: Implement participant status management
- Day 3-5: Implement survey publishing workflow

### Week 3: Response Saving and Testing
- Day 1-2: Enhance response saving
- Day 3-4: Write tests and documentation
- Day 5: Final testing and bug fixes

## Conclusion

This development plan outlines the steps needed to address the current issues and implement the next features in the StoryMode project. By following this plan, the AI engineer should be able to systematically tackle each phase of development, ensuring a stable and feature-complete survey system.

The most critical priorities are:
1. Fixing the survey preview UI issues
2. Implementing proper participant status management
3. Creating a complete survey publishing workflow
4. Enhancing response saving with sound mapping data

Once these features are implemented, the survey system will provide a comprehensive solution for creating, publishing, and collecting responses to surveys with sound profiles.