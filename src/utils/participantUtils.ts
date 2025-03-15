import { getClient } from '../lib/supabase';
import { customAlphabet } from 'nanoid';

// Create a custom nanoid generator with a specific alphabet
// Excluding similar-looking characters (0, O, 1, I, l) to avoid confusion
const generateId = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 12);

// Token generator with a larger character set for access tokens
const generateToken = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_', 32);

/**
 * Generates a secure token for participant access
 * @returns A cryptographically secure random token
 */
export async function generateSecureToken(): Promise<string> {
  try {
    // Generate a random token
    const token = generateToken();
    
    // Check if token already exists (unlikely, but good practice)
    const supabase = getClient({ requiresAdmin: true });
    const { data, error } = await supabase
      .from('participants')
      .select('id')
      .eq('access_token', token)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking token uniqueness:', error);
      throw error;
    }
    
    if (data) {
      // On the extremely rare chance of a collision, generate a new token
      return generateSecureToken();
    }
    
    return token;
  } catch (error) {
    console.error('Error generating secure token:', error);
    // Fallback to a simple token generation if there's an error
    return generateToken();
  }
}

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
 * @param accessToken - The access token for authentication
 */
export function generateSurveyUrl(
  baseUrl: string,
  surveyId: string,
  participantIdentifier: string,
  accessToken: string
): string {
  return `${baseUrl}/surveys/${surveyId}?participant_id=${participantIdentifier}&token=${accessToken}`;
}

/**
 * Generates a participant URL using the participant ID
 * This is a convenience function that gets the participant identifier and generates the URL
 * @param surveyId - The ID of the survey
 * @param participantId - The ID of the participant
 * @returns The full URL for the participant to access the survey
 */
export async function generateParticipantUrl(
  surveyId: string,
  participantId: string
): Promise<string> {
  try {
    // Get the participant to find their identifier and access token
    const supabase = getClient({ requiresAdmin: true });
    const { data: participant, error } = await supabase
      .from('participants')
      .select('participant_identifier, access_token')
      .eq('id', participantId)
      .single();

    if (error || !participant || !participant.participant_identifier) {
      throw new Error(`Failed to get participant identifier: ${error?.message || 'Participant not found'}`);
    }

    if (!participant.access_token) {
      throw new Error('Participant does not have a valid access token');
    }

    // Get the base URL from environment variables
    let baseUrl = process.env.PUBLIC_BASE_URL;
    
    // If not set in environment, try to detect from request or use a safer default
    if (!baseUrl) {
      // Logging this as a warning so it's clear in server logs when the fallback is being used
      console.warn('PUBLIC_BASE_URL environment variable not set. Using dynamic detection or fallback.');
      
      // In Astro, properly configured PUBLIC_* environment variables should be available
      // If not set, we use a fallback but log a warning to make it obvious
      baseUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
      
      // If still no URL found, use a safer default relative URL instead of hardcoded localhost
      if (!baseUrl) {
        console.warn('No base URL environment variables found. Using relative URL, which may cause issues with email links.');
        baseUrl = ''; // Empty string will create a relative URL (works on same domain)
      }
    }
    
    // Generate the URL with both identifier and token
    return generateSurveyUrl(baseUrl, surveyId, participant.participant_identifier, participant.access_token);
  } catch (error) {
    console.error('Error generating participant URL:', error);
    throw error;
  }
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