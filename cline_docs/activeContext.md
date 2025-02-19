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

3. Survey Preview Bug
   - 404 error on survey preview
   - previewSurvey function undefined
   - VideoPlayer callback errors

### Ongoing Feature Work
1. Participant status management
2. Survey preview functionality
3. Survey publishing with unique URLs
4. Enhanced response saving with sound mapping data

## Recent Changes

- Implemented initial version of survey participant generation functionality:
  - Created database migrations for participants table
  - Implemented three API endpoints for participant creation:
    - Manual input (/api/surveys/[id]/participants/manual)
    - CSV upload (/api/surveys/[id]/participants/csv)
    - JSON upload (/api/surveys/[id]/participants/json)
  - Created ParticipantManager.astro component with:
    - Tab interface for three input methods
    - Form validation and error handling
    - Format requirements and examples for bulk uploads
  - Integrated ParticipantManager into Edit Survey page
  - Known issues: The implementation has functional issues that need to be debugged

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

## Next Steps

1. Fix Critical Bugs:
   - Implement proper validation in CreateSurveyForm.astro
   - Fix Sortable.js integration in ParticipantManager
   - Implement survey preview functionality
   - Add comprehensive error handling

2. Database Schema Updates:
   - Add status column to participants table
   - Add sound_mapping_responses column to survey_responses table
   - Create migrations for schema changes

3. Participant Status Management:
   - Update participant creation endpoints to set initial status
   - Implement status update logic for publishing/completion

4. Survey Preview:
   - Create preview route and component
   - Implement preview mode logic

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