# Technology Context

This document outlines the technology stack, development setup, and technical constraints for the StoryMode UX research platform.

## Frontend Technologies

### Core Framework
- **Astro** - Static site generator with component islands architecture
- **TypeScript** - Type-safe JavaScript development
- **Node.js** - JavaScript runtime environment

### UI & Analytics  
- **Chart.js v4.4.7** - Data visualization library for analytics dashboard
- **Tailwind CSS** - Utility-first CSS framework for styling
- **HTML5 Audio API** - Audio playback for sound samples

## Backend Technologies

### Database & Authentication
- **PostgreSQL** - Primary database via Supabase
- **Supabase** - Backend-as-a-Service providing database, auth, and real-time features
- **JWT** - JSON Web Tokens for session management

### APIs & Services
- **RESTful APIs** - Standard HTTP API architecture
- **Server-Side Rendering (SSR)** - Astro's hybrid rendering capabilities

## Development Setup

### IDE & Tools
- **VS Code** - Primary development environment
- **npm** - Package manager
- **Git** - Version control system
- **Supabase Studio** - Database management interface

### Development Workflow
- Local development server via Astro dev command
- Hot module replacement for rapid development
- TypeScript compilation and type checking
- Automated build processes for production deployment

## Technical Constraints

### Browser Compatibility
- Modern browser support (ES2020+)
- HTML5 audio support required for sound playback
- Canvas API support needed for Chart.js visualizations

### Performance Requirements  
- Fast page load times through static generation
- Efficient audio streaming for sound samples
- Optimized chart rendering for large datasets

### API Scalability
- Supabase connection pooling for database access
- Efficient query patterns to minimize database load
- Caching strategies for frequently accessed data

### Security Best Practices
- Secure JWT implementation for authentication
- Input validation on all user-submitted data
- HTTPS enforcement for production deployment
- Rate limiting on API endpoints to prevent abuse

2025-08-26 16:00:40 - Migrated from cline_docs/techContext.md to memory-bank structure