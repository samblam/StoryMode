# AI Engineer Development Prompt: Survey Module Completion

## Context

You are tasked with completing the survey management module for a full-stack application built with Astro, TypeScript, and Supabase. The module allows administrators to create surveys, manage participants, collect responses, and analyze results.

Most of the foundational work is already done, but there are several key features that need to be completed and bugs that need to be fixed. Your task is to implement these remaining features and fix the bugs to complete the survey module.

## Project Structure

The project follows this structure:
- **Frontend**: Astro components in `src/components/` and pages in `src/pages/`
- **Backend**: API endpoints in `src/pages/api/`
- **Database**: Supabase with migrations in `supabase/migrations/`
- **Utils**: Helper functions in `src/utils/`

## Requirements

You need to implement the following features:

1. **Admin Survey Preview**
   - Fix the 404 error on survey preview
   - Fix the undefined `previewSurvey` function
   - Resolve VideoPlayer callback errors
   - Ensure preview mode doesn't save responses

2. **Survey Publishing with Email Distribution**
   - Test and enhance email sending functionality
   - Implement better error handling for email failures
   - Add background job handling for large participant lists
   - Create better email templates

3. **Survey Response Saving**
   - Ensure sound mapping data is properly saved
   - Add validation for response data
   - Implement better error handling

4. **Admin Data Viewing and Export**
   - Enhance CSV export with more comprehensive data
   - Implement PDF export functionality
   - Improve data visualizations

## Technical Resources

You have access to these resources:
1. `survey_module_completion_plan.md` - Detailed plan with action items
2. `survey_module_technical_guide.md` - Technical implementation guide with code examples
3. `survey_module_summary.md` - Overview of current status

## Development Approach

Follow this approach to complete the module:

1. **Start with Critical Bugs**
   - Fix the survey preview functionality first
   - Address Supabase client initialization warnings
   - Test each fix thoroughly

2. **Implement Core Features**
   - Follow the technical guide for implementation details
   - Implement one feature at a time
   - Write tests for each feature

3. **Add Advanced Features**
   - Once core features are working, implement advanced features
   - Focus on data export and visualization enhancements

4. **Test and Refine**
   - Conduct comprehensive testing
   - Optimize performance
   - Improve error handling

## Implementation Guidelines

1. **Code Quality**
   - Follow existing patterns and coding standards
   - Use TypeScript types for all new code
   - Add comments for complex logic
   - Use async/await for asynchronous operations

2. **Error Handling**
   - Implement comprehensive error handling
   - Provide meaningful error messages
   - Log errors appropriately

3. **Testing**
   - Test each feature thoroughly
   - Include edge cases in your testing
   - Verify both success and failure scenarios

4. **Documentation**
   - Document all new functions and components
   - Update existing documentation as needed
   - Add usage examples for complex features

## Specific Technical Tasks

Start by implementing these specific tasks:

1. Fix the survey preview functionality:
   ```typescript
   // In SurveyPreview.astro
   // Debug and fix the previewSurvey function
   async function previewSurvey(surveyId) {
     try {
       // Implementation details in technical guide
     } catch (error) {
       // Error handling
     }
   }
   ```

2. Enhance email templates:
   ```typescript
   // In emailUtils.ts
   // Create a dedicated email template function
   export function createSurveyInvitationEmail(survey, participantName, surveyUrl) {
     // Implementation details in technical guide
   }
   ```

3. Implement background job handling:
   ```typescript
   // Create backgroundJobs.ts
   // Implement job creation and progress tracking
   export async function createPublishJob(surveyId, participantIds) {
     // Implementation details in technical guide
   }
   ```

4. Enhance data export:
   ```typescript
   // In export.ts
   // Improve CSV export and implement PDF export
   function convertToCSV(data, options) {
     // Implementation details in technical guide
   }
   ```

## Deliverables

Your final deliverables should include:

1. Fixed bugs with documentation of the fixes
2. Implemented features according to the requirements
3. Updated or new database migrations
4. Tests for all new functionality
5. Documentation for all new features

## Success Criteria

Your implementation will be considered successful when:

1. Admin can successfully preview surveys before publishing
2. Emails are reliably sent to all participants with correct unique URLs
3. All survey responses are properly saved to the database
4. Admin can view comprehensive data and export in multiple formats
5. All code passes tests and follows project standards

## Getting Started

1. Review the technical guide and completion plan thoroughly
2. Set up your development environment
3. Start with fixing the survey preview functionality
4. Follow the implementation timeline in the completion plan
5. Test each feature as you implement it

Good luck with the implementation! The technical guide provides detailed instructions for each feature, so refer to it frequently during development.