# Active Context

## Current Tasks

### 1. Survey Edit Page Error Investigation
- Status: Active investigation
- Issues:
  - PUT http://localhost:4322/api/surveys/[id] 404 (Not Found)
  - Sortable.js not loaded
  - Multiple GoTrueClient instances detected
  - SUPABASE_SERVICE_ROLE_KEY not found (known issue, not blocking)
- Implementation plan:
  1. Implement PUT endpoint in src/pages/api/surveys/[id].ts
  2. Fix Sortable.js integration in Layout.astro
  3. Consolidate Supabase client instances
  4. Add comprehensive error handling
- Required changes:
  - Add PUT endpoint implementation
  - Add Sortable.js script to Layout.astro
  - Fix Supabase client initialization
  - Add proper error handling

### 2. Sound Mapping Button Issues Debug
- Status: Active investigation
- Issues:
  - SUPABASE_SERVICE_ROLE_KEY not found
  - window.Sortable is not a constructor
  - Multiple GoTrueClient instances detected
- Implementation plan:
  1. Fix Sortable.js integration in Layout.astro
  2. Update Supabase service role key configuration
  3. Consolidate Supabase client instances
  4. Implement proper sound mapping functionality
  5. Add API endpoint for mappings
  6. Add comprehensive error handling
- Required changes:
  - Add Sortable.js script to Layout.astro
  - Update environment variables
  - Fix Supabase client initialization
  - Implement sound mapping API endpoint
  - Add proper error handling

### 3. Logout Functionality Debug
- Status: Active investigation
- Issues:
  - Illegal return statement in Layout.astro
  - 500 Internal Server Error on logout endpoint
  - Multiple failed logout attempts
  - Poor error handling
- Implementation plan:
  1. Fix Layout.astro script syntax
  2. Implement proper request debouncing
  3. Add comprehensive error handling
  4. Update logout API endpoint
  5. Add proper cookie cleanup
  6. Implement loading states
  7. Add user feedback
- Required changes:
  - Update Layout.astro with new logout implementation
  - Create/update logout API endpoint
  - Add proper cookie cleanup
  - Implement loading states
  - Add user feedback mechanisms

### 4. SaveControls Authentication Debug
- Status: Active investigation
- Issue: Authentication token not found in SaveControls.astro
- Symptoms:
  - Save changes failing with "No authentication token found"
  - Publish/unpublish failing with same error
- Current analysis:
  - Token extraction from cookies failing
  - No error handling for malformed cookies
  - No token validation before use
- Implementation plan:
  1. Move token extraction to server-side
  2. Add proper error handling
  3. Implement token validation
  4. Add redirect to login if needed
  5. Update middleware for consistent token handling
  6. Modify API routes for proper token validation

### 5. Audio Loading Optimization
- Status: Initial implementation complete, pending verification
- Implemented features:
  - Loading state management with progress tracking
  - Visual loading indicators and progress bars
  - Enhanced error handling and retry logic
  - Button state synchronization
  - Memory management improvements
- Implementation details:
  1. AudioManager enhancements:
     - Added loading state tracking
     - Implemented progress monitoring
     - Added error state handling
     - Improved cleanup routines
  2. UI Components:
     - Created LoadingIndicator component
     - Enhanced SoundList component
     - Added button state management
     - Improved error visualization
- Next steps:
  1. Performance verification:
     - Measure loading times
     - Monitor memory usage
     - Test browser compatibility
     - Verify mobile performance
  2. User experience testing:
     - Verify loading indicators
     - Test error handling
     - Check progress accuracy
     - Validate cleanup routines

### 6. Video Player Signed URL Issue
- Status: Ongoing investigation
- Recent changes:
  - Removed storageUtils.ts dependency
  - Implemented direct Supabase storage access in VideoPlayer
  - Fixed path handling and normalization
  - Added error handling and logging
  - Fixed TypeScript errors
- Current state:
  - Still getting "Object not found" errors
  - Path handling improvements did not resolve the issue
  - Direct storage access still fails
  - Previous fixes attempted:
    1. File existence verification (failed)
    2. Path normalization (failed)
    3. Direct storage access (failed)

## Investigation Areas
1. Survey Edit Page:
   - PUT endpoint implementation
   - Sortable.js integration
   - Client instance management
   - Error handling improvements

2. Sound Mapping Issues:
   - Sortable.js integration
   - Supabase service role configuration
   - Client instance management
   - API endpoint implementation
   - Error handling improvements

3. Logout Functionality:
   - Layout.astro script implementation
   - API endpoint error handling
   - Cookie cleanup process
   - Request debouncing
   - Loading state management
   - User feedback mechanisms

4. SaveControls Authentication:
   - Server-side vs client-side token handling
   - Cookie extraction reliability
   - Token validation process
   - Error handling improvements
   - Redirect flow for missing tokens

5. Audio Performance Analysis:
   - Loading time measurements
   - Memory usage patterns
   - Browser compatibility issues
   - Mobile device performance
   - Error recovery effectiveness

6. Authentication Analysis:
   - Test implementation uses regular client successfully
   - VideoPlayer using client-side initialization
   - Need to verify authentication flow and permissions
   - Possible service role key requirement

7. Storage Configuration:
   - Verify bucket policies allow client access
   - Check if service role key is required
   - Compare successful vs failing requests
   - Review storage initialization timing

8. Path Handling:
   - Upload stores as: `videos/<surveyId>/video.<ext>`
   - Test implementation uses: `<surveyId>/video.<ext>`
   - Need to verify exact path requirements
   - Investigate potential path encoding issues

## Next Steps
1. Survey Edit Page:
   - Implement PUT endpoint
   - Add Sortable.js to Layout.astro
   - Fix client instance management
   - Add error handling
   - Test functionality

2. Sound Mapping:
   - Add Sortable.js to Layout.astro
   - Configure Supabase service role key
   - Fix client instance management
   - Implement API endpoint
   - Add error handling
   - Test functionality

3. Logout Functionality:
   - Update Layout.astro implementation
   - Fix API endpoint
   - Implement proper cookie cleanup
   - Add loading states
   - Test all scenarios
   - Monitor for errors

4. SaveControls Authentication:
   - Implement server-side token extraction
   - Add proper error handling
   - Update middleware.ts
   - Modify API routes
   - Test all authentication flows
   - Monitor for authentication errors

5. Audio System Verification:
   - Run performance tests
   - Monitor memory usage
   - Test browser compatibility
   - Verify mobile performance
   - Gather user feedback

6. Video Player:
   - Review Supabase storage bucket policies
   - Compare authentication between test and VideoPlayer
   - Verify exact path requirements in storage
   - Test with service role key if needed
   - Consider implementing server-side URL generation
   - Investigate potential race conditions in initialization