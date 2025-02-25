# Participant Status Management Development Plan

## Feature Overview

Participant Status Management is a core part of the survey workflow, allowing the system to track participants through their journey from invitation to completion. The feature needs to support four status states:
- **Inactive**: Initial state when a participant is created
- **Active**: When a survey is published and participant has access
- **Completed**: After the participant has submitted responses
- **Expired**: When the participant's access has expired

## Current Status

The `status` column already exists in the participants table in Supabase as indicated in the progress document. The implementation will focus on leveraging this existing column rather than creating it.

## Implementation Tasks

### 1. Update Participant Creation Functionality

**Objective**: Ensure all newly created participants have an initial "inactive" status.

**Tasks**:
- Update participant creation endpoint to explicitly set default "inactive" status
- Modify bulk participant creation to include status field
- Add status validation to prevent invalid status values

**Technical Implementation**:
- Update API endpoints in `/src/pages/api/participants/`
- Add status validation in request handling
- Update ParticipantManager.astro to reflect status in UI

### 2. Implement Status Transitions Logic

**Objective**: Create functionality to transition participants between statuses.

**Tasks**:
- Create dedicated API endpoint for updating participant status
- Implement individual status update functionality
- Implement batch status update for multiple participants
- Add status-based filtering in the participant management UI

**Technical Implementation**:
- Create API endpoint: `/src/pages/api/participants/[id]/status.ts`
- Add batch update endpoint: `/src/pages/api/participants/batch-update.ts`
- Implement status filters in ParticipantManager.astro
- Add status update dropdown in participant list

### 3. Enhance ParticipantManager UI

**Objective**: Update the participant management UI to include status visualization and controls.

**Tasks**:
- Add status column to participant table
- Implement status filtering dropdown
- Add status badges with appropriate styling
- Create status update controls for individual and batch updates

**Technical Implementation**:
- Update ParticipantManager.astro with status column
- Add status filtering component
- Implement status badges with CSS
- Add JavaScript for status update interactions

### 4. Integrate with Survey Publishing and Response Collection

**Objective**: Connect status management with survey publishing and response collection processes.

**Tasks**:
- Update survey publishing process to change participant status to "active"
- Modify response collection endpoint to update status to "completed"
- Add background job handling for bulk status updates

**Technical Implementation**:
- Modify publish endpoint to update participant statuses
- Update response saving endpoint to change status
- Implement background job processing for large participant lists

### 5. Add Validation and Error Handling

**Objective**: Ensure robust validation and error handling for status operations.

**Tasks**:
- Add validation for status transitions
- Implement proper error handling for status update operations
- Add transaction support for batch operations
- Provide clear error messages to administrators

**Technical Implementation**:
- Create validation functions for status transitions
- Implement try/catch blocks with specific error handling
- Use database transactions for batch operations
- Return appropriate error responses with context

## Detailed Implementation Plan

### Step 1: Create Status Update API Endpoint

Create a new API endpoint for updating participant status:

```typescript
// File: src/pages/api/participants/[id]/status.ts

import type { APIRoute } from "astro";
import { getClient } from "../../../../lib/supabase";

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check for admin access
    const user = locals.user;
    if (!user || !user.isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const participantId = params.id;
    if (!participantId) {
      return new Response(JSON.stringify({ error: "Participant ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { newStatus } = body;

    if (!newStatus) {
      return new Response(JSON.stringify({ error: "New status is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate status
    const validStatuses = ["inactive", "active", "completed", "expired"];
    if (!validStatuses.includes(newStatus)) {
      return new Response(JSON.stringify({ error: "Invalid status value" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update participant status
    const supabase = getClient({ requiresAdmin: true });
    const { data, error } = await supabase
      .from("participants")
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", participantId)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating participant status:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, participant: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error updating participant status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 2: Create Batch Status Update Endpoint

```typescript
// File: src/pages/api/participants/batch-update.ts

import type { APIRoute } from "astro";
import { getClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check for admin access
    const user = locals.user;
    if (!user || !user.isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { participantIds, newStatus, surveyId } = body;

    if ((!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) && !surveyId) {
      return new Response(JSON.stringify({ error: "Either participantIds or surveyId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!newStatus) {
      return new Response(JSON.stringify({ error: "New status is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate status
    const validStatuses = ["inactive", "active", "completed", "expired"];
    if (!validStatuses.includes(newStatus)) {
      return new Response(JSON.stringify({ error: "Invalid status value" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = getClient({ requiresAdmin: true });
    let query = supabase.from("participants").update({ 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    });

    // Apply filters
    if (participantIds && participantIds.length > 0) {
      query = query.in("id", participantIds);
    }

    if (surveyId) {
      query = query.eq("survey_id", surveyId);
    }

    // Execute update
    const { data, error, count } = await query.select().order('created_at', { ascending: false });

    if (error) {
      console.error("Error updating participants status:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Updated ${count || data.length} participants to status: ${newStatus}`,
      participants: data 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error updating participants status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 3: Update ParticipantManager.astro

Enhance the ParticipantManager component to show and manage participant statuses:

```astro
<!-- Modifications to src/components/admin/ParticipantManager.astro -->

<!-- Add status filter to the existing filters section -->
<div class="filters">
  <!-- Other filters -->
  <div class="filter-group">
    <label for="status-filter">Status:</label>
    <select id="status-filter" class="status-filter">
      <option value="all">All Statuses</option>
      <option value="inactive">Inactive</option>
      <option value="active">Active</option>
      <option value="completed">Completed</option>
      <option value="expired">Expired</option>
    </select>
  </div>
</div>

<!-- Add status column to the table -->
<table class="participants-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
      <!-- Other columns -->
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="participants-list">
    {participants.map((participant) => (
      <tr data-id={participant.id}>
        <td>{participant.name || 'N/A'}</td>
        <td>{participant.email}</td>
        <td>
          <span class={`status-badge status-${participant.status || 'inactive'}`}>
            {participant.status || 'inactive'}
          </span>
        </td>
        <!-- Other columns -->
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

<!-- Add batch actions -->
<div class="batch-actions">
  <h3>Batch Actions</h3>
  <div class="action-group">
    <select id="batch-status-update">
      <option value="">Change Status For Selected</option>
      <option value="inactive">Set Inactive</option>
      <option value="active">Set Active</option>
      <option value="completed">Set Completed</option>
      <option value="expired">Set Expired</option>
    </select>
    <button id="apply-batch-status" class="primary-button">Apply</button>
  </div>
</div>

<!-- Add CSS for status badges -->
<style>
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-inactive {
    background-color: #e5e5e5;
    color: #666;
  }
  .status-active {
    background-color: #d1fae5;
    color: #047857;
  }
  .status-completed {
    background-color: #dbeafe;
    color: #1e40af;
  }
  .status-expired {
    background-color: #fee2e2;
    color: #b91c1c;
  }
</style>

<!-- Add JavaScript for status management -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    statusFilter?.addEventListener('change', () => {
      filterParticipants();
    });

    // Individual status update
    const statusUpdateSelects = document.querySelectorAll('.status-update');
    statusUpdateSelects.forEach(select => {
      select.addEventListener('change', async (e) => {
        const select = e.target;
        const newStatus = select.value;
        const participantId = select.getAttribute('data-id');
        
        if (!newStatus || !participantId) return;
        
        try {
          const response = await fetch(`/api/participants/${participantId}/status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newStatus }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update status');
          }
          
          // Reset select and refresh
          select.value = '';
          window.location.reload();
        } catch (error) {
          console.error('Failed to update status:', error);
          alert(`Error: ${error.message}`);
        }
      });
    });

    // Batch status update
    const applyBatchStatusBtn = document.getElementById('apply-batch-status');
    applyBatchStatusBtn?.addEventListener('click', async () => {
      const newStatus = document.getElementById('batch-status-update').value;
      if (!newStatus) return;
      
      const selectedRows = document.querySelectorAll('tr.selected');
      if (selectedRows.length === 0) {
        alert('Please select at least one participant');
        return;
      }
      
      const participantIds = Array.from(selectedRows).map(row => row.getAttribute('data-id'));
      
      try {
        const response = await fetch('/api/participants/batch-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ participantIds, newStatus }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update statuses');
        }
        
        // Refresh the page to show updates
        window.location.reload();
      } catch (error) {
        console.error('Failed to update statuses:', error);
        alert(`Error: ${error.message}`);
      }
    });

    // Helper function to filter participants
    function filterParticipants() {
      const statusValue = statusFilter.value;
      const rows = document.querySelectorAll('#participants-list tr');
      
      rows.forEach(row => {
        const statusBadge = row.querySelector('.status-badge');
        const status = statusBadge?.textContent?.trim().toLowerCase();
        
        if (statusValue === 'all' || status === statusValue) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  });
</script>
```

### Step 4: Update Participant Creation Endpoint

Modify the participant creation endpoint to ensure all new participants have "inactive" status:

```typescript
// Modifications to participant creation endpoint

// Ensure default status is set
const participantData = {
  survey_id: surveyId,
  email: email.trim(),
  name: name?.trim() || null,
  status: 'inactive', // Explicitly set default status
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Insert with validation
const { data, error } = await supabase
  .from("participants")
  .insert([participantData])
  .select();
```

### Step 5: Update Response Collection to Update Status

Modify the survey response collection endpoint to update participant status:

```typescript
// Modifications to response saving endpoint

// After successfully saving the response
const { error: statusError } = await supabase
  .from("participants")
  .update({ 
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq("id", participantId);

if (statusError) {
  console.error("Error updating participant status:", statusError);
  // Don't fail the whole request, we've already saved the response
}
```

### Step 6: Update Survey Publishing to Activate Participants

Modify the survey publishing process to change participant status:

```typescript
// Modifications to publish endpoint

// Inside the batch processing function
const participantUpdates = batch.map(participant => {
  const accessToken = generateSecureToken();
  const accessUrl = `${process.env.PUBLIC_SITE_URL}/surveys/${survey.id}?token=${accessToken}`;
  
  return {
    id: participant.id,
    access_token: accessToken,
    access_url: accessUrl,
    status: 'active', // Change status to active
    updated_at: new Date().toISOString()
  };
});

// Update participants
const { data, error } = await supabase
  .from('participants')
  .upsert(participantUpdates, { onConflict: 'id' })
  .select();
```

## Testing Plan

1. **Unit Testing**
   - Test status validation functions
   - Test status transition logic
   - Test error handling for invalid inputs

2. **API Testing**
   - Test status update API endpoints with valid and invalid data
   - Test batch update functionality
   - Test authentication and authorization controls

3. **UI Testing**
   - Verify status badges display correctly
   - Test status filtering in the UI
   - Test status update actions through the interface
   - Verify batch actions work correctly

4. **Integration Testing**
   - Test the complete workflow from participant creation to completion
   - Verify status changes correctly when a survey is published
   - Verify status changes correctly when a response is submitted

## Expected Outcomes

After implementing this plan, the system will have a comprehensive participant status management system that:

1. Tracks participants through their entire lifecycle
2. Allows administrators to filter and update statuses
3. Automatically updates statuses during key workflow events
4. Provides clear visual indicators of participant status
5. Supports bulk operations for efficient management

This system will provide the foundation for the survey publishing and response collection features that are next on the roadmap.