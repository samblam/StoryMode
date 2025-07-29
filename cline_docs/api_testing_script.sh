#!/bin/bash
# API Testing Script for Survey Publishing and Response Collection
# This script provides a simple way to test the implemented API endpoints

# Set variables
BASE_URL="http://localhost:3000"  # Change this to match your development server
ADMIN_TOKEN=""  # Add your admin JWT token here
SURVEY_ID=""    # Add the survey ID you want to test
PARTICIPANT_ID=""  # Will be set after creating a test participant
PARTICIPANT_TOKEN=""  # Will be set when testing responses

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Helper function for printing
print_header() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check if required variables are set
if [ -z "$ADMIN_TOKEN" ]; then
  print_error "Admin token is not set. Please add your JWT token to the script."
  exit 1
fi

if [ -z "$SURVEY_ID" ]; then
  print_error "Survey ID is not set. Please add a survey ID to test."
  exit 1
fi

# 1. Test: Creating a test participant
test_create_participant() {
  print_header "Creating Test Participant"
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/participants" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"survey_id\": \"$SURVEY_ID\",
      \"email\": \"test-$(date +%s)@example.com\",
      \"name\": \"Test Participant\"
    }")
  
  # Extract participant ID from response
  PARTICIPANT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
  
  if [ -n "$PARTICIPANT_ID" ]; then
    print_success "Test participant created with ID: $PARTICIPANT_ID"
  else
    print_error "Failed to create test participant. Response: $RESPONSE"
    exit 1
  fi
}

# 2. Test: Publishing the survey
test_publish_survey() {
  print_header "Publishing Survey (ID: $SURVEY_ID)"
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/surveys/$SURVEY_ID/publish" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  JOB_ID=$(echo $RESPONSE | grep -o '"jobId":"[^"]*' | grep -o '[^"]*$')
  
  if [[ $RESPONSE == *"success\":true"* ]]; then
    print_success "Survey published successfully. Job ID: $JOB_ID"
    
    # Wait for background job to complete
    echo "Waiting for background job to complete (5 seconds)..."
    sleep 5
  else
    print_error "Failed to publish survey. Response: $RESPONSE"
    exit 1
  fi
}

# 3. Test: Checking participant status after publishing
test_check_participant_status() {
  print_header "Checking Participant Status (ID: $PARTICIPANT_ID)"
  
  RESPONSE=$(curl -s -X GET "$BASE_URL/api/participants/$PARTICIPANT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  STATUS=$(echo $RESPONSE | grep -o '"status":"[^"]*' | grep -o '[^"]*$')
  ACCESS_TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
  
  if [ "$STATUS" == "active" ]; then
    print_success "Participant status is active as expected"
    
    if [ -n "$ACCESS_TOKEN" ]; then
      print_success "Participant has access token: $ACCESS_TOKEN"
      PARTICIPANT_TOKEN=$ACCESS_TOKEN
    else
      print_error "Participant does not have an access token"
    fi
  else
    print_error "Participant status is $STATUS, expected 'active'"
  fi
}

# 4. Test: Submitting a survey response
test_submit_response() {
  print_header "Submitting Survey Response"
  
  if [ -z "$PARTICIPANT_TOKEN" ]; then
    print_error "Participant token is not available. Cannot submit response."
    exit 1
  fi
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/surveys/$SURVEY_ID/responses" \
    -H "Content-Type: application/json" \
    -d "{
      \"participantId\": \"$PARTICIPANT_ID\",
      \"participantToken\": \"$PARTICIPANT_TOKEN\",
      \"responses\": {
        \"question1\": \"answer1\",
        \"question2\": \"answer2\"
      },
      \"soundMappingResponses\": {
        \"sound1\": \"profile1\",
        \"sound2\": \"profile2\"
      }
    }")
  
  if [[ $RESPONSE == *"success\":true"* ]]; then
    print_success "Survey response submitted successfully"
  else
    print_error "Failed to submit survey response. Response: $RESPONSE"
  fi
}

# 5. Test: Checking participant status after submission
test_check_completion_status() {
  print_header "Checking Completion Status (ID: $PARTICIPANT_ID)"
  
  RESPONSE=$(curl -s -X GET "$BASE_URL/api/participants/$PARTICIPANT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  STATUS=$(echo $RESPONSE | grep -o '"status":"[^"]*' | grep -o '[^"]*$')
  
  if [ "$STATUS" == "completed" ]; then
    print_success "Participant status is completed as expected"
  else
    print_error "Participant status is $STATUS, expected 'completed'"
  fi
}

# 6. Test: Attempting to submit a second response (should fail)
test_double_submission() {
  print_header "Testing Double Submission (should fail)"
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/surveys/$SURVEY_ID/responses" \
    -H "Content-Type: application/json" \
    -d "{
      \"participantId\": \"$PARTICIPANT_ID\",
      \"participantToken\": \"$PARTICIPANT_TOKEN\",
      \"responses\": {
        \"question1\": \"new_answer1\"
      }
    }")
  
  if [[ $RESPONSE == *"error"* ]]; then
    print_success "Double submission correctly rejected"
  else
    print_error "Double submission was incorrectly accepted. Response: $RESPONSE"
  fi
}

# Run all tests
run_all_tests() {
  print_header "Starting API Tests for Survey Publishing and Response Collection"
  
  test_create_participant
  test_publish_survey
  test_check_participant_status
  test_submit_response
  test_check_completion_status
  test_double_submission
  
  print_header "All Tests Completed"
}

# Execute all tests
run_all_tests