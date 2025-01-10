# Technical Context

## Technology Stack
- Frontend: Astro.js
- Backend: Supabase
- Database: PostgreSQL (via Supabase)
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Audio: Howler.js
- UI: Sortable.js for drag-and-drop functionality

## Authentication System
- Supabase Auth for user management
- Token-based authentication:
  * Access tokens stored in cookies
  * Refresh tokens for session management
  * Token cleanup on logout
- Client-side auth:
  * Browser-based Supabase client
  * Loading state management
  * Error handling
  * Request debouncing
- Server-side auth:
  * Service role access for admin operations
  * Session validation
  * Cookie management
- Logout flow:
  * Client-side state cleanup
  * Server-side session termination
  * Cookie removal
  * Local storage cleanup
  * Error handling
  * Loading states
  * User feedback

## Key Technical Details
- Supabase client initialization is required both server-side and client-side
- Server-side initialization happens in src/lib/supabase.ts
- Client-side Supabase needs to be initialized before use in browser scripts
- Environment variables required:
  - PUBLIC_SUPABASE_URL
  - PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (for admin operations)

## Sortable.js Configuration
- Version: 1.15.0
- Integration:
  * Loaded via CDN in Layout.astro
  * Global window.Sortable availability
  * DOM-ready initialization
- Features used:
  * Drag handles
  * Animation
  * Order tracking
  * Event callbacks
- Error handling:
  * Script loading verification
  * Initialization checks
  * Event error handling
  * State recovery

## Audio System Configuration
- Library: Howler.js for audio management
- Format: MP3 audio files
- Loading strategy: 
  * Lazy loading with progress tracking
  * Loading state management
  * Visual progress indicators
  * Error state handling
- Memory management:
  * Cleanup routines for unused resources
  * Timeout handling for operations
  * Event listener cleanup
  * Cache invalidation strategy
- Performance features:
  * Loading state tracking
  * Progress monitoring
  * Error recovery
  * Memory optimization
- User experience:
  * Loading indicators
  * Progress bars
  * Error visualization
  * Button state management

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
- Authentication:
  * Logout functionality failing
  * Token handling inconsistencies
  * Cookie cleanup issues
  * Error handling gaps
- Storage:
  * Client-side storage access failing with "Object not found"
  * Path handling inconsistencies between components
  * Service role key may be required for some operations
  * Authentication state affecting storage access
  * Potential race conditions in client initialization
- UI Components:
  * Sortable.js initialization failures
  * Multiple client instances detected
  * Service role key configuration missing

## Technical Constraints
- Storage paths must be properly normalized
- Bucket policies must be configured correctly
- Service role access needed for admin operations
- Client-side operations limited by bucket policies
- Storage operations require proper authentication
- Audio loading must consider:
  * Browser memory limitations
  * Mobile device constraints
  * Network bandwidth
  * User experience impact
  * Browser audio limitations
- UI interactions must handle:
  * Script loading failures
  * Initialization timing
  * Event propagation
  * State synchronization

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- HTML5 Audio support required
- Web Audio API availability varies
- Mobile browser limitations:
  * Audio autoplay restrictions
  * Memory constraints
  * Background playback limitations
- Drag-and-drop support:
  * Touch events for mobile
  * Mouse events for desktop
  * Fallback interactions

## Performance Monitoring
- Audio loading metrics:
  * Loading time tracking
  * Progress monitoring
  * Error rate tracking
  * Memory usage patterns
- User experience metrics:
  * Loading indicator effectiveness
  * Error handling clarity
  * Progress accuracy
  * Cleanup efficiency
- Authentication metrics:
  * Login/logout success rates
  * Token refresh success rates
  * Session duration tracking
  * Error frequency monitoring
- UI interaction metrics:
  * Drag-and-drop responsiveness
  * Event handling performance
  * State update efficiency
  * Error recovery speed