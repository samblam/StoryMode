# Decision Log

This file records architectural and implementation decisions made during the StoryMode project development.
2025-08-26 16:02:15 - Initial decision log created from project patterns and .clinerules analysis.

## Technology Stack Decisions

### Decision: Astro Framework Selection
**Date:** 2025-01-15 (inferred from project structure)  
**Rationale:** Chosen for static site generation with component islands architecture, providing optimal performance for the UX research platform while supporting interactive components where needed.
**Implementation Details:** Astro configured with TypeScript, SSR capabilities for dynamic content, and hybrid rendering for optimal performance.

### Decision: Supabase as Backend-as-a-Service
**Date:** 2025-01-15 (inferred)  
**Rationale:** Provides PostgreSQL database, authentication, and real-time features in a single service, reducing infrastructure complexity for the research platform.
**Implementation Details:** Using Supabase ORM for SQL injection protection, JWT for session management, and `getClient({ requiresAdmin: true })` pattern for admin operations.

### Decision: Chart.js for Data Visualization
**Date:** 2025-01-20 (inferred)  
**Rationale:** Selected Chart.js v4.4.7 for analytics dashboard due to comprehensive charting capabilities and Canvas API integration.
**Implementation Details:** Implemented proper Chart.js cleanup to prevent memory leaks, with timestamp-based sorting for chronological data display.

## Security and Development Patterns

### Decision: Environment-Aware Security Implementation
**Date:** 2025-01-25  
**Rationale:** Recognize that StoryMode is a UX research platform, not a SOC 2 compliant application. Different security levels needed for development vs production.
**Implementation Details:** 
- Development: Verbose logging acceptable, 1-week session duration
- Production: 4-hour session limits, audit logging, anonymization controls
- Security focus on protecting client sound libraries and participant data

### Decision: Data Migration Strategy
**Date:** 2025-01-29  
**Rationale:** Complex survey data requires careful handling with preview and validation capabilities.
**Implementation Details:** Always preview migrations before execution, comprehensive logging, validation logic in both migration tools and live processing, rollback planning.

## Analytics and Data Quality Decisions

### Decision: Data Quality First Approach
**Date:** 2025-01-29  
**Rationale:** Investigation showed data quality issues were root cause of analytics problems, not UI rendering issues.
**Implementation Details:** 
- Case-insensitive partial text matching for survey responses
- Database schema validation before field references
- Actual match percentages vs binary success rates
- Timeline charts use timestamp sorting, not alphabetical

### Decision: Git Workflow and Branch Management
**Date:** 2025-01-25  
**Rationale:** Feature branch strategy with specific merge conflict resolution patterns based on file types.
**Implementation Details:**
- Always merge feature branches INTO main
- Take feature branch version for package.json, astro.config.mjs, package-lock.json
- Remove .astro/* build artifacts from merge conflicts
- Use descriptive branch names like "data-visualization"

## Development Workflow Decisions

### Decision: Memory Bank Documentation System
**Date:** 2025-08-26  
**Rationale:** Need persistent context across development sessions for complex project with multiple technical domains.
**Implementation Details:** Six-file system (productContext.md, activeContext.md, systemPatterns.md, techContext.md, progress.md, decisionLog.md) with timestamp tracking and cross-mode consistency.

### Decision: Development-First, Security-Later Approach
**Date:** 2025-01-25  
**Rationale:** For UX research platform, functionality completion takes precedence with security implementation planned for pre-production phase.
**Implementation Details:** Environment-aware logging, GDPR compliance for EU participants, confidentiality for client intellectual property.

2025-08-26 16:02:15 - Decision log established with key architectural and implementation decisions extracted from project history and .clinerules analysis.

[2025-08-26 20:19:15] - **MIDDLEWARE FIX FOR API ROUTE INTERFERENCE**
**Decision**: Modified middleware.ts to avoid request object modification for API routes
**Rationale**: 
- Original middleware created new Request objects with `duplex: 'half'` for all requests
- This interfered with POST request body parsing for API endpoints
- Caused login endpoint to return HTML error pages instead of JSON responses
**Implementation**:
- Added `isApiRoute` check to identify API requests
- Only modify requests when adding authorization headers is necessary
- Use original request object for API routes to preserve POST body integrity
**Impact**: Resolves login JSON parsing errors and ensures API endpoints function correctly