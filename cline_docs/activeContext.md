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
    - ✅ Fixed: 500 error on survey preview API endpoint
    - ❌ Broken: "Play Sound" button in survey preview does not work
    - ✅ Fixed: 431 error "Request Header Fields Too Large" when generating preview.
      - Solution: Implemented lazy loading of sound URLs in survey preview.
        - Modified preview API to initially exclude sound details.
        - Adjusted frontend to handle delayed loading of sound URLs.
    - ✅ Fixed: 500 error on "edit survey" page after preview API changes.
      - Solution: Added conditional rendering in `src/pages/surveys/[id].astro` to handle potentially missing sound URLs.
    - ✅ Fixed: All other UI issues in survey preview have been resolved:
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
3. ✅ Implemented: Survey publishing with unique URLs (REQUIRES TESTING)
4. ✅ Implemented: Enhanced response saving with sound mapping data (REQUIRES TESTING)

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
   - ✅ Fixed: Unpublishing the survey in the edit survey menu deletes all sound mappings.
     - The `updateSurveyActive` function was modified to use the `PATCH` method instead of `PUT` to prevent the deletion of sound mappings during unpublish operations.
   - Implement proper validation in CreateSurveyForm.astro
   - Fix Sortable.js integration in ParticipantManager
   - Add comprehensive error handling

3. ✅ Participant Status Management (COMPLETED):
   - ✅ Updated participant creation endpoints to set initial status
   - ✅ Implemented individual and batch status update APIs
   - ✅ Created UI for managing participant statuses
   - ✅ Integrated status updates with survey workflow
   - ✅ Fixed form submission issues in ParticipantManager.astro
   - ✅ Added "Save" button to participant management module
   - ✅ Implemented logic to save participant statuses

5. ✅ Survey Publishing (IMPLEMENTED, NEEDS TESTING):
   - ✅ Create publish endpoint
   - ✅ Implement URL generation
   - ✅ Set up email sending with background job processing
   - ✅ Handle participant status updates

6. ✅ Response Saving (IMPLEMENTED, NEEDS TESTING):
   - ✅ Update response saving logic with sound mapping data
   - ✅ Add sound mapping data handling
   - ✅ Implement participant status updates
   - ✅ Add completion email sending

7. Testing Survey Publishing and Response Saving (NEXT PRIORITY):
    - Dry Run Testing Plan:
        - We are currently conducting a dry run test of the survey publishing, participant fill-out, and response saving workflow.
        - You (the user) will manually publish the survey.
        - The system is expected to:
            - Trigger a background job.
            - Generate a unique survey URL for you.
            - Update your participant status to "active".
            - Send you a survey invitation email.
        - You will then:
            - Access the survey via the URL in the email.
            - Fill out and submit the survey.
        - The system is expected to:
            - Save your responses in the database.
            - Update your participant status to "completed".
            - Send you a survey completion email.
        - You will then verify the results and report any issues for debugging.
   - Test publishing survey:
     - Create a test survey with test participants
     - Use the admin interface to publish the survey
     - Verify background job creation and completion
     - Check participant status updates (inactive → active)
     - Verify email sending (check email logs or test email account)
   - Test survey response collection:
     - Use generated participant URLs to access the survey
     - Complete and submit the survey form
     - Verify responses are saved in the database
     - Check participant status updates (active → completed)
     - Verify completion email is sent
   - Edge case testing:
     - Test with large participant lists (100+ participants)
     - Test error handling with invalid inputs
     - Test access control (only active participants can submit)
   - Performance testing:
     - Monitor background job execution time
     - Check for any performance bottlenecks

8. Documentation:
   - Update technical documentation
   - Create user guides for survey publishing workflow
   - Document API endpoints and response formats

9. Debugging:
   - Access token generated for `samaelbarefoot@gmail.com` but not `samuel.ellis.barefoot@gmail.com` (probably some hardcoded crap conflicting) - FIXED: Access tokens are now generated for all participants.
   - No access URL at all. - FIXED: The PUBLIC_BASE_URL environment variable was not set, causing the survey URL to be invalid.
   - Looks like the survey preview logic is different from the logic behind surveys sent to participants - PENDING
   - Survey URL sent to participant isn't valid (even on localhost, should say localhost) - FIXED: The PUBLIC_BASE_URL environment variable was not set, causing the survey URL to be invalid.
   - The access token is now generated for samuel.ellis.barefoot@gmail.com, but the URL is broken and not saved in the database. samaelbarefoot@gmail.com has no access token.
   - Verify completion email is sent
   - Edge case testing:
     - Test with large participant lists (100+ participants)
     - Test error handling with invalid inputs
     - Test access control (only active participants can submit)
   - Performance testing:
     - Monitor background job execution time
     - Check for any performance bottlenecks

8. Documentation:
   - Update technical documentation
   - Create user guides for survey publishing workflow
   - Document API endpoints and response formats

9. Debugging:
   - Debug why publishing survey didn't send email to participant.

### Fixed Bugs

1.  **Survey Submission 401 Error ("Invalid participant access"):**
    -   **Root Cause:** The API endpoint (`src/pages/api/surveys/[id]/responses.ts`) was failing to authenticate participants because it was using the `id` column (UUID) to look up participants based on the `participantId` (which was actually the `participant_identifier`).
    -   **Solution:** Modified the API endpoint to use the `participant_identifier` column for participant lookup.
2.  **Survey Submission 500 Error ("Could not find the 'responses' column..."):**
    -   **Root Cause:** The database schema was missing the `responses` column, which was intended to store the main survey answers.
    -   **Solution:** Modified the API to merge the general `responses` data and the `soundMappingResponses` data into a single JSON object, which is then saved into the existing `sound_mapping_responses` column.
3.  **Incorrect Participant ID:**
    -   **Root Cause:** The API was incorrectly using the `participantId` (the identifier string) instead of the `participant.id` (the actual UUID) when creating the database record.
    -   **Solution:** Corrected the API to use the `participant.id` (UUID) for the `participant_id` field.
