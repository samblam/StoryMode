## System Patterns

**How the system is built:**

- The system follows a Model-View-Component (MVC) like structure, particularly in the frontend with Astro components.
- Backend logic is primarily within API routes.
- Data fetching and state management are handled by utility functions.

**Key technical decisions:**

- Using Astro for the frontend to build a fast, content-focused site.
- Utilizing TypeScript for type safety and better code organization.
- Using Supabase for database and authentication.

**Architecture patterns:**

- **API Routes for Backend Logic:** API routes in the `pages/api` directory handle backend logic, interacting with the database and other services.
- **Utility Functions for Data Handling:** Utility functions in the `utils` directory encapsulate data fetching, processing, and manipulation logic. This promotes reusability and keeps components and API routes cleaner.
- **Astro Components for UI:** Astro components in the `components` directory are used to build the user interface. These components manage their own state and rendering logic.
- **Data Manager Pattern:** The `surveyDataManager.ts` utility is used to manage survey data, providing an abstraction layer between the components/API routes and the database interactions.
- **State Manager Pattern:** The `surveyStateManager.ts` utility is used to manage the state of the current survey being taken by a user.
- **Analytics Utilities Pattern:** A new pattern introduced for handling analytics and reporting:
  - `surveyAnalytics.ts`: Handles core analysis logic (metrics, performance analysis, behavior tracking)
  - `surveyResults.ts`: Manages results processing (raw data, graphs, exports)
  - `surveyExport.ts`: Handles data export functionality (CSV, PDF, anonymization)
  - This separation allows for modular testing and maintenance while keeping analytics concerns isolated
  - Components (`ReportGenerator.astro`, `DataExporter.astro`, `AnalyticsDashboard.astro`) consume these utilities