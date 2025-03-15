# Survey Publishing and Response Collection Testing Guide

This guide provides step-by-step instructions for testing the newly implemented survey publishing and response collection features.

## Prerequisites

1. A running instance of the application
2. Admin access to the application
3. Access to test email accounts to verify email sending

## Test 1: Survey Publishing

### Setup
1. Create a test survey with the following attributes:
   - Title: "Test Publishing Feature"
   - Description: "This is a test survey for verifying the publishing feature"
   - Add at least one function with multiple choice options
   - Add a video if needed for full testing

2. Add test participants to the survey:
   - Add at least 5 test participants with valid email addresses
   - Ensure participants have names and emails set correctly
   - Verify all participants are in "inactive" status

### Test Publishing Process
1. Navigate to the survey edit page
2. Click the "Publish Survey" button
3. Confirm the publishing action in the confirmation dialog
4. Wait for the processing to complete

### Verification Steps
1. Check Survey Status:
   - Verify the survey shows as "Published" in the UI
   - Check that the `published_at` timestamp is set in the database

2. Check Participant Status:
   - Verify all participants have been updated to "active" status
   - Check that access tokens and URLs have been generated for each participant

3. Verify Email Sending:
   - Check test email accounts for invitation emails
   - Verify the email content includes:
     - Correct survey title
     - Participant's name
     - Working survey access link

4. Check Background Jobs:
   - Verify the background job was created and completed successfully
   - Check for any errors in the job processing logs

## Test 2: Survey Response Collection

### Setup
1. Use the participant URLs generated during publishing
2. Open the survey URL in a browser (simulating a participant)

### Test Response Submission
1. Complete the survey form:
   - Answer all required questions
   - Test sound mapping functionality if applicable
   - Click the "Submit" button

2. Verify form submission:
   - Check that you are redirected to the thank-you page
   - Verify no errors are shown in the browser console

### Verification Steps
1. Check Response Storage:
   - Verify the response data is correctly saved in the `survey_responses` table
   - Check that both regular responses and sound mapping responses are saved

2. Check Participant Status:
   - Verify the participant status has been updated to "completed"
   - Check that `completed_at` timestamp is set

3. Verify Completion Email:
   - Check the test email account for a completion confirmation email
   - Verify the email content includes:
     - Correct survey title
     - Participant's name
     - Proper completion confirmation message

4. Test Access Control:
   - Try accessing the survey URL again
   - Verify that a completed participant cannot submit a second response

## Test 3: Edge Cases

### Large Participant Lists
1. Create a test survey with 100+ participants
2. Publish the survey and monitor performance
3. Check if the background job system correctly processes all participants

### Invalid Access
1. Try accessing a survey with an invalid token
2. Verify proper error messages are shown
3. Try accessing a survey with an expired participant
4. Verify access is denied with appropriate messaging

### Error Handling
1. Submit invalid form data to test validation
2. Test with malformed participant IDs or tokens
3. Verify appropriate error messages are displayed

## Test 4: Performance Monitoring

1. Monitor job execution time for different sizes of participant lists
2. Check database query performance during high load
3. Monitor email sending performance and rate limiting

## Reporting Issues

When reporting any issues found during testing, please include:
1. The test case that failed
2. Expected vs. actual behavior
3. Any error messages or logs
4. Steps to reproduce the issue
5. Screenshots if applicable

## Test Completion Checklist

- [ ] Survey publishing works correctly
- [ ] Participant status updates are working
- [ ] Email sending functions properly
- [ ] Response collection and storage work correctly
- [ ] Completion emails are sent
- [ ] Status transitions function as expected
- [ ] Edge cases are handled properly
- [ ] Performance is acceptable