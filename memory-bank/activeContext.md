# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-06-24 16:25:41 - Initial update based on cline_docs/activeContext.md.
2025-06-24 18:10:24 - Failed to resolve persistent Vercel build errors.
2025-06-24 18:19:35 - Successfully resolved Vercel build errors by refactoring DataExporter component.

## Current Focus

Attempting to deploy the application to Vercel, but encountering persistent build errors.

### Resolved Build Errors (Previously Critical)

1.  **`[astro:build] The argument 'path' must be a string, Uint8Array, or URL without null bytes. Received '/vercel/path0/\x00astro-entry:/vercel/path0/src/components/tsconfig.json'`**
    *   **Status**: ✅ RESOLVED. This error was caused by the combination of `client:load` directive and `define:vars` script in the DataExporter component.
    *   **Root Cause**: The `define:vars` script in DataExporter.astro was causing Vite to incorrectly resolve TypeScript configuration paths during the build process, leading to corrupted path strings with null bytes.
    *   **Solution Applied**:
        *   Removed `client:load` directive from DataExporter usage in results.astro
        *   Refactored DataExporter.astro to use `is:inline` script instead of `define:vars`
        *   Replaced server-side variable injection with data attributes for client-side access
        *   Converted all client-side JavaScript to vanilla JS with proper null checks
        *   Removed the temporary `src/components/tsconfig.json` that was interfering with type resolution
    *   **Build Status**: ✅ Build now completes successfully on both local and Vercel environments

### Resolved Build Errors (Previously Encountered)

1.  **Deprecated `@astrojs/vercel/serverless` import**: Fixed in `astro.config.mjs`.
2.  **Route Collisions (`/reset-password`, `/sounds`)**: Fixed by removing redundant `.astro` files (`src/pages/reset-password.astro`, `src/pages/sounds/index.astro`).
3.  **`"supabaseAdmin" is not exported` errors**: Systematically fixed in multiple `.ts` and `.astro` files by replacing direct `supabaseAdmin` imports with `getClient({ requiresAdmin: true })` and cleaning up `src/lib/supabase.ts`. Affected files included:
    *   `src/pages/api/auth/admin-reset-password.ts`
    *   `src/pages/api/auth/create-user.ts`
    *   `src/pages/api/auth/logout.ts`
    *   `src/pages/api/auth/reset-password.ts`
    *   `src/pages/api/auth/verify-session.ts`
    *   `src/pages/api/auth/verify-reset-code.ts`
    *   `src/pages/api/auth/test-token.ts`
    *   `src/pages/api/auth/send-reset-code.ts`
    *   `src/pages/api/auth/login.ts`
    *   `src/components/ProfileForm.astro`
    *   `src/pages/surveys/[id].astro`
    *   `src/pages/admin/surveys/[id]/results.astro`

## Recent Changes (Functional Fixes)

*   **`survey_matches` Data Inconsistency**:
    *   **Fixed**: Enriched the data payload from `src/pages/surveys/matching.astro` to include `intendedSoundId` and `matchedFunctionDescription`.
    *   **Fixed**: Updated the API endpoint at `src/pages/api/surveys/[id]/responses.ts` to correctly process this new payload, calculate `correct_match`, and populate the `survey_matches` table with complete and accurate data.
*   **Broken "Play Sound" Button in Preview**:
    *   **Fixed**: Modified `src/pages/surveys/[id].astro` to ensure that signed URLs for sounds are generated in preview mode, enabling the "Play Sound" buttons.
*   **TypeScript Errors in `matching.astro`**:
    *   **Fixed**: Refactored the `<script>` tag in `src/pages/surveys/matching.astro` to use standard JavaScript, resolving all client-side and server-side TypeScript errors.
*   **Inappropriate Header on "Thank You" Page**:
    *   **Fixed**: Added a `hideHeader` prop to `src/layouts/Layout.astro`.
    *   **Fixed**: Implemented the `hideHeader={true}` prop on the `src/pages/surveys/thank-you.astro` page to provide a clean, final screen for survey participants.

*   **Silent Internal Service Error on Sound Upload**:
    *   **Fixed**: Modified `src/lib/supabase.ts` to throw an explicit error when `SUPABASE_SERVICE_ROLE_KEY` is missing, instead of silently falling back to a non-admin client.
    *   **Impact**: This will now provide a clear error message if the service role key is not configured, preventing silent failures during sound uploads due to insufficient permissions.

*   **Debugging Silent Internal Service Error on Sound Upload**:
    *   **Action**: Added comprehensive `console.log` statements to `src/pages/api/sounds/upload.ts` and `src/utils/storageUtils.ts` to trace execution flow and pinpoint the exact point of failure.
    *   **Next Step**: Awaiting server logs from user after re-attempting sound upload.

*   **Internal Server Error on "Upload New Sound" Page Access**:
    *   **Fixed**: Modified `src/utils/profileUtils.ts` to remove the unnecessary `token` parameter from `getSoundProfiles` and ensure it uses the admin Supabase client (`getClient({ requiresAdmin: true })`).
    *   **Root Cause**: The `getSoundProfiles` function was being called without arguments from `src/components/SoundUploader.astro`, leading to an argument mismatch and a server-side crash during page rendering. Additionally, using the regular Supabase client for an admin function could lead to RLS issues.
    *   **Impact**: The "Upload New Sound" page should now load correctly without an internal server error.

*   **Import Error in `src/utils/profileUtils.ts`**:
    *   **Fixed**: Modified `src/utils/profileUtils.ts` to import `getClient` from `../lib/supabase` instead of `supabase`.
    *   **Root Cause**: The `getClient` function was being called without being imported, leading to a runtime error.
    *   **Impact**: `getSoundProfiles` can now correctly initialize the Supabase admin client.

*   **Unresolved: `profiles.map is not a function` on "Upload New Sound" page**:
    *   **Problem**: The "Upload New Sound" page (`src/pages/sounds/upload.astro`) still displays an "Internal server error" upon access.
    *   **Analysis**: The `getSoundProfiles()` function in `src/utils/profileUtils.ts` returns a `ProfileResponse` object (`{ data: [], error: null }`), not directly an array. The `src/components/SoundUploader.astro` component attempts to call `.map()` directly on this object (`profiles.map(...)`), which causes a `TypeError` during server-side rendering.
    *   **Previous Attempts**:
        1.  Modified `src/lib/supabase.ts` to throw explicit error for missing `SUPABASE_SERVICE_ROLE_KEY`. (Resolved a potential silent error, but not the current issue).
        2.  Added extensive `console.log` statements to `src/pages/api/sounds/upload.ts` and `src/utils/storageUtils.ts`. (Logs confirmed `getSoundProfiles` returns an object, but did not directly show the `.map` error).
        3.  Modified `src/utils/profileUtils.ts` to remove `token` parameter and use `getClient({ requiresAdmin: true })`. (Resolved argument mismatch and ensured admin client usage, but did not fix the `.map` issue).
        4.  Fixed import of `getClient` in `src/utils/profileUtils.ts`. (Resolved import error, but not the `.map` issue).
    *   **Escalation**: This issue requires further investigation by a senior developer. The current analysis points to the `.map` call on an object instead of an array, but the exact cause of the server crash without a clear log of this specific error needs deeper debugging.

## Next Steps (For the next developer)

✅ **Primary Build Issue Resolved**: The critical Vercel build error has been successfully fixed. The application now builds successfully.

### New Critical Issues: Survey Playback and Submission Failures

**Problem**: Test survey participants are encountering two main issues:
1.  **Sounds not playable**: Audio files are not loading or playing during the survey.
2.  **Redirect to login on submit**: When participants click the submit button, they are redirected to the login screen, and no responses are submitted. Consequently, no "thank you" email is sent.

**Analysis & Root Cause**:

*   **Redirect to Login on Submit**:
    *   **Root Cause**: The `src/middleware.ts` is designed to authenticate participants via a `participant-token` cookie. However, the client-side script in `src/pages/surveys/[id].astro` is passing the `participant_id` and `token` in the **request body** of the `POST` request to `/api/surveys/[id]/responses`, not as a cookie. Since the middleware does not inspect the request body for authentication, it considers the request unauthenticated and redirects to the login page.
    *   **Impact**: This prevents the survey responses from ever reaching the `src/pages/api/surveys/[id]/responses.ts` endpoint for processing and saving.

*   **Sounds not playable**:
    *   **Root Cause**: The "Play Sound" button is disabled if `surveySound.sounds?.url` is missing. This `url` is generated by `getSignedUrl` in `src/utils/storageUtils.ts`. This indicates that `getSignedUrl` is failing to generate valid, accessible URLs for the audio files.
    *   **Hypothesis**: The `storage_path` values stored in the Supabase `sounds` table might be incorrect or malformed, leading to `getSignedUrl` failing to produce a valid URL, or the generated URLs are not publicly accessible.
    *   **Possible Causes**: Incorrect `storage_path` values in the database, issues with Supabase Storage access permissions from the Vercel environment, or incorrect Supabase environment variables (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`) on Vercel.

*   **No Thank You Email Sent**: This is a direct consequence of the survey submission failing due to the authentication issue. The email sending logic is triggered only after a successful response save.

**Current Priority Tasks (Analysis Only)**:
1.  **Analyze Participant Authentication for API Submission**: Confirm the exact values of `participant_id` and `token` being sent from `src/pages/surveys/[id].astro` to `/api/surveys/[id]/responses` and how they are being processed by the middleware.
2.  **Analyze Sound Playback (Verify `storage_path`)**: Inspect the `storage_path` values for sounds associated with the survey directly from the Supabase database or through Vercel logs that show the `survey.survey_sounds` object.
3.  **End-to-End Testing**: After implementing fixes, thoroughly test the entire survey workflow (sound playback, submission, and email sending).
4.  **Continue with remaining issues**: Proceed with fixing other known bugs and implementing ongoing feature work as outlined in `memory-bank/progress.md` and `memory-bank/technicalDebtAndImprovements.md`.
5.  **Monitor Build Stability**: Keep an eye on future builds to ensure the fix remains stable.

**Technical Debt Addressed**:
- ✅ Resolved problematic `define:vars` usage in Astro components
- ✅ Improved client-side JavaScript patterns for better build compatibility
- ✅ Cleaned up TypeScript configuration conflicts

## Failed Attempts to Resolve Sound Playback Issues

**Date:** 2025-06-28

**Problem:** Sound playback continues to fail in surveys. The following attempts to resolve the issue were unsuccessful:

1.  **Corrected `audioManager` import path:**
    *   **Action:** Changed the import path in `src/pages/surveys/[id].astro` from `../../utils/audioManager.js` to `../../utils/audioManager.ts`.
    *   **Result:** This resolved the initial 404 error for the `audioManager` module, but introduced a new error: `audioManager.play is not a function`.

2.  **Refactored to client-side import:**
    *   **Action:** Moved the `audioManager` import from the Astro frontmatter to a client-side `<script>` tag in `src/pages/surveys/[id].astro` to prevent method stripping during server-side rendering.
    *   **Result:** This led to 404 errors for both `audioManager.ts` and `clientUtils.ts`, indicating that the relative paths were not resolving correctly in the browser.

3.  **Implemented `import.meta.glob`:**
    *   **Action:** Used `import.meta.glob` in the client-side script of `src/pages/surveys/[id].astro` to bundle the `audioManager` and `clientUtils` modules.
    *   **Result:** This introduced a new set of errors related to TypeScript type assertions (`as any`) being used in a JavaScript context.

4.  **Removed TypeScript type assertions:**
    *   **Action:** Removed the `as any` type assertions from the `import.meta.glob` implementation.
    *   **Result:** The application still fails to play sounds, and the user has reported a regression in functionality.

**Conclusion:** The root cause of the sound playback issue remains unresolved. The problem likely lies in how Astro handles client-side module imports and bundling. Future attempts should focus on finding a reliable method for importing and using the `audioManager` and `clientUtils` modules in the client-side script of `src/pages/surveys/[id].astro`.

## Recent Debug Session - 2025-06-28 17:17

**Problem Analysis Completed:**
1. **Sound Playback Issue**: Root cause identified - the client-side script was trying to import `logClientEvent` from `clientUtils.ts`, but this function doesn't exist in that module.
2. **Survey Submission Issue**: Root cause identified - API endpoint was querying participants table using `participant_identifier` field, but client was sending `participantId` which should match the `id` field.

**Fixes Applied:**
1. **Fixed Sound Playback** in `src/pages/surveys/[id].astro`:
   - Removed non-existent `logClientEvent` import from `clientUtils`
   - Simplified import to only load `audioManager` module
   - Added inline `logClientEvent` function for debugging
   - This should resolve the "audioManager.play is not a function" error

2. **Fixed Survey Submission** in `src/pages/api/surveys/[id]/responses.ts`:
   - Changed database query from `.eq('participant_identifier', participantId)` to `.eq('id', participantId)`
   - This should resolve the authentication failure causing redirects to login

**Status**: Fixes implemented, npm dependencies being reinstalled due to rollup module issue. Testing pending.

## Latest Debug Session - 2025-06-28 17:50

**Problem**: Sound playback issue persisted with new error: `Uncaught TypeError: (intermediate value).glob is not a function`

**Root Cause Identified**: The `import.meta.glob` approach used in the client-side script of `src/pages/surveys/[id].astro` was causing the error because `import.meta.glob` is a Vite build-time feature that's not available in browser runtime.

**Fix Applied**:
1. **Removed `import.meta.glob` usage**: Eliminated the problematic import pattern that was causing the TypeError
2. **Implemented `SimpleAudioManager` class**: Created a lightweight inline audio manager that works directly in the browser without external imports
3. **Uses native HTML5 Audio API**: More reliable approach using `new Audio()` instead of trying to import external modules
4. **Proper URL fetching**: Calls `/api/sounds/refresh-url` to get fresh signed URLs for audio files
5. **Enhanced error handling**: Shows loading states, error messages, and proper button state management
6. **Toggle functionality**: Clicking the same sound toggles between play and pause states

**Technical Details**:
- Replaced complex module importing with simple inline class
- Uses native browser APIs (Audio, fetch) instead of external dependencies
- Maintains all original functionality (play/pause, button states, error handling)
- Should resolve the `.glob is not a function` error completely

**Status**: Critical sound playback fix implemented. Ready for testing.

## Survey Submission Authentication Fix - 2025-06-28 17:58

**Problem**: Participants unable to submit surveys, receiving 401 "Invalid participant access" error despite having valid participant tokens.

**Root Cause Identified**: Authentication flow mismatch between middleware and API endpoint:
1. **Survey page**: Correctly sets `participant-token` cookie for middleware authentication
2. **Middleware**: Properly validates participant token and sets `locals.user` and `locals.participantId`
3. **API endpoint**: Was ignoring middleware authentication and trying to re-authenticate using request body parameters
4. **Client script**: Was sending participant credentials in request body instead of relying on cookie authentication

**Fix Applied**:
1. **Updated API endpoint** (`src/pages/api/surveys/[id]/responses.ts`):
   - Removed duplicate authentication logic that was checking request body parameters
   - Now uses middleware authentication via `locals.user` and `locals.participantId`
   - Simplified authentication flow to rely on middleware's participant validation
   - Maintains all security checks (survey ID match, participant status, etc.)

2. **Updated client script** (`src/pages/surveys/[id].astro`):
   - Removed participant credentials from request body
   - Authentication now handled entirely via `participant-token` cookie
   - Simplified request payload to only include response data

**Technical Details**:
- Middleware sets `participant-token` cookie when survey page loads with valid URL parameters
- Cookie is automatically sent with API requests via `credentials: 'include'`
- API endpoint now trusts middleware authentication instead of duplicating validation
- Maintains all existing security and data validation

**Status**: Survey submission authentication fix implemented. Ready for testing.

## Sound Upload Page Fix - 2025-07-07 10:57

**Problem**: The "Upload New Sound" page (`src/pages/sounds/upload.astro`) was showing an internal server error due to a `profiles.map is not a function` error.

**Root Cause Identified**: The [`getSoundProfiles()`](src/utils/profileUtils.ts:14) function returns a `ProfileResponse` object with structure `{ data: [], error: null }`, but the [`SoundUploader.astro`](src/components/SoundUploader.astro:20) component was trying to call `.map()` directly on the `profiles` object instead of `profiles.data`.

**Fix Applied**:
1. **Updated SoundUploader.astro component**:
   - Fixed the data structure handling to properly access `profileResponse.data` instead of calling `.map()` on the response object
   - Added comprehensive logging to track component initialization and profile loading
   - Added proper TypeScript typing for `profiles` and `profileError` variables
   - Added error handling UI to display profile loading errors to users
   - Added conditional rendering based on profile availability

2. **Enhanced profileUtils.ts logging**:
   - Added detailed logging throughout the `getSoundProfiles()` function
   - Logs client initialization, query building, execution, and results
   - Provides detailed error information including error codes and hints

**Technical Details**:
- The component now properly destructures the `ProfileResponse` object
- Error states are handled gracefully with user-friendly messages
- Form elements are disabled when profiles can't be loaded
- Comprehensive logging added at all levels (component, utility, API, storage)

**Status**: Sound upload page fix implemented with comprehensive debugging. Ready for testing.

## New Bug: Invalid UUID on Survey Edit Page - 2025-07-07 11:35:53

**Problem**: After creating a survey, attempting to open its "edit" page results in an "invalid input syntax for type uuid" error, with the provided value being a JWT token.

**Analysis & Root Cause (Assumption)**:
1.  The URL for the edit page (`/admin/surveys/[id]/edit.astro`) correctly receives a UUID as `Astro.params.id`.
2.  The `SurveyList.astro` component correctly fetches survey IDs as UUIDs from the database.
3.  The `CreateSurveyForm.astro` component does not explicitly set the survey ID; it relies on Supabase to generate a UUID during insertion.
4.  The error occurs within `src/pages/admin/surveys/[id]/edit.astro` when calling `getSoundProfiles(token, survey.client_id)`.
5.  The `getSoundProfiles` function in `src/utils/profileUtils.ts` expects an optional `clientId` as its *only* argument.
6.  **Assumption**: The JWT `token` (from `Astro.cookies.get('sb-token')?.value`) is being incorrectly passed as the `clientId` to `getSoundProfiles`, leading to the Supabase query attempting to filter a UUID column (`client_id`) with a JWT string, thus causing the "invalid input syntax for type uuid" error.

**Fix Applied**:
-   Modified `src/pages/admin/surveys/[id]/edit.astro` to call `getSoundProfiles` with only `survey.client_id`, removing the `token` argument. This prevents the JWT from being incorrectly passed as a UUID to the Supabase query.

**Current Status**: Fix applied. Ready for testing.

## Feature Implemented: Survey Function Meaning - 2025-07-07 12:34:00

**Problem**: The user requested a text box to define the "meaning" of survey functions, applicable to existing surveys.

**Solution Implemented**:
1.  **Updated `FunctionObject` interface**: Modified `src/components/admin/SurveyFunctions.astro` and `src/pages/surveys/[id].astro` to include a `meaning: string;` property in the `FunctionObject` interface.
2.  **Admin Interface Modification**: Added a `textarea` field for "Meaning" in `src/components/admin/SurveyFunctions.astro` to allow administrators to input the description for each function.
3.  **Survey Display Update**: Modified `src/pages/surveys/[id].astro` to display the `meaning` text below the function name for survey participants.
4.  **Data Handling**: Ensured that the `meaning` field is correctly handled when fetching and updating survey functions in `src/components/admin/SurveyFunctions.astro` and when validating functions in `src/pages/surveys/[id].astro`.

**Impact**: Administrators can now provide detailed explanations for each survey function, improving clarity for participants. This change is backward-compatible with existing surveys, which will simply have empty "meaning" fields until updated.