import { getClient } from '../lib/supabase';
import type { Survey } from '../types/database';

/**
 * Options for exporting survey data
 */
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeParticipantInfo?: boolean;
  includeMetadata?: boolean;
  anonymize?: boolean;
  excludeFields?: string[];
  includeTimestamps?: boolean;
  filterByStatus?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'csv',
  includeParticipantInfo: true,
  includeMetadata: true,
  anonymize: false,
  includeTimestamps: true,
  filterByStatus: ['completed'],
  sortBy: 'created_at',
  sortDirection: 'desc'
};

/**
 * Fetches survey data for export
 * @param surveyId The ID of the survey
 * @param options Export options
 * @returns The survey data and metadata
 */
export async function fetchSurveyDataForExport(
  surveyId: string,
  options: Partial<ExportOptions> = {}
): Promise<{ survey: Survey; responses: any[]; participants: any[] }> {
  const supabase = getClient({ requiresAdmin: true });
  
  // Merge with default options
  const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  // Fetch survey details
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single();
    
  if (surveyError) {
    throw new Error(`Failed to fetch survey: ${surveyError.message}`);
  }
  
  if (!survey) {
    throw new Error('Survey not found');
  }
  
  // Build query for responses
  let responseQuery = supabase
    .from('survey_responses')
    .select(`
      *,
      participant:participant_id (
        id,
        email,
        name,
        participant_identifier,
        status,
        created_at
      )
    `)
    .eq('survey_id', surveyId);
    
  // Apply filters if specified
  if (mergedOptions.filterByStatus && mergedOptions.filterByStatus.length > 0) {
    responseQuery = responseQuery.in('status', mergedOptions.filterByStatus);
  }
  
  // Apply sorting
  if (mergedOptions.sortBy) {
    responseQuery = responseQuery.order(mergedOptions.sortBy, { 
      ascending: mergedOptions.sortDirection === 'asc' 
    });
  }
  
  // Fetch responses
  const { data: responses, error: responsesError } = await responseQuery;
  
  if (responsesError) {
    throw new Error(`Failed to fetch responses: ${responsesError.message}`);
  }
  
  // Fetch participants
  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select('*')
    .eq('survey_id', surveyId);
    
  if (participantsError) {
    throw new Error(`Failed to fetch participants: ${participantsError.message}`);
  }
  
  return { survey, responses: responses || [], participants: participants || [] };
}

/**
 * Processes survey data for export based on options
 * @param data The raw survey data
 * @param options Export options
 * @returns Processed data ready for export
 */
export function processSurveyData(
  data: { survey: Survey; responses: any[]; participants: any[] },
  options: Partial<ExportOptions> = {}
): any[] {
  const { survey, responses } = data;
  const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  // Process each response
  const processedData = responses.map(response => {
    const result: Record<string, any> = {
      response_id: response.id,
      survey_id: survey.id,
      survey_title: survey.title,
    };
    
    // Add participant info if requested
    if (mergedOptions.includeParticipantInfo && response.participant) {
      if (mergedOptions.anonymize) {
        // Include only anonymized participant info
        result.participant_id = response.participant.id;
      } else {
        // Include full participant info
        result.participant_id = response.participant.id;
        result.participant_email = response.participant.email;
        result.participant_name = response.participant.name;
      }
    }
    
    // Add response data
    if (response.responses) {
      if (typeof response.responses === 'object') {
        Object.entries(response.responses).forEach(([key, value]) => {
          result[`response_${key}`] = value;
        });
      } else {
        result.responses = response.responses;
      }
    }
    
    // Add sound mapping data if available
    if (response.sound_mapping_responses) {
      if (typeof response.sound_mapping_responses === 'object') {
        Object.entries(response.sound_mapping_responses).forEach(([key, value]) => {
          result[`sound_mapping_${key}`] = value;
        });
      } else {
        result.sound_mapping_responses = response.sound_mapping_responses;
      }
    }
    
    // Add timestamps if requested
    if (mergedOptions.includeTimestamps) {
      result.created_at = response.created_at;
      result.updated_at = response.updated_at;
      result.completed_at = response.completed_at;
    }
    
    // Add metadata if requested
    if (mergedOptions.includeMetadata) {
      result.status = response.status;
      result.completion_time = response.completion_time;
      result.browser_info = response.browser_info;
    }
    
    return result;
  });
  
  // Filter out excluded fields
  if (mergedOptions.excludeFields && mergedOptions.excludeFields.length > 0) {
    return processedData.map(item => {
      const filteredItem: Record<string, any> = {};
      Object.entries(item).forEach(([key, value]) => {
        if (!mergedOptions.excludeFields?.includes(key)) {
          filteredItem[key] = value;
        }
      });
      return filteredItem;
    });
  }
  
  return processedData;
}

/**
 * Converts data to CSV format
 * @param data The data to convert
 * @param options Export options
 * @returns CSV string
 */
export function convertToCSV(data: any[], options: Partial<ExportOptions> = {}): string {
  if (!data || data.length === 0) return '';
  
  // Get all possible headers from all objects
  const allHeaders = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allHeaders.add(key));
  });
  
  // Filter headers based on options
  let headers = Array.from(allHeaders);
  if (options.excludeFields?.length) {
    headers = headers.filter(h => !options.excludeFields?.includes(h));
  }
  
  // Create header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle different value types
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return value;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
}

/**
 * Converts data to JSON format
 * @param data The data to convert
 * @returns JSON string
 */
export function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Generates a summary of survey responses
 * @param data The survey data
 * @returns Summary object
 */
export function generateSurveySummary(data: { 
  survey: Survey; 
  responses: any[]; 
  participants: any[] 
}): Record<string, any> {
  const { survey, responses, participants } = data;
  
  // Calculate completion rate
  const completedResponses = responses.filter(r => r.status === 'completed').length;
  const completionRate = participants.length > 0 
    ? (completedResponses / participants.length) * 100 
    : 0;
  
  // Calculate average completion time
  const completionTimes = responses
    .filter(r => r.completion_time && r.completion_time > 0)
    .map(r => r.completion_time);
    
  const averageCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0;
  
  // Count responses by status
  const responsesByStatus: Record<string, number> = {};
  responses.forEach(response => {
    const status = response.status || 'unknown';
    responsesByStatus[status] = (responsesByStatus[status] || 0) + 1;
  });
  
  // Count participants by status
  const participantsByStatus: Record<string, number> = {};
  participants.forEach(participant => {
    const status = participant.status || 'unknown';
    participantsByStatus[status] = (participantsByStatus[status] || 0) + 1;
  });
  
  return {
    survey_id: survey.id,
    survey_title: survey.title,
    total_participants: participants.length,
    total_responses: responses.length,
    completed_responses: completedResponses,
    completion_rate: completionRate.toFixed(2) + '%',
    average_completion_time: averageCompletionTime.toFixed(2) + ' seconds',
    responses_by_status: responsesByStatus,
    participants_by_status: participantsByStatus,
    created_at: survey.created_at,
    updated_at: survey.updated_at,
    published_at: survey.published_at,
    generated_at: new Date().toISOString()
  };
}

/**
 * Exports survey data in the specified format
 * @param surveyId The ID of the survey
 * @param options Export options
 * @returns The exported data and content type
 */
export async function exportSurveyData(
  surveyId: string,
  options: Partial<ExportOptions> = {}
): Promise<{ data: string; contentType: string; filename: string }> {
  // Merge with default options
  const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  // Fetch and process data
  const rawData = await fetchSurveyDataForExport(surveyId, mergedOptions);
  const processedData = processSurveyData(rawData, mergedOptions);
  
  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const surveySlug = rawData.survey.title
    ? rawData.survey.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    : surveyId;
  
  let data: string;
  let contentType: string;
  let filename: string;
  
  // Export in the requested format
  switch (mergedOptions.format) {
    case 'json':
      data = convertToJSON(processedData);
      contentType = 'application/json';
      filename = `survey-${surveySlug}-${timestamp}.json`;
      break;
      
    case 'pdf':
      // PDF generation would typically be handled by a library like pdfkit
      // For now, we'll return JSON with a note
      data = JSON.stringify({
        note: 'PDF generation requires server-side libraries. This is a placeholder.',
        summary: generateSurveySummary(rawData),
        data: processedData
      }, null, 2);
      contentType = 'application/json';
      filename = `survey-${surveySlug}-${timestamp}.json`;
      break;
      
    case 'csv':
    default:
      data = convertToCSV(processedData, mergedOptions);
      contentType = 'text/csv';
      filename = `survey-${surveySlug}-${timestamp}.csv`;
      break;
  }
  
  return { data, contentType, filename };
}