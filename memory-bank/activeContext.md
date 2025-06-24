# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-06-24 16:25:41 - Initial update based on cline_docs/activeContext.md.

## Current Focus

Fixing critical bugs in the survey system, focusing on the participant submission workflow, while continuing participant and survey management features:

### Bug Fixes (High Priority)

1.  **Survey Participant Submission Workflow:**
    *   **Answer Saving:** Survey answers are saved in `survey_responses`, but each answer should also be saved as an individual record in the `survey_matches` table. The `matched_function` field in `survey_matches` is still null, indicating a frontend data issue. The proposed solution is to assign question IDs in the `surveys` table and send them with the responses.
    *   **Link/Token Invalidation:** After submission, the participant's unique link and access token should be invalidated to prevent re-submission or further access. This is now working correctly.
    *   **Status Update:** Participant status is now consistently updated to "completed" after successful submission.
    *   **Survey Response Completed Field:** The `completed` field in the `survey_responses` table is now being set to `true` after submission.
    *   **Thank You Screen:** The post-submission "thank you" screen incorrectly contains a link to the admin-only survey control area.

2.  **Survey Creation Bug:**
    *   400 (Bad Request) error during form submission
    *   Need to implement proper validation and error handling
    *   Update API endpoint validation

3.  **Participant Management Bug:**
    *   UI interaction issues (nothing selectable/viewable)
    *   Sortable.js integration problems
    *   Multiple Supabase client initialization warnings
    *   ✅ Fixed: Participant deletion functionality (both individual and bulk delete)

4.  **Survey Preview Bug:**
    *   ✅ Fixed: 500 error on survey preview API endpoint
    *   ✅ Fixed: 500 error on survey preview API endpoint
    *   ❌ Broken: "Play Sound" button in survey preview does not work
    *   ✅ Fixed: 431 error "Request Header Fields Too Large" when generating preview.
        *   Solution: Implemented lazy loading of sound URLs in survey preview.
            *   Modified preview API to initially exclude sound details.
            *   Adjusted frontend to handle delayed loading of sound URLs.
    *   ✅ Fixed: 500 error on "edit survey" page after preview API changes.
        *   Solution: Added conditional rendering in `src/pages/surveys/[id].astro` to handle potentially missing sound URLs.
    *   ✅ Fixed: All other UI issues in survey preview have been resolved:
        *   ✅ Fixed: Video now loads correctly using signed URLs
        *   ✅ Changed input fields to multiple choice selections using survey functions
        *   ✅ Replaced navigation buttons with a single submit button
        *   ✅ Implemented proper response submission and survey completion

5.  ✅ **Fixed: Participant Upload Bug:**
    *   Fixed manual, CSV, and JSON upload functionality in ParticipantManager.astro
    *   Added proper form submission handlers to prevent page refresh
    *   Implemented client-side validation and user feedback

### Ongoing Feature Work

1.  ✅ Implemented: Participant status management
2.  ✅ Implemented: Survey preview functionality
3.  ✅ Implemented: Survey publishing with unique URLs (REQUIRES TESTING)
4.  ✅ Implemented: Enhanced response saving with sound mapping data (REQUIRES TESTING)

## Recent Changes

-   Fixed survey preview UI issues completely:
    *   Updated the preview API to generate signed URLs for videos
    *   Modified the survey page to display videos correctly
    *   Changed input fields to multiple choice selections using survey functions
    *   Replaced next/previous navigation with a single submit button
    *   Implemented proper response submission with a new API endpoint
    *   Created thank-you page for after submission
    *   Added proper error handling and feedback to the user

-   Fixed survey preview API endpoint:
    *   Fixed database query issues by removing references to non-existent columns (url, duration)
    *   Added code to generate signed URLs for sound files after fetching from database
    *   Properly handled the functions data structure
    *   Added comprehensive error handling and logging

-   Implemented survey module enhancements and bug fixes:
    *   Created database migration for survey module updates:
        *   Added sound_mapping_responses column to survey_responses table
        *   Created background_jobs table for handling long-running tasks
        *   Added last_emailed_at column to participants table
        *   Added contact_email and published_at columns to surveys table
    *   Enhanced email templates and distribution:
        *   Created dedicated email template functions for survey invitations, reminders, and completion
        *   Improved email sending functionality with better error handling
        *   Added support for attachments and reply-to addresses
    *   Implemented background job handling for large participant lists:
        *   Created a background jobs utility for processing long-running tasks
        *   Added database support for tracking job progress
        *   Integrated with the publish API endpoint to handle large participant lists
    *   Enhanced data export functionality:
        *   Implemented comprehensive CSV export with more data
        *   Added support for JSON export
        *   Prepared for PDF export
        *   Added filtering and sorting options

-   Fixed participant deletion functionality:
    *   Fixed individual delete functionality by updating the delete.ts endpoint to properly parse the participant ID from the request body instead of looking for it in the request headers
    *   Updated the API endpoint to use the newer Astro API style with proper error handling
    *   Fixed "Delete All" button functionality by:
        *   Adding multiple event listeners to ensure the button is clickable
        *   Making the button explicitly visible and enabled with proper styling
        *   Ensuring event listeners are properly attached when switching tabs
        *   Making the handler function globally accessible
        *   Adding direct click handlers both in HTML and JavaScript

## Patterns Identified

1.  Admin user creation is handled through `src/pages/create-user.astro` and `src/components/UserCreationForm.astro`, but this is for user accounts (admin/client), not survey participants.
2.  Survey management components in `src/components/admin/` (e.g., `SurveyDetails.astro`, `SurveyFunctions.astro`, `SurveyActions.astro`, `ResultsSummary.astro`) focus on survey settings and results, not participant management.
3.  The participant management feature follows similar patterns to existing admin components:
    *   Uses Astro components for UI
    *   Implements admin-only API endpoints
    *   Follows existing styling patterns
    *   Integrates with the Edit Survey page layout
4.  New requirements follow established patterns:
    *   Database schema changes through migrations
    *   Email sending through existing functionality
    *   Status management through enum fields
    *   Secure URL generation for participants
5.  API endpoints should follow the newer Astro API style with proper error handling:
    *   Use `export const POST: APIRoute = async ({ params, request, locals }) => { ... }` pattern
    *   Parse request body with `await request.json()` or `await request.formData()`
    *   Use consistent error handling and response formatting

## Next Steps

1.  **Address Technical Debt and Improvements:** Refer to `memory-bank/technicalDebtAndImprovements.md` for detailed areas of improvement, refactoring, and technical debt identified during the codebase review. This includes:
    *   Fixing `survey_matches` table data inconsistency (populating `sound_id` and `correct_match`).
    *   Reviewing redundancy in `soundMappingResponses` in `survey_responses`.
    *   Standardizing error handling and logging.
    *   Ensuring `surveyAnalytics.ts` derived properties are robustly handled.
    *   Investigating and removing the admin link from `src/pages/surveys/thank-you.astro`.
    *   Reviewing SMTP configuration and email sending logic for production readiness.

2.  **Fix Remaining Critical Bugs (NEXT PRIORITY):**
    *   Survey Creation Bug (400 error).
    *   Participant Management Bug (Sortable.js).
    *   Survey Preview Bug ("Play Sound" button).

3.  **Testing:**
    *   Test the enhanced answer saving implementation (after `survey_matches` fix).
    *   Test survey publishing and response saving workflow.

4.  **Documentation:**
    *   Update technical documentation based on the implemented changes.
    *   Create user guides for survey publishing workflow.
    *   Document API endpoints and response formats.

### Completed/Verified Items in Submission Workflow:

*   ✅ Participant status updates to "completed".
*   ✅ Participant `access_token` is invalidated (set to null).
*   ✅ `completed` field in `survey_responses` table is set to `true`.

### Fixed Bugs

1.  **`Uncaught SyntaxError: Cannot use import statement outside a module`:**
    *   **Root Cause:** The `<script>` tag in `src/pages/admin/surveys/[id]/results.astro` was missing the `type="module"` attribute.
    *   **Solution:** Added the `type="module"` attribute to the `<script>` tag.
2.  **Error message in Analytics Dashboard:**
    *   **Root Cause:** Some responses were missing the `is_success` property, causing an error in the `calculateSuccessMetrics` function.
    *   **Solution:** Modified the `calculateSuccessMetrics` function to handle the case where `response.is_success` is `undefined`.
3.  **"__vite_ssr_import_2__.validateFormat is not a function":**
    *   **Root Cause:** The `validateExport` function in `DataExporter.astro` was calling a non-existent API endpoint `/api/surveys/${surveyId}/validate-export`.
    *   **Solution:** This issue requires further investigation to determine the correct API endpoint for validating exports. The current implementation is calling a non-existent endpoint.