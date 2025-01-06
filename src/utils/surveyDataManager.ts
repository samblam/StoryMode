import { getSurveyState, setSubmitting } from './surveyStateManager';
import type { Database } from '../types/database';

interface Match {
    soundId: string;
    functionId: string;
}

export type SurveyWithRelations = Database['public']['Tables']['surveys']['Row'] & {
    sounds: Database['public']['Tables']['sounds']['Row'][];
    client?: Database['public']['Tables']['clients']['Row'] | null;
};

/**
 * Fetches survey data by ID with related data
 * @param id - Survey ID
 * @returns Promise<SurveyWithRelations | null>
 */
export async function getSurveyById(id: string): Promise<SurveyWithRelations | null> {
    try {
        const response = await fetch(`/api/surveys/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching survey:', error);
        return null;
    }
}

export async function submitSurveyResponses(surveyId: string, matches: Match[]): Promise<boolean> {
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
        const response = await fetch(`/api/surveys/${surveyId}/responses`, {
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
export async function saveSurveyData(data: Record<string, any>): Promise<boolean> {
    try {
        const response = await fetch(`/api/surveys/${data.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
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
 * Updates survey status
 */
export async function updateSurveyStatus(surveyId: string, status: SurveyStatus): Promise<boolean> {
    try {
        const response = await fetch(`/api/surveys/${surveyId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(`Error updating survey status to ${status}:`, error);
        throw error;
    }
}

/**
 * Updates survey status to active (published)
 */
export async function publishSurvey(surveyId: string): Promise<boolean> {
    return updateSurveyStatus(surveyId, 'active');
}

/**
 * Updates survey status to draft (unpublished)
 */
export async function unpublishSurvey(surveyId: string): Promise<boolean> {
    return updateSurveyStatus(surveyId, 'draft');
}

/**
 * Updates survey status to completed
 */
export async function completeSurvey(surveyId: string): Promise<boolean> {
    return updateSurveyStatus(surveyId, 'completed');
}