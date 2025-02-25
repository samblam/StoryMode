# Active Context

## Current Task

Fixing critical bugs in the survey system while continuing participant and survey management features:

### Bug Fixes (High Priority)
1. Survey Creation Bug
   - 400 (Bad Request) error during form submission
   - Need to implement proper validation and error handling
   - Update API endpoint validation

2. Participant Management Bug
   - UI interaction issues (nothing selectable/viewable)
   - Sortable.js integration problems
   - Multiple Supabase client initialization warnings
   - ✅ Fixed: Participant deletion functionality (both individual and bulk delete)

3. Survey Preview Bug
    - ✅ Fixed: 500 error on survey preview API endpoint
    - ✅ Fixed: All UI issues in survey preview have been resolved:
      - ✅ Fixed: Video now loads correctly using signed URLs
      - ✅ Fixed: Questions display as multiple choice options based on survey functions
      - ✅ Fixed: Replaced navigation buttons with a single submit button
      - ✅ Fixed: Implemented proper response submission and survey completion

4. ✅ Fixed: Participant Upload Bug
   - Fixed manual, CSV, and JSON upload functionality in ParticipantManager.astro
   - Added proper form submission handlers to prevent page refresh
   - Implemented client-side validation and user feedback

### Ongoing Feature Work
1. ✅ Implemented: Participant status management
2. ✅ Implemented: Survey preview functionality
3. Implemented: Survey publishing with unique URLs
4. Enhanced response saving with sound mapping data

## Recent Changes

- Fixed survey preview UI issues completely:
  - Updated the preview API to generate signed URLs for videos
  - Modified the survey page to display videos correctly
  - Changed input fields to multiple choice selections using survey functions
  - Replaced next/previous navigation with a single submit button
  - Implemented proper response submission with a new API endpoint
  - Created thank-you page for after submission
  - Added proper error handling and feedback to the user

- Fixed survey preview API endpoint:
  - Fixed database query issues by removing references to non-existent columns (url, duration)
  - Added code to generate signed URLs for sound files after fetching from database
  - Properly handled the functions data structure
  - Added comprehensive error handling and logging

- Implemented survey module enhancements and bug fixes:
  - Created database migration for survey module updates:
    - Added sound_mapping_responses column to survey_responses table
    - Created background_jobs table for handling long-running tasks
    - Added last_emailed_at column to participants table
    - Added contact_email and published_at columns to surveys table
  - Enhanced email templates and distribution:
    - Created dedicated email template functions for survey invitations, reminders, and completion
    - Improved email sending functionality with better error handling
    - Added support for attachments and reply-to addresses
  - Implemented background job handling for large participant lists:
    - Created a background jobs utility for processing long-running tasks
    - Added database support for tracking job progress
    - Integrated with the publish API endpoint to handle large participant lists
  - Enhanced data export functionality:
    - Implemented comprehensive CSV export with more data
    - Added support for JSON export
    - Prepared for PDF export
    - Added filtering and sorting options

- Fixed participant deletion functionality:
  - Fixed individual delete functionality by updating the delete.ts endpoint to properly parse the participant ID from the request body instead of looking for it in the request headers
  - Updated the API endpoint to use the newer Astro API style with proper error handling
  - Fixed "Delete All" button functionality by:
    - Adding multiple event listeners to ensure the button is clickable
    - Making the button explicitly visible and enabled with proper styling
    - Ensuring event listeners are properly attached when switching tabs
    - Making the handler function globally accessible
    - Adding direct click handlers both in HTML and JavaScript

## Patterns Identified

1. Admin user creation is handled through `src/pages/create-user.astro` and `src/components/UserCreationForm.astro`, but this is for user accounts (admin/client), not survey participants.
2. Survey management components in `src/components/admin/` (e.g., `SurveyDetails.astro`, `SurveyFunctions.astro`, `SurveyActions.astro`, `ResultsSummary.astro`) focus on survey settings and results, not participant management.
3. The participant management feature follows similar patterns to existing admin components:
   - Uses Astro components for UI
   - Implements admin-only API endpoints
   - Follows existing styling patterns
   - Integrates with the Edit Survey page layout
4. New requirements follow established patterns:
   - Database schema changes through migrations
   - Email sending through existing functionality
   - Status management through enum fields
   - Secure URL generation for participants
5. API endpoints should follow the newer Astro API style with proper error handling:
   - Use `export const POST: APIRoute = async ({ params, request, locals }) => { ... }` pattern
   - Parse request body with `await request.json()` or `await request.formData()`
   - Use consistent error handling and response formatting


## Next Steps

1. ✅ Fix Survey Preview UI issues (COMPLETED):
   - ✅ Update the survey page to display videos correctly
   - ✅ Change the input fields to multiple choice selections using survey functions
   - ✅ Replace next/previous navigation with a single submit button
   - ✅ Implement proper response submission and survey completion

2. Fix other Critical Bugs (NEXT PRIORITY):
   - Implement proper validation in CreateSurveyForm.astro
   - Fix Sortable.js integration in ParticipantManager
   - Add comprehensive error handling

3. ✅ Participant Status Management (COMPLETED):
   - ✅ Updated participant creation endpoints to set initial status
   - ✅ Implemented individual and batch status update APIs
   - ✅ Created UI for managing participant statuses
   - ✅ Integrated status updates with survey workflow
   - ✅ Fixed form submission issues in ParticipantManager.astro

5. Survey Publishing:
   - Create publish endpoint
   - Implement URL generation
   - Set up email sending
   - Handle participant status updates

6. Response Saving:
   - Update response saving logic
   - Add sound mapping data handling
   - Implement participant status updates

7. Testing and Documentation:
   - Write tests for new functionality
   - Update documentation
   - Create user guides