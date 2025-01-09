# System Patterns

## Architecture
- Astro.js for static site generation and server-side rendering
- Component-based architecture with .astro files
- Supabase for backend services and authentication

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

## Error Handling
- Server-side errors caught in try/catch blocks
- Client-side operations need initialization checks
- Proper error messages displayed to users