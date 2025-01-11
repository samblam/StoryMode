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
                            // Extract path and ensure proper bucket name
                            const storagePath = surveySound.sounds.storage_path;
                            surveySound.sounds.url = await getSignedUrl(storagePath, 'sounds');
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

/**
 * Saves survey data including title, description, client, sounds, and video
 */
export async function saveSurveyData(data: Record<string, any>, baseUrl?: string, token?: string): Promise<boolean> {
    try {
        // Log the incoming data
        console.log('saveSurveyData: Incoming data:', data);

        // Validate required fields
        if (!data.id) {
            throw new Error('Survey ID is required');
        }

        // Clean and prepare the data, only including fields that exist in the database
        const cleanData = {
            id: data.id,
            title: data.title?.trim() || '',
            description: data.description ? String(data.description).trim() : null,
            client_id: data.client_id || null,
            sound_profile_id: data.sound_profile_id || null,
            video_url: data.video_url || null,
            functions: Array.isArray(data.functions) ? data.functions : null,
            // Only include boolean fields if they're explicitly set
            ...(typeof data.active === 'boolean' && { active: data.active }),
            ...(typeof data.approved === 'boolean' && { approved: data.approved }),
            ...(typeof data.visible_to_client === 'boolean' && { visible_to_client: data.visible_to_client })
        };

        // Validate required fields
        if (!cleanData.title) {
            throw new Error('Title is required and must be a non-empty string');
        }

        console.log('saveSurveyData: Cleaned data:', cleanData);

        const url = baseUrl ? `${baseUrl}/api/surveys/${data.id}` : `/api/surveys/${data.id}`;
        console.log('saveSurveyData: Request URL:', url);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(cleanData),
            credentials: 'include'
        });

        // Log the response status
        console.log('saveSurveyData: Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('saveSurveyData: Error response:', errorData);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('saveSurveyData: Success response:', responseData);

        return true;
    } catch (error) {
        console.error('Error saving survey:', error);
        throw error;
    }
}

/**
 * Updates survey active state
 */
export async function updateSurveyActive(surveyId: string, active: boolean, baseUrl?: string, token?: string): Promise<boolean> {
    try {
        // Log the update attempt
        console.log('updateSurveyActive:', { surveyId, active });

        const url = baseUrl ? `${baseUrl}/api/surveys/${surveyId}` : `/api/surveys/${surveyId}`;
        console.log('updateSurveyActive: Request URL:', url);

        // For status updates, we only send the active field
        const updateData = {
            active: active
        };

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(updateData),
            credentials: 'include'
        });

        // Log the response status
        console.log('updateSurveyActive: Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('updateSurveyActive: Error response:', errorData);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('updateSurveyActive: Success response:', responseData);

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