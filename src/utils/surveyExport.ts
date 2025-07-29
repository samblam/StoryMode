import { getClient } from '../lib/supabase';
import type { Survey } from '../types/database';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    responseQuery = responseQuery.in('participant_id.status', mergedOptions.filterByStatus); // Filter on participant status
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
 * Helper function to generate hash code for strings (for anonymization)
 */
function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Processes individual response data for streaming export
 * @param responses Array of response data
 * @param options Export options
 * @returns Processed response data
 */
function processResponseData(responses: any[], options: Partial<ExportOptions> = {}): any[] {
  const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  return responses.map(response => {
    const result: Record<string, any> = {
      response_id: response.id,
      survey_id: response.survey_id,
      participant_id: response.participant_id,
      status: response.status,
      success_rate: response.success_rate,
      time_taken: response.time_taken,
      created_at: response.created_at
    };
    
    // Add participant info if requested and available
    if (mergedOptions.includeParticipantInfo && response.participants) {
      if (mergedOptions.anonymize) {
        result.participant_identifier = hashCode(response.participants.email || '').toString().slice(0, 8);
      } else {
        result.participant_email = response.participants.email;
        result.participant_name = response.participants.name;
        result.participant_identifier = response.participants.participant_identifier;
      }
    }
    
    // Add sound matches if available
    if (response.sound_matches && response.sound_matches.length > 0) {
      result.total_matches = response.sound_matches.length;
      result.correct_matches = response.sound_matches.filter((m: any) => m.is_correct).length;
      result.accuracy = result.correct_matches / result.total_matches;
      
      // Add individual match details if not anonymizing
      if (!mergedOptions.anonymize) {
        response.sound_matches.forEach((match: any, index: number) => {
          result[`match_${index + 1}_sound_id`] = match.sound_id;
          result[`match_${index + 1}_function_id`] = match.function_id;
          result[`match_${index + 1}_correct`] = match.is_correct;
        });
      }
    }
    
    // Filter out excluded fields
    if (mergedOptions.excludeFields && mergedOptions.excludeFields.length > 0) {
      mergedOptions.excludeFields.forEach(field => {
        delete result[field];
      });
    }
    
    return result;
  });
}

/**
 * Converts data to PDF format with charts and tables
 * @param data The processed data to convert
 * @param rawData The raw survey data for summary
 * @param options Export options
 * @returns PDF buffer as Uint8Array
 */
export async function convertToPDF(data: any[], rawData: any, options: Partial<ExportOptions> = {}): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * (fontSize * 0.35); // Approximate line height
  };

  try {
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Survey Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Survey Information
    if (rawData.survey) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Survey Information', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      const surveyInfo = [
        ['Survey Title', rawData.survey.title || 'Untitled Survey'],
        ['Survey ID', rawData.survey.id || 'N/A'],
        ['Status', rawData.survey.status || 'Unknown'],
        ['Generated', new Date().toLocaleString()]
      ];

      surveyInfo.forEach(([label, value]) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
    }

    // Summary Statistics
    if (data && data.length > 0) {
      checkPageBreak(60);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 15;

      // Calculate summary stats
      const totalResponses = data.length;
      const completedResponses = data.filter(r => r.status === 'completed').length;
      const averageSuccessRate = data.reduce((acc, r) => acc + (r.success_rate || 0), 0) / totalResponses;
      const averageTimeSpent = data.reduce((acc, r) => acc + (r.time_taken || 0), 0) / totalResponses;

      const summaryData = [
        ['Total Responses', totalResponses.toString()],
        ['Completed Responses', completedResponses.toString()],
        ['Completion Rate', `${Math.round((completedResponses / totalResponses) * 100)}%`],
        ['Average Success Rate', `${Math.round(averageSuccessRate * 100)}%`],
        ['Average Time Spent', `${Math.round(averageTimeSpent / 1000)} seconds`]
      ];

      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244] },
        margin: { left: 20, right: 20 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Response Data Table
    if (data && data.length > 0) {
      checkPageBreak(100);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Response Data', 20, yPosition);
      yPosition += 15;

      // Prepare table data
      const tableHeaders = Object.keys(data[0]).filter(key => {
        if (options.excludeFields?.includes(key)) return false;
        if (!options.includeParticipantInfo && ['participant_id', 'email', 'name'].includes(key)) return false;
        if (!options.includeTimestamps && ['created_at', 'updated_at'].includes(key)) return false;
        return true;
      });

      const tableData = data.slice(0, 50).map(row => { // Limit to first 50 rows for PDF
        return tableHeaders.map(header => {
          let value = row[header];
          
          // Handle anonymization
          if (options.anonymize) {
            if (['email', 'name'].includes(header)) {
              value = '[REDACTED]';
            } else if (header === 'participant_id') {
              value = `P${hashCode(value?.toString() || '').toString().slice(0, 4)}`;
            }
          }
          
          // Format values for display
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '...';
          if (typeof value === 'string' && value.length > 30) return value.slice(0, 30) + '...';
          if (typeof value === 'number') return value.toFixed(2);
          return value.toString();
        });
      });

      // Add note if data was truncated
      if (data.length > 50) {
        checkPageBreak(15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`Note: Showing first 50 of ${data.length} responses. Download CSV/JSON for complete data.`, 20, yPosition);
        yPosition += 10;
      }

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: [66, 133, 244] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: tableHeaders.reduce((acc, header, index) => {
          acc[index] = { cellWidth: 'auto' };
          return acc;
        }, {} as any)
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Footer with generation info
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated by StoryMode Analytics - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    return doc.output('datauristring');

  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Fallback: Create a simple error PDF
    const errorDoc = new jsPDF();
    errorDoc.setFontSize(16);
    errorDoc.text('PDF Generation Error', 20, 30);
    errorDoc.setFontSize(12);
    errorDoc.text('An error occurred while generating the PDF report.', 20, 50);
    errorDoc.text('Please try exporting as CSV or JSON format.', 20, 70);
    errorDoc.text(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 20, 90);
    
    return errorDoc.output('datauristring');
  }
}

/**
 * Streaming export for large datasets
 * @param surveyId The survey ID
 * @param options Export options
 * @param onProgress Progress callback function
 * @returns AsyncGenerator that yields data chunks
 */
export async function* streamExportSurveyData(
  surveyId: string,
  options: Partial<ExportOptions> = {},
  onProgress?: (processed: number, total: number) => void
): AsyncGenerator<string, void, unknown> {
  const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const supabase = getClient({ requiresAdmin: true });
  
  // Get total count first
  const { count: totalCount, error: countError } = await supabase
    .from('survey_responses')
    .select('*', { count: 'exact', head: true })
    .eq('survey_id', surveyId)
    .in('status', mergedOptions.filterByStatus || ['completed']);

  if (countError) {
    throw new Error(`Failed to get response count: ${countError.message}`);
  }

  const total = totalCount || 0;
  const chunkSize = 1000; // Process 1000 records at a time
  let processed = 0;

  // Yield header for CSV format
  if (mergedOptions.format === 'csv') {
    // Get first record to determine headers
    const { data: sampleData, error: sampleError } = await supabase
      .from('survey_responses')
      .select(`
        *,
        participants!inner(email, name, participant_identifier)
      `)
      .eq('survey_id', surveyId)
      .in('status', mergedOptions.filterByStatus || ['completed'])
      .limit(1);

    if (!sampleError && sampleData && sampleData.length > 0) {
      const processedSample = processResponseData([sampleData[0]], mergedOptions);
      if (processedSample.length > 0) {
        const headers = Object.keys(processedSample[0]);
        const filteredHeaders = headers.filter(h => !mergedOptions.excludeFields?.includes(h));
        yield filteredHeaders.join(',') + '\n';
      }
    }
  }

  // Yield opening bracket for JSON format
  if (mergedOptions.format === 'json') {
    yield '[\n';
  }

  // Process data in chunks
  for (let offset = 0; offset < total; offset += chunkSize) {
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select(`
        *,
        participants!inner(email, name, participant_identifier)
      `)
      .eq('survey_id', surveyId)
      .in('status', mergedOptions.filterByStatus || ['completed'])
      .order(mergedOptions.sortBy || 'created_at', {
        ascending: mergedOptions.sortDirection === 'asc'
      })
      .range(offset, offset + chunkSize - 1);

    if (error) {
      throw new Error(`Failed to fetch responses: ${error.message}`);
    }

    if (!responses || responses.length === 0) {
      break;
    }

    // Process the chunk
    const processedChunk = processResponseData(responses, mergedOptions);
    
    // Yield processed data based on format
    switch (mergedOptions.format) {
      case 'csv':
        for (const row of processedChunk) {
          const values = Object.values(row).map(value => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            return value;
          });
          yield values.join(',') + '\n';
        }
        break;

      case 'json':
        for (let i = 0; i < processedChunk.length; i++) {
          const isLast = offset + i === total - 1;
          const comma = isLast ? '' : ',';
          yield `  ${JSON.stringify(processedChunk[i])}${comma}\n`;
        }
        break;

      default:
        // For other formats, yield as JSON
        yield JSON.stringify(processedChunk) + '\n';
        break;
    }

    processed += responses.length;
    onProgress?.(processed, total);

    // Small delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Yield closing bracket for JSON format
  if (mergedOptions.format === 'json') {
    yield ']\n';
  }
}

/**
 * Enhanced export function that automatically uses streaming for large datasets
 * @param surveyId The survey ID
 * @param options Export options
 * @returns Export result with data, content type, and filename
 */
export async function exportSurveyDataEnhanced(
  surveyId: string,
  options: Partial<ExportOptions> = {}
): Promise<{ data: string; contentType: string; filename: string; isStreaming?: boolean }> {
  const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const supabase = getClient({ requiresAdmin: true });
  
  // Check dataset size
  const { count: totalCount } = await supabase
    .from('survey_responses')
    .select('*', { count: 'exact', head: true })
    .eq('survey_id', surveyId)
    .in('status', mergedOptions.filterByStatus || ['completed']);

  const total = totalCount || 0;
  const STREAMING_THRESHOLD = 5000;

  // Use streaming for large datasets
  if (total > STREAMING_THRESHOLD && mergedOptions.format !== 'pdf') {
    let data = '';
    let processed = 0;
    
    for await (const chunk of streamExportSurveyData(surveyId, options, (p, t) => {
      processed = p;
      console.log(`Export progress: ${p}/${t} (${Math.round((p/t)*100)}%)`);
    })) {
      data += chunk;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const surveySlug = surveyId.slice(0, 8);
    
    let contentType: string;
    let filename: string;
    
    switch (mergedOptions.format) {
      case 'json':
        contentType = 'application/json';
        filename = `survey-${surveySlug}-${timestamp}.json`;
        break;
      case 'csv':
      default:
        contentType = 'text/csv';
        filename = `survey-${surveySlug}-${timestamp}.csv`;
        break;
    }

    return { data, contentType, filename, isStreaming: true };
  }

  // Use regular export for smaller datasets
  return exportSurveyData(surveyId, options);
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
 * Validates if the data is in the correct format for export
 * @param data The data to validate
 * @returns Validation result with isValid flag and any errors
 */
export function validateFormat(data: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if data exists
  if (!data || data.length === 0) {
    errors.push('No data available for export');
    return { isValid: false, errors };
  }
  
  // Check if data has exportable properties
  const hasExportableProperties = data.some(item => Object.keys(item).length > 0);
  if (!hasExportableProperties) {
    errors.push('Data contains no exportable properties');
  }
  
  // Check for required fields in responses
  const missingFields = data.some(item => {
    return !item.id || !item.survey_id || item.status === undefined;
  });
  
  if (missingFields) {
    errors.push('Some responses are missing required fields');
  }
  
  return {
    isValid: errors.length === 0,
    errors
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
      data = await convertToPDF(processedData, rawData, mergedOptions);
      contentType = 'application/pdf';
      filename = `survey-${surveySlug}-${timestamp}.pdf`;
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