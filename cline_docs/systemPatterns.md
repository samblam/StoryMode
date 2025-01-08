# System Patterns

## Supabase Integration
- Using getClient utility for role-based access
- Type-safe queries using Database types
- Error handling with detailed logging
- Client-side query patterns:
  - Fetching clients with count
  - Filtering sound profiles by client_id
  - Using proper type casting for query results

## Form Handling
- Client-side form submission with validation
- Dynamic dropdown population:
  - Using database property names consistently
  - Type-safe interfaces matching database schema
  - Proper error and loading states
- Loading states and error messages
- Type-safe form data handling

## Audio Management
- Centralized audio control through audioManager
- Resource cleanup patterns:
  - Controller array for tracking instances
  - Unload event listeners for cleanup
  - Memory leak prevention
- Progress tracking with requestAnimationFrame
- Event-based state management for audio playback

## API Rate Limiting
- Per-endpoint rate limit configurations
- In-memory rate limit store with cleanup
- Rate limit headers for client feedback
- Endpoint-specific limits:
  - Profile operations (read/create/update)
  - File operations (upload/delete)
  - Authentication operations
  - Survey operations

## Error Handling
- Type-safe error responses
- Detailed error logging
- Client-side error states
- Loading state management
- Null element checking
- Resource availability verification