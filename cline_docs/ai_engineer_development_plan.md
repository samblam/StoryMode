## Survey Publishing Development Plan

**Objective:** Implement the survey publishing feature, allowing administrators to publish surveys and generate unique URLs for participants.

**Context:**

-   The project uses Astro for the frontend and Node.js with TypeScript for the backend.
-   Database interactions are handled using Supabase.
-   The participant management system is already implemented, including status updates.
-   Email sending functionality is available.

**Next Steps:**

1.  **Implement the publish endpoint:**
    -   Create a new API endpoint (`/api/surveys/[id]/publish`) to handle the publishing logic.
    -   The endpoint should:
        -   Update the `published_at` column in the `surveys` table with the current timestamp.
        -   Generate unique URLs for each participant in the survey.
        -   Update the participant statuses to "active" upon publishing.
        -   Use background jobs for handling large participant lists.
    -   Reuse existing code for participant status updates and background job handling.
2.  **Implement URL generation:**
    -   Generate unique, secure URLs for each participant.
    -   Store the URLs in the `participants` table.
    -   Consider using a combination of the survey ID and participant ID to generate the URLs.
3.  **Set up email sending:**
    -   Send email invitations to all participants with their unique survey URLs.
    -   Reuse existing email sending functionality and templates.
4.  **Handle participant status updates:**
    -   Update participant statuses to "active" upon publishing.
    - Ensure that only participants with "active" status can access the survey.

5. **Implement Response Saving:**
    -   Create a new API endpoint (`/api/surveys/[id]/responses`) to handle the submission of survey responses.
    -   The endpoint should:
        -   Receive the survey responses from the participant.
        -   Validate the responses to ensure that they are in the correct format.
        -   Save the responses to the `survey_responses` table, including the participant ID, survey ID, and the response data.
        -   Consider adding a timestamp to the responses.
    -   Update the participant's status to "completed" after submitting the survey.

**Testing:**

-   Manually test the survey publishing feature to ensure that:
    -   Surveys are published successfully.
    -   Unique URLs are generated for each participant.
    -   Email invitations are sent to all participants with their unique URLs.
    -   Participant statuses are updated to "active" upon publishing.
    -   Only participants with "active" status can access the survey.
    -   Survey responses are saved correctly to the `survey_responses` table, including the participant ID, survey ID, and response data.
    -   The participant's status is updated to "completed" after submitting the survey.

**Prompt for AI Engineer:**

"Implement the survey publishing feature as described in this development plan, including the functionality for receiving and saving survey responses to the `survey_responses` table. Reuse existing code for participant status updates, background job handling, and email sending. After implementing the feature, prompt me to manually test the feature to ensure that surveys are published successfully, unique URLs are generated for each participant, email invitations are sent to all participants with their unique URLs, participant statuses are updated to 'active' upon publishing, only participants with 'active' status can access the survey, survey responses are saved correctly to the `survey_responses` table, including the participant ID, survey ID, and response data, and the participant's status is updated to 'completed' after submitting the survey."