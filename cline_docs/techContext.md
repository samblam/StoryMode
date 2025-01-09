# Technical Context

## Technology Stack
- Frontend: Astro.js
- Backend: Supabase
- Database: PostgreSQL (via Supabase)
- Authentication: Supabase Auth
- Storage: Supabase Storage

## Key Technical Details
- Supabase client initialization is required both server-side and client-side
- Server-side initialization happens in src/lib/supabase.ts
- Client-side Supabase needs to be initialized before use in browser scripts
- Environment variables required:
  - PUBLIC_SUPABASE_URL
  - PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (for admin operations)

## Storage Configuration
- Bucket: 'videos' for video storage
- Path format: `videos/<surveyId>/video.<ext>`
- Access patterns:
  * Server-side: Admin client with service role
  * Client-side: Regular client with bucket policies
- URL signing:
  * 1-hour expiration for signed URLs
  * Requires proper authentication
  * Path must not include bucket prefix in operations

## Current Technical Issues
- Client-side storage access failing with "Object not found"
- Path handling inconsistencies between components
- Service role key may be required for some operations
- Authentication state affecting storage access
- Potential race conditions in client initialization

## Technical Constraints
- Storage paths must be properly normalized
- Bucket policies must be configured correctly
- Service role access needed for admin operations
- Client-side operations limited by bucket policies
- Storage operations require proper authentication