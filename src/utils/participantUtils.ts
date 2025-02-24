import { getClient } from '../lib/supabase';
import { customAlphabet } from 'nanoid';

// Create a custom nanoid generator with a specific alphabet
// Excluding similar-looking characters (0, O, 1, I, l) to avoid confusion
const generateId = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 12);

/**
 * Generates a unique identifier for a participant's survey URL
 * Ensures the generated identifier doesn't already exist in the database
 */
export async function generateUniqueIdentifier(): Promise<string> {
  console.log('Generating unique identifier');
  try {
    const supabase = getClient({ requiresAdmin: true });
    console.log('Supabase client initialized for identifier generation');
    
    let isUnique = false;
    let identifier = '';
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops

    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      identifier = generateId();
      console.log(`Generated identifier (attempt ${attempts}): ${identifier}`);

      // Check if identifier already exists
      try {
        const { data: existingParticipant, error } = await supabase
          .from('participants')
          .select('participant_identifier')
          .eq('participant_identifier', identifier)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking identifier uniqueness:', error);
          throw error;
        }

        if (!existingParticipant) {
          console.log('Identifier is unique');
          isUnique = true;
        } else {
          console.log('Identifier already exists, generating a new one');
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
          // No match found, which means identifier is unique
          console.log('No match found, identifier is unique');
          isUnique = true;
        } else {
          console.error('Error checking identifier uniqueness:', error);
          throw error;
        }
      }
    }

    if (!isUnique) {
      console.error('Failed to generate unique identifier after', maxAttempts, 'attempts');
      throw new Error('Failed to generate unique identifier');
    }

    console.log('Returning unique identifier:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error in generateUniqueIdentifier:', error);
    throw error;
  }
}

/**
 * Generates a survey URL for a participant
 * @param baseUrl - The base URL of the application
 * @param surveyId - The ID of the survey
 * @param participantIdentifier - The unique identifier for the participant
 */
export function generateSurveyUrl(
  baseUrl: string,
  surveyId: string,
  participantIdentifier: string
): string {
  return `${baseUrl}/surveys/${surveyId}?participant=${participantIdentifier}`;
}

/**
 * Validates a participant identifier format
 * @param identifier - The identifier to validate
 */
export function isValidParticipantIdentifier(identifier: string): boolean {
  // Check if identifier matches our format (12 characters from our alphabet)
  const validFormat = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/;
  return validFormat.test(identifier);
}

/**
 * Gets participant information from an identifier
 * @param identifier - The participant identifier
 */
export async function getParticipantFromIdentifier(identifier: string) {
  if (!isValidParticipantIdentifier(identifier)) {
    throw new Error('Invalid participant identifier format');
  }

  const supabase = getClient({ requiresAdmin: true });
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('participant_identifier', identifier)
    .single();

  if (error) {
    throw new Error('Failed to fetch participant information');
  }

  return participant;
}