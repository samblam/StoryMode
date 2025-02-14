1.Can't create a new survey related logs
Failed to load resource: net::ERR_BLOCKED_BY_ADBLOCKER
hook.js:608 Sortable.js not loaded. Retrying in 100ms...
client:1429 [vite] connecting...
client:1552 [vite] connected.
Layout.astro:90 Sortable.js initialized successfully
CreateSurveyForm.astro:191 Form submission started
CreateSurveyForm.astro:232 Submitting survey data: 
Object
:4322/api/surveys:1 
 Failed to load resource: the server responded with a status of 400 (Bad Request)
hook.js:608 API Error: 
Object
hook.js:608 Survey creation failed: Error: Failed to create survey
    at HTMLFormElement.<anonymous> (CreateSurveyForm.astro:243:13)
﻿

2.Participant management card, nothing is selectable or viewable
Console logs on page:
cdn.vercel-insights.com/v1/script.debug.js:1 
        
        
       Failed to load resource: net::ERR_BLOCKED_BY_ADBLOCKER
edit:3970 Uncaught SyntaxError: Cannot use import statement outside a module
hook.js:608 Sortable.js not loaded. Retrying in 100ms...
overrideMethod @ hook.js:608
client:1429 [vite] connecting...
SurveyDetails.astro:152 JSON string: [{"id":"743a44bc-55eb-407e-a86b-33caaf92d5d4","created_at":"2025-01-10T18:03:27.324632+00:00","title":"dfdfdfddf","description":"dfdfdfdfdfdfd","slug":"dfdfdfddf","client_id":"afee0d8e-9b2f-4208-a03e-f44825be6b6c","is_template":false},{"id":"56008b82-edfb-43e1-930b-096dd42c1538","created_at":"2025-01-04T05:27:37.921009+00:00","title":"Samael Test","description":"Testing for Samael","slug":"samael-test","client_id":"afee0d8e-9b2f-4208-a03e-f44825be6b6c","is_template":false},{"id":"1ac1231a-3498-4c7b-ac7b-46bdd56a1f52","created_at":"2025-01-09T00:45:38.247317+00:00","title":"Test 2","description":"Test 2 fa))))))","slug":"test-2","client_id":"afee0d8e-9b2f-4208-a03e-f44825be6b6c","is_template":false}]
client:1552 [vite] connected.
supabase.ts:11 Initializing regular Supabase client
supabase.ts:20 Supabase URL: https://iubzudsaueifxrwrqfjw.supabase.co
supabase.ts:21 Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Ynp1ZHNhdWVpZnhyd3JxZmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3Njc2NzQsImV4cCI6MjA0OTM0MzY3NH0.SNXX_0_NMSJqOKSMMxM5WP6sfR3zokgCgdJkH4s-xfg
hook.js:608 Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.
overrideMethod @ hook.js:608
supabase.ts:59 Regular Supabase client initialized successfully
hook.js:608 Sortable.js not loaded
overrideMethod @ hook.js:608
Layout.astro:90 Sortable.js initialized successfully
supabase.ts:70 Initializing admin Supabase client
supabase.ts:79 Supabase URL: https://iubzudsaueifxrwrqfjw.supabase.co
supabase.ts:80 Supabase Service Role Key: undefined
hook.js:608 SUPABASE_SERVICE_ROLE_KEY not found. Falling back to regular client.
overrideMethod @ hook.js:608
supabase.ts:11 Initializing regular Supabase client
supabase.ts:13 Regular Supabase client instance already exists, returning cached instance
storageUtils.ts:35 Creating signed URL for: Object
supabase.ts:70 Initializing admin Supabase client
supabase.ts:79 Supabase URL: https://iubzudsaueifxrwrqfjw.supabase.co
supabase.ts:80 Supabase Service Role Key: undefined
hook.js:608 SUPABASE_SERVICE_ROLE_KEY not found. Falling back to regular client.
overrideMethod @ hook.js:608
supabase.ts:11 Initializing regular Supabase client
supabase.ts:13 Regular Supabase client instance already exists, returning cached instance
storageUtils.ts:35 Creating signed URL for: Object

3. Error when attempting to preview survey
xZmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3Njc2NzQsImV4cCI6MjA0OTM0MzY3NH0.SNXX_0_NMSJqOKSMMxM5WP6sfR3zokgCgdJkH4s-xfg
supabase.ts:30 Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.
overrideMethod @ hook.js:608
_GoTrueClient @ @supabase_supabase-js.js?v=96f802cc:4864
SupabaseAuthClient @ @supabase_supabase-js.js?v=96f802cc:6655
_initSupabaseAuthClient @ @supabase_supabase-js.js?v=96f802cc:6852
SupabaseClient @ @supabase_supabase-js.js?v=96f802cc:6724
createClient @ @supabase_supabase-js.js?v=96f802cc:6892
getSupabaseClient @ supabase.ts:30
(anonymous) @ supabase.ts:150
supabase.ts:59 Regular Supabase client initialized successfully
SoundManager.astro:283 Sortable.js not loaded
overrideMethod @ hook.js:608
initializeSortable @ SoundManager.astro:283
(anonymous) @ SoundManager.astro:302
Layout.astro:90 Sortable.js initialized successfully
VideoPlayer.astro:165 Uncaught (in promise) Error: The provided callback is no longer runnable.
    at <instance_members_initializer> (VideoPlayer.astro:165:55)
    at new VideoPlayerManager (VideoPlayer.astro:167:9)
    at VideoPlayer.astro:269:21
    at Array.forEach (<anonymous>)
    at IntersectionObserver.rootMargin (VideoPlayer.astro:267:21)
<instance_members_initializer> @ VideoPlayer.astro:165
VideoPlayerManager @ VideoPlayer.astro:167
(anonymous) @ VideoPlayer.astro:269
IntersectionObserver.rootMargin @ VideoPlayer.astro:267
edit:3748 Uncaught ReferenceError: previewSurvey is not defined
    at HTMLButtonElement.onclick (edit:3748:4183)
onclick @ edit:3748
SurveyPreview.astro:24 
        
        
       GET http://localhost:4322/api/surveys/ca24cb8d-fea0-473f-97b9-de07ff3bf123/preview 404 (Not Found)
previewSurvey @ SurveyPreview.astro:24
(anonymous) @ SurveyPreview.astro:48
SurveyPreview.astro:35 Error previewing survey: Error: Failed to generate preview
    at previewSurvey (SurveyPreview.astro:27:15)
overrideMethod @ hook.js:608
previewSurvey @ SurveyPreview.astro:35
await in previewSurvey
(anonymous) @ SurveyPreview.astro:48
edit:3748 Uncaught ReferenceError: previewSurvey is not defined
    at HTMLButtonElement.onclick (edit:3748:4183)
onclick @ edit:3748
SurveyPreview.astro:24 
        
        
       GET http://localhost:4322/api/surveys/ca24cb8d-fea0-473f-97b9-de07ff3bf123/preview 404 (Not Found)
previewSurvey @ SurveyPreview.astro:24
(anonymous) @ SurveyPreview.astro:48
SurveyPreview.astro:35 Error previewing survey: Error: Failed to generate preview
    at previewSurvey (SurveyPreview.astro:27:15)
overrideMethod @ hook.js:608
previewSurvey @ SurveyPreview.astro:35
await in previewSurvey
(anonymous) @ SurveyPreview.astro:48