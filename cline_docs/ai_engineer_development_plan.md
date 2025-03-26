# Architecture Plan: Enhanced Answer Saving in survey_matches

## Problem

The current approach to saving answers in the `survey_matches` table results in null values for the `matched_function` field. This is due to a mismatch between the data sent from the frontend and the data expected by the backend.

## Proposed Solution

Assign unique IDs to each question within the `functions` JSONB column in the `surveys` table. Update the frontend and backend to use these IDs for saving answers in the `survey_matches` table.

## Detailed Steps

### 1. Database Changes

*   Modify the `surveys` table to include a unique ID for each question within the `functions` JSONB column. This could be a simple numerical index or a UUID.
    *   Example:
        ```json
        {
          "functions": [
            { "id": "1", "text": "Option A" },
            { "id": "2", "text": "Option B" }
          ]
        }
        ```
*   Update the `survey_matches` table (if necessary) to include a `question_id` column (UUID).

### 2. Frontend Changes

*   Update the survey form (`src/pages/surveys/[id].astro`) to include the `question_id` as the value for each radio button.
*   Modify the form submission logic to send the `question_id` along with the selected answer.

### 3. Backend Changes

*   Update the API endpoint (`src/pages/api/surveys/[id]/responses.ts`) to:
    *   Extract the `question_id` and `answerValue` from the submitted data.
    *   Use the `question_id` to look up the corresponding question text in the `surveys` table (if needed).
    *   Save the `response_id`, `question_id`, and `answerValue` to the `survey_matches` table.

## Benefits

*   Provides a more reliable way to link answers to specific questions.
*   Ensures that the `matched_function` field in `survey_matches` contains the correct answer text.

## Considerations

*   This approach requires changes to both the frontend and backend code.
*   It may also require a database migration to update the `surveys` and `survey_matches` tables.