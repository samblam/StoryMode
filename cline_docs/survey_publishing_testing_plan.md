# Survey Publishing Testing Plan

## Overview

This plan outlines steps to test our fixes to the survey publishing functionality, focusing on participant status updates and email sending features.

## Testing Environment Setup

1. **SMTP Configuration**
   - Ensure `.env` file has the proper SMTP configuration:
     ```
     SMTP_HOST=smtp.purelymail.com
     SMTP_PORT=587
     SMTP_USER=info@storymode.ca
     SMTP_PASS=your-app-specific-password
     SMTP_TO=info@storymode.ca
     SMTP_CC=sam@storymode.ca,nick@storymode.ca,ben@storymode.ca
     ```
   - For testing without real SMTP, comment out these values

2. **Test Data Setup**
   - Ensure a test survey exists with ID noted
   - Create test participants including one with samuel.ellis.barefoot@gmail.com
   - Reset participant statuses to "inactive" before testing

## Test Cases

### 1. Participant Status Updates

**Test 1A: Basic Status Update**
- *Steps:* 
  1. Run test-publish-workflow on a survey with inactive participants
  2. Check participant statuses in database
- *Expected Result:* All participant statuses should be updated to "active"

**Test 1B: Status Update with Failed Emails**
- *Steps:*
  1. Disable SMTP configuration (comment out in .env)
  2. Run test-publish-workflow
  3. Check participant statuses
- *Expected Result:* Participants should still be updated to "active" despite email failures

### 2. Email Sending

**Test 2A: Email Delivery with Valid SMTP**
- *Steps:*
  1. Configure valid SMTP settings
  2. Run test-publish-workflow
  3. Check email delivery to samuel.ellis.barefoot@gmail.com
- *Expected Result:* Email should be delivered successfully

**Test 2B: Error Handling with Invalid SMTP**
- *Steps:*
  1. Set incorrect SMTP credentials
  2. Run test-publish-workflow
  3. Check logs for proper error reporting
- *Expected Result:* Clear error message about SMTP verification failure

**Test 2C: Special Test Email Handling**
- *Steps:*
  1. Comment out SMTP settings except for samuel.ellis.barefoot@gmail.com
  2. Run test-publish-workflow
- *Expected Result:* Attempt to send to test email, skip others

### 3. Survey Status Updates

**Test 3A: Survey Published Status Update**
- *Steps:*
  1. Run test-publish-workflow
  2. Check if survey status is updated to "published"
- *Expected Result:* Survey status should be "published"

**Test 3B: Published_at Column Handling**
- *Steps:*
  1. Test with and without published_at column in database
- *Expected Result:* Should handle both cases without errors

### 4. Job Processing

**Test 4A: Job Progress Tracking**
- *Steps:*
  1. Run test-publish-workflow
  2. Monitor job progress updates
- *Expected Result:* Job should show progress and complete successfully

**Test 4B: Success Criteria**
- *Steps:*
  1. Run test with some email failures
  2. Check final job status
- *Expected Result:* Job should be marked as completed if participant statuses were updated

### 5. Error Scenarios

**Test 5A: Network Errors**
- *Steps:*
  1. Configure invalid SMTP host that causes network timeout
  2. Run test-publish-workflow
- *Expected Result:* Clear error message, participant statuses still updated

**Test 5B: Auth Errors**
- *Steps:*
  1. Configure valid SMTP host but invalid credentials
  2. Run test-publish-workflow
- *Expected Result:* Authentication error reported, participant statuses still updated

## Test Execution

1. **Initial Setup**
   ```bash
   # Reset test participants
   curl -X POST http://localhost:3000/api/participants/batch-update \
       -H "Content-Type: application/json" \
       -d '{"ids": ["id1", "id2"], "status": "inactive"}'
   ```

2. **Running Tests**
   ```bash
   # Run the test workflow
   curl -X POST http://localhost:3000/test-publish-workflow
   ```

3. **Verifying Results**
   - Check console logs for errors and progress
   - Verify database status updates
   - Check email delivery when using valid SMTP

## Expected Outcomes

After implementing our fixes, we expect:

1. Participant statuses to be reliably updated regardless of email success
2. Clear error messages for any email sending failures
3. Special handling for test emails to samuel.ellis.barefoot@gmail.com
4. Successful survey status updates with proper schema handling
5. Background jobs marked as successful as long as statuses are updated

## Next Steps

If all tests pass:
1. Merge changes to main branch
2. Deploy to production
3. Monitor for any issues

If tests fail:
1. Identify specific failure points
2. Implement targeted fixes for each issue
3. Re-test until all cases pass