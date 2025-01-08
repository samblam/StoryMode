# Active Context

## Current Task
Fixing survey data fetching issues:

1. Client Data Issue:
   - Problem: Unnecessary clients join causing null data
   - Root cause: Using clients join when client_id is sufficient
   - Fix implemented:
     * Removed clients join from survey query
     * Using direct client_id from survey table
     * SurveyDetails already handles client_id properly

2. Survey Query Structure:
   - Problem: Complex PostgREST query failing
   - Solution implemented:
     * Split into separate queries for clarity
     * First fetch survey data
     * Then fetch survey sounds separately
     * Combine data before sending response
     * Removed unnecessary joins

## Recent Changes
- Refactored survey API endpoint:
  * Simplified query structure
  * Removed unnecessary clients join
  * Split complex query into separate parts
  * Maintained proper data relationships
- Kept existing client handling in SurveyDetails:
  * Using client_id directly
  * Maintaining backward compatibility
  * Proper null handling

## Next Steps
1. Testing:
   - Verify survey fetching works
   - Check sound relationships
   - Test client selection
   - Monitor error handling

2. Performance:
   - Monitor query efficiency
   - Check response times
   - Verify data consistency
   - Watch for potential issues

3. Documentation:
   - Update query patterns
   - Document relationship handling
   - Note client data approach
   - Add performance notes