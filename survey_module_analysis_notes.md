# Survey Module Analysis Notes

## File Structure and Overview

Based on the file list, the survey module appears to be structured as follows:

- **Components:** `src/components/admin/`, `src/components/client/`, `src/components/SurveyLayout.astro`, etc. -  Astro components for UI elements related to survey creation, administration, and participation.
- **Pages:** `src/pages/admin/surveys/`, `src/pages/surveys/` - Astro pages for admin and client-facing survey views.
- **API Endpoints:** `src/pages/api/surveys/` - API endpoints built with Astro for server-side logic related to surveys.
- **Utils:** `src/utils/survey*.ts` - TypeScript utility functions for survey data handling, analytics, etc.
- **Types:** `src/types/database.ts` - TypeScript type definitions, likely including survey-related database schema.
- **Database Migrations:** `supabase/migrations/` - SQL migration files for survey-related database changes.

## Key Files Analysis

### `src/utils/surveyDataManager.ts`

- **Purpose:** Data access layer for survey operations (fetch, save, update, submit responses).
- **Key Functions:**
    - `getSurveyById`: Fetches survey data by ID with related data (sounds, client).
    - `saveSurveyData`: Saves/updates survey data via PUT request to API.
    - `updateSurveyActive`: Updates survey active status.
    - `publishSurvey`, `unpublishSurvey`: Convenience functions to set active status.
    - `submitSurveyResponses`: Submits participant responses to the API.
- **Data Handling:** Uses API endpoints for server-side interactions, handles data cleaning and validation, manages signed URLs for sound files.

### `src/pages/api/surveys/[id].ts`

- **Purpose:** API endpoint for retrieving and updating survey data for a specific survey ID.
- **Handlers:**
    - `PUT`: Updates survey data (admin-only, authorization checks, data validation, uses `update_survey_with_sounds` Supabase function for transactional update).
    - `GET`: Retrieves survey data with related entities (role-based authorization, efficient data fetching using `select` query).
- **Security:** Implements authorization checks for both GET and PUT requests.
- **Data Integrity:** Includes data validation and uses a Supabase function for transactional updates.

### `src/components/admin/CreateSurveyForm.astro`

- **Purpose:** Form for creating new surveys in the admin panel.
- **Functionality:**
    - Fetches clients and sound profiles for dropdowns.
    - Dynamically updates sound profiles based on selected client.
    - Submits survey data to `/api/surveys` endpoint on form submission.
    - Handles form submission, loading states, and error messages.

### `src/pages/surveys/[id].astro`

- **Purpose:** Survey page for participants to take surveys.
- **Functionality:**
    - Fetches survey data with related sounds and client info.
    - Displays survey video (if available).
    - Renders sound playback UI for each sound in the survey.
    - Implements basic client-side audio playback control.
    - Includes event listeners for survey navigation (though navigation logic is not fully implemented in this file).

## Overall Understanding

- **Module Goal:** To create and conduct sound-based surveys, collect participant responses, and provide results analysis (partially explored).
- **Architecture:** Frontend (Astro), Backend (Astro API + Supabase), Utilities (TypeScript).
- **Workflow:** Admin creates/manages surveys, participants take surveys, clients view results.
- **Key Technologies:** Astro, TypeScript, Supabase, Tailwind CSS.

## Next Steps

- Compare these notes with Cline docs and user notes for validation.
- Deep dive into specific areas based on comparison and further instructions.