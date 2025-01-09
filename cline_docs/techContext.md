# Technical Context

## Technology Stack
- Frontend: Astro.js
- Backend: Supabase
- Database: PostgreSQL (via Supabase)
- Authentication: Supabase Auth

## Key Technical Details
- Supabase client initialization is required both server-side and client-side
- Server-side initialization happens in src/lib/supabase.ts
- Client-side Supabase needs to be initialized before use in browser scripts
- Environment variables required:
  - PUBLIC_SUPABASE_URL
  - PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (for admin operations)

## Current Technical Issues
- Client-side Supabase initialization missing in browser context
- Window.supabase is undefined when accessed in client-side scripts