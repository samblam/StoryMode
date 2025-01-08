# Technical Context

## Technologies Used
- Astro for frontend framework
- Supabase for backend services
- TypeScript for type safety
- Tailwind CSS for styling
- PostgREST for database API
- Howler.js for audio management
- requestAnimationFrame for smooth animations

## Development Setup
- Environment variables for Supabase configuration
- Type-safe database types from Supabase
- Client-side form handling with validation
- Role-based access control
- In-memory rate limiting system
- Audio progress tracking system
- Resource cleanup handlers

## Technical Constraints
- Must handle RLS (Row Level Security) policies
- Type safety must be maintained throughout
- Error handling must be comprehensive
- UI must be responsive and accessible
- Memory management for audio resources
- Rate limiting for API endpoints
- Browser compatibility requirements

## Performance Requirements
- Smooth audio playback and progress tracking
- Efficient memory cleanup
- Responsive UI updates
- Rate limit thresholds:
  - Profile operations: 20-50/hour
  - File operations: 30-50/hour
  - API calls: 100/minute
  - Auth operations: 3-5/15min

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- requestAnimationFrame API
- Web Audio API
- Proper cleanup on page unload

## Security Considerations
- Rate limiting to prevent abuse
- Session token management
- Role-based access control
- Input validation
- Error message sanitization
- Resource access verification