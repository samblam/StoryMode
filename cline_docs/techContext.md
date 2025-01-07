## Technical Context

**Technologies used:**

- Astro
- TypeScript
- Supabase
- Tailwind CSS
- Vercel (for deployment)
- Chart.js (for data visualization)

**Development setup:**

- Ensure Node.js and npm are installed
- Install project dependencies using `npm install`
- Set up Supabase CLI and link to the project
- Environment variables are managed using `.env` files

**Technical constraints:**

- Adhere to existing coding standards and project structure
- Ensure all database interactions are secure and efficient
- Maintain consistency in error handling and logging

**Analytics-specific constraints:**
- Process survey data in chunks to handle large datasets efficiently
- Implement data anonymization before export
- Cache analysis results to improve performance
- Ensure exported files (CSV, PDF) are properly formatted and sanitized
- Follow type-safe patterns for data processing

**Performance requirements:**
- Analytics processing < 5s for large datasets
- Export generation < 10s
- Chart rendering < 500ms
- API response time < 200ms
- Cache invalidation after 5 minutes

**Memory management:**
- Use batch processing for large datasets
- Implement efficient data structures
- Clean up resources after processing
- Manage cache size appropriately

**Export requirements:**
- Support CSV and PDF formats
- Ensure proper data anonymization
- Validate file formats
- Track export progress
- Handle export errors gracefully

**Security requirements:**
- Validate all input data
- Sanitize exported data
- Implement proper access control
- Secure file handling
- Protect sensitive information

**Browser compatibility:**
- Support modern browsers
- Ensure responsive design
- Handle offline scenarios
- Manage memory usage

**Error handling:**
- Provide clear error messages
- Implement recovery strategies
- Preserve progress where possible
- Log errors appropriately

**Documentation:**
- Maintain up-to-date API documentation
- Document error codes and solutions
- Provide usage examples
- Include troubleshooting guides