# Active Context

## Current Task

Implementing comprehensive participant and survey management features:
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

1. Database Schema Updates:
   - Add status column to participants table
   - Add sound_mapping_responses column to survey_responses table
   - Create migrations for schema changes

2. Participant Status Management:
   - Update participant creation endpoints to set initial status
   - Implement status update logic for publishing/completion

3. Survey Preview:
   - Create preview route and component
   - Implement preview mode logic

4. Survey Publishing:
   - Create publish endpoint
   - Implement URL generation
   - Set up email sending
   - Handle participant status updates

5. Response Saving:
   - Update response saving logic
   - Add sound mapping data handling
   - Implement participant status updates

6. Testing and Documentation:
   - Write tests for new functionality
   - Update documentation
   - Create user guides