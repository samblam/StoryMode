# System Patterns

## Architecture
- Astro.js for static site generation and server-side rendering
- Component-based architecture with .astro files
- Supabase for backend services and authentication

## Authentication Patterns
- Server-side authentication via Supabase client
- Client-side auth state management
- Token handling:
  * Cookie-based token storage
  * Token validation on requests
  * Proper token cleanup on logout
- Logout flow:
  * Client-side state cleanup
  * Server-side session termination
  * Cookie removal
  * Local storage cleanup
  * Proper error handling
  * Loading state management
  * User feedback
  * Request debouncing

## Data Flow
- Server-side: Direct Supabase client usage via src/lib/supabase.ts
- Client-side: Browser-based Supabase client needed for interactive features
- Components can have both server-side and client-side scripts

## Component Patterns
- Server Script: Runs during build/request time
- Client Script: Runs in browser, needs explicit initialization
- Components should handle both server and client state appropriately

## State Management
- Server state managed through Supabase queries
- Client state requires initialized Supabase client in window context
- Components should verify client availability before operations

## Drag and Drop Patterns
- Sortable.js integration:
  * Script loaded in Layout.astro for global availability
  * Initialization after DOM content loaded
  * Error handling for script loading failures
  * Proper event listener cleanup
- Mapping container management:
  * Container element verification
  * Dynamic initialization
  * Order tracking and updates
  * Error state handling
- Event handling:
  * Order change events
  * Drag start/end events
  * Error events
  * State synchronization

## Audio Management Patterns
- Singleton AudioManager instance for centralized control
- Loading state management:
  * Status tracking (idle, loading, loaded, error)
  * Progress monitoring
  * Error state handling
  * Event-based state updates
- Resource management:
  * Lazy loading with progress tracking
  * Caching with invalidation
  * Memory cleanup routines
  * Event listener management
- User interface patterns:
  * Loading indicators with progress bars
  * Button state synchronization
  * Error visualization
  * Progress tracking display
- Error handling:
  * Retry mechanisms
  * Error state visualization
  * User feedback
  * Recovery procedures
- Performance patterns:
  * Progress monitoring
  * Memory usage tracking
  * Loading time optimization
  * Cache management

## Storage Access Patterns
- Server-side: Uses service role key for admin operations
- Client-side: Uses anon key with bucket policies
- Path handling:
  * Storage paths should not include bucket name
  * Paths stored with prefix in DB (e.g., 'videos/path')
  * Paths used without prefix in storage operations
- Authentication:
  * Server operations use admin client
  * Client operations need proper bucket policies
  * Some operations may require service role access

## Error Handling
- Server-side errors caught in try/catch blocks
- Client-side operations need initialization checks
- Storage operations should handle:
  * Authentication failures
  * Path validation
  * Object not found errors
- Audio operations should handle:
  * Loading failures
  * Progress tracking errors
  * State management issues
  * Resource cleanup failures
- Proper error messages displayed to users

## Performance Patterns
- Lazy loading of resources
- Progress tracking for long operations
- Memory cleanup routines
- Resource unloading when not needed
- Performance monitoring and metrics
- Error recovery strategies
- Cache management strategies

## Component Communication
- Event-based state updates
- Loading state propagation
- Progress information sharing
- Error state broadcasting
- Resource state synchronization

## Resource Management
- Memory usage optimization
- Cache invalidation strategies
- Cleanup routine scheduling
- Event listener management
- State cleanup procedures

## User Experience Patterns
- Loading state visualization
- Progress indication
- Error state display
- Interactive feedback
- State synchronization
- Resource availability indication