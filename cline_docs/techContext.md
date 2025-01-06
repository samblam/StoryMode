## Technical Context

**Technologies used:**

- Astro
- TypeScript
- Supabase
- Tailwind CSS
- Vercel (for deployment)
- **New:** No new technologies were introduced in this task, but existing technologies were used to implement the analytics and reporting features.

**Development setup:**

- Ensure Node.js and npm are installed.
- Install project dependencies using `npm install`.
- Set up Supabase CLI and link to the project.
- Environment variables are managed using `.env` files.

**Technical constraints:**

- Adhere to existing coding standards and project structure.
- Ensure all database interactions are secure and efficient.
- Maintain consistency in error handling and logging.
- **Analytics-specific constraints:**
  - Process survey data in chunks to handle large datasets efficiently
  - Implement data anonymization before export
  - Cache analysis results to improve performance
  - Ensure exported files (CSV, PDF) are properly formatted and sanitized
  - Follow type-safe patterns for data processing