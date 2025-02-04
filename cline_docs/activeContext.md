# Active Context

## Current Task

Fixing DB interaction issues across the application after recent changes. Currently updating all direct supabaseAdmin imports to use getClient pattern.

## Recent Changes

- Fixed sound URL refresh endpoint by properly initializing Supabase admin client
- Updated storageUtils.ts to use getClient pattern:
  - Replaced all direct supabaseAdmin usage
  - Added proper FileObject typing
  - Initialized admin client per function
  - Maintained existing error handling
- Updated sound management endpoints to use getClient pattern:
  - upload.ts: Single client initialization, updated auth verification and DB operations
  - delete.ts: Single client initialization, maintained admin role checking
  - Maintained rate limiting and error handling in both endpoints
- Updated sound-profiles endpoints to use getClient pattern:
  - index.ts: Separate client initialization for each endpoint (GET, POST, PUT)
  - [id].ts: Single client for transaction-like operations
  - Added proper TypeScript interfaces and type annotations
  - Maintained role-based access control and rate limiting
- Updated authUtils.ts with sophisticated client handling:
  - Kept regular supabase client for non-admin operations
  - Added getClient initialization for admin operations
  - Maintained RLS error handling and fallback patterns
  - Preserved type safety throughout

## Patterns Identified

1. Use getClient({ requiresAdmin: true }) instead of direct supabaseAdmin import
2. Initialize client at the start of request handling
3. Each endpoint needs its own client initialization
4. For transaction-like operations, use a single client instance
5. Add proper TypeScript interfaces for database types
6. Maintain existing middleware (rate limiting, auth checks)
7. Keep error handling and logging consistent
8. RLS Handling Patterns:
   - Try regular client first when possible
   - Fall back to admin client on RLS errors
   - Initialize admin client only when needed
   - Maintain type safety in fallback logic

## Next Steps

- Continue updating remaining files that use direct supabaseAdmin imports:
  - Various auth endpoints
- Consider adding middleware to handle admin client initialization for admin-only endpoints
- Add automated tests to verify DB operations work correctly after changes
- Update documentation to reflect new patterns
- Consider creating shared interfaces for common database types
- Document RLS fallback patterns in systemPatterns.md