# Current Bugs
1. Survey Creation Bug. Fails to load sound profile data.
Console log below:
Failed to load resource: net::ERR_BLOCKED_BY_ADBLOCKER
Layout.astro:77 Sortable.js not loaded. Retrying in 100ms...
client:1429 [vite] connecting...
client:1552 [vite] connected.
Layout.astro:90 Sortable.js initialized successfully
CreateSurveyForm.astro:228 Form submission started
CreateSurveyForm.astro:246 Form values: 
Object
client_id
: 
"afee0d8e-9b2f-4208-a03e-f44825be6b6c"
description
: 
"SurveySurvey2"
sound_profile_id
: 
"56008b82-edfb-43e1-930b-096dd42c1538"
title
: 
"Survey2"
[[Prototype]]
: 
Object
:4322/api/sound-prof…930b-096dd42c1538:1 
 Failed to load resource: the server responded with a status of 404 (Not Found)
hook.js:608 Error fetching sound profile sounds: Error: Failed to fetch sound profile
    at HTMLFormElement.<anonymous> (CreateSurveyForm.astro:264:15)
hook.js:608 Survey creation failed: Error: Failed to load sound profile data
    at HTMLFormElement.<anonymous> (CreateSurveyForm.astro:275:13)
﻿

2. ✅ FIXED: Participant Deletion Bug
   - Individual delete action was failing with 404 (Not Found) error
   - "Delete All" button wasn't clickable
   - Root causes:
     - API endpoint was looking for participant ID in request headers instead of request body
     - Event handling issues with the "Delete All" button
   - Fixed by:
     - Updating the API endpoint to properly parse the request body
     - Adding multiple event listeners and proper styling to the "Delete All" button
