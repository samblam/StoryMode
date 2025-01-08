import { getSurveyState, setSubmitting } from './surveyStateManager';
import type { Database } from '../types/database';

interface Match {
    soundId: string;
    functionId: string;
}

import { getSignedUrl } from './storageUtils';

export type SurveyWithRelations = Database['public']['Tables']['surveys']['Row'] & {
    survey_sounds: {
        id: string;
        sound_id: string;
        intended_function: string;
        order_index: number;
        sounds: {
            id: string;
            name: string;
            file_path: string;
            storage_path: string;
            profile_id: string;
            url?: string;
        };
    }[];
    clients?: {
        id: string;
        name: string;
        email: string;
    } | null;
};

/**
 * Fetches survey data by ID with related data
 * @param id - Survey ID
 * @returns Promise<SurveyWithRelations | null>
 */
export async function getSurveyById(id: string, baseUrl?: string, token?: string): Promise<SurveyWithRelations | null> {
    try {
        // Construct full URL using provided base URL or default to relative path
        const url = baseUrl ? `${baseUrl}/api/surveys/${id}` : `/api/surveys/${id}`;
        
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const { data } = await response.json();
        if (!data) {
            throw new Error('No data returned from server');
        }

        // Generate signed URLs for all sounds
        if (data.survey_sounds) {
            await Promise.all(
                data.survey_sounds.map(async (surveySound: SurveyWithRelations['survey_sounds'][0]) => {
                    try {
                        if (surveySound.sounds?.storage_path) {
                            surveySound.sounds.url = await getSignedUrl(surveySound.sounds.storage_path);
                        }
                    } catch (error) {
                        console.error(`Error generating signed URL for sound ${surveySound.sound_id}:`, error);
                        // Don't throw, just continue with other sounds
                    }
                })
            );
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching survey:', error);
        return null;
    }
}

export async function submitSurveyResponses(surveyId: string, matches: Match[], baseUrl?: string): Promise<boolean> {
    setSubmitting(true);
    const state = getSurveyState();

    try {
        // Validate matches
        if (!validateMatches(matches)) {
            console.error('Invalid matches');
            setSubmitting(false);
            // Display error to user
            alert('Invalid matches. Please check your selections.');
            return false;
        }

        // Format response data
        const responseData = formatResponseData(matches);

        // Submit results
        const url = baseUrl ? `${baseUrl}/api/surveys/${surveyId}/responses` : `/api/surveys/${surveyId}/responses`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(responseData),
        });

        if (!response.ok) {
            console.error('Failed to submit survey responses');
            setSubmitting(false);
            // Display error to user
            alert('Failed to submit survey responses. Please try again.');
            return false;
        }

        setSubmitting(false);
        return true;
    } catch (error) {
        console.error('Error submitting survey responses:', error);
        setSubmitting(false);
        // Display error to user
        alert('An error occurred while submitting survey responses. Please try again.');
        return false;
    }
}

function validateMatches(matches: Match[]): boolean {
    if (!matches || matches.length === 0) {
        return false;
    }
    // Add more validation logic here if needed
    return true;
}

function formatResponseData(matches: Match[]): { matches: { [soundId: string]: string } } {
    const formattedMatches: { [soundId: string]: string } = {};
    matches.forEach(match => {
        formattedMatches[match.soundId] = match.functionId;
    });
    return { matches: formattedMatches };
}

/**
 * Saves survey data including title, description, client, sounds, and video
 */
export async function saveSurveyData(data: Record<string, any>, baseUrl?: string, token?: string): Promise<boolean> {
    try {
        const url = baseUrl ? `${baseUrl}/api/surveys/${data.id}` : `/api/surveys/${data.id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error saving survey:', error);
        throw error;
    }
}

type SurveyStatus = 'draft' | 'active' | 'completed';

/**
 * Updates survey active state
 */
export async function updateSurveyActive(surveyId: string, active: boolean, baseUrl?: string, token?: string): Promise<boolean> {
    try {
        const url = baseUrl ? `${baseUrl}/api/surveys/${surveyId}` : `/api/surveys/${surveyId}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ active }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(`Error updating survey active state to ${active}:`, error);
        throw error;
    }
}

/**
 * Publishes a survey by setting active to true
 */
export async function publishSurvey(surveyId: string, baseUrl?: string, token?: string): Promise<boolean> {
    return updateSurveyActive(surveyId, true, baseUrl, token);
}

/**
 * Unpublishes a survey by setting active to false
 */
export async function unpublishSurvey(surveyId: string, baseUrl?: string, token?: string): Promise<boolean> {
    return updateSurveyActive(surveyId, false, baseUrl, token);
}