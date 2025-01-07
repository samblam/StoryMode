// src/utils/surveyExport.ts

import type { SurveyResponse, SoundMatch } from '../types/database';

interface CSVOptions {
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
  delimiter?: string;
}

interface PDFOptions {
  includeCharts?: boolean;
  includeAnalytics?: boolean;
  template?: 'default' | 'detailed' | 'summary';
}

interface ExportValidation {
  isValid: boolean;
  errors: string[];
}

// Helper function to sanitize CSV values
function sanitizeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
}

// Helper function to format timestamps
function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function generateCSV(responses: SurveyResponse[], options: CSVOptions = {}): string {
  const {
    includeTimestamps = true,
    includeMetadata = true,
    delimiter = ','
  } = options;

  // Define headers based on options
  const headers = [
    'Response ID',
    'Survey ID',
    includeTimestamps ? 'Timestamp' : null,
    'Status',
    'Success Rate',
    'Time Taken (ms)',
    'Chosen Sound',
    'Expected Sound',
    'Is Correct',
    includeMetadata ? 'Additional Notes' : null,
  ].filter(Boolean);

  // Start with headers
  const csvRows = [headers.join(delimiter)];

  // Process each response
  responses.forEach(response => {
    const soundMatches = response.sound_matches || [];
    
    // Handle each sound match as a separate row
    soundMatches.forEach((match: SoundMatch) => {
      const row = [
        sanitizeCSVValue(response.id),
        sanitizeCSVValue(response.survey_id),
        includeTimestamps ? sanitizeCSVValue(formatTimestamp(response.created_at)) : null,
        sanitizeCSVValue(response.status),
        sanitizeCSVValue(response.success_rate),
        sanitizeCSVValue(response.time_taken),
        sanitizeCSVValue(match.sound_id),
        sanitizeCSVValue(match.function_id),
        sanitizeCSVValue(match.is_correct),
        includeMetadata ? sanitizeCSVValue(response.status === 'completed' ? 'Complete response' : 'Incomplete response') : null,
      ].filter(Boolean);

      csvRows.push(row.join(delimiter));
    });
  });

  return csvRows.join('\n');
}

export async function createPDFReport(responses: SurveyResponse[], options: PDFOptions = {}): Promise<string> {
  const {
    includeCharts = true,
    includeAnalytics = true,
    template = 'default'
  } = options;

  // Generate report content based on template
  const content = [];

  // Add header
  content.push('Survey Results Report');
  content.push(`Generated on: ${new Date().toLocaleString()}`);
  content.push('---');

  // Add summary statistics
  const totalResponses = responses.length;
  const completedResponses = responses.filter(r => r.status === 'completed').length;
  const averageSuccessRate = responses.reduce((acc, r) => acc + (r.success_rate || 0), 0) / totalResponses;

  content.push('Summary Statistics:');
  content.push(`Total Responses: ${totalResponses}`);
  content.push(`Completion Rate: ${((completedResponses / totalResponses) * 100).toFixed(2)}%`);
  content.push(`Average Success Rate: ${(averageSuccessRate * 100).toFixed(2)}%`);

  if (includeAnalytics) {
    content.push('\nDetailed Analytics:');
    // Add response time distribution
    const times = responses.map(r => r.time_taken || 0);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    content.push(`Average Response Time: ${avgTime.toFixed(2)}ms`);
    
    // Add success rate distribution
    const successRates = responses.map(r => r.success_rate || 0);
    const successDistribution = {
      high: successRates.filter(r => r >= 0.8).length,
      medium: successRates.filter(r => r >= 0.5 && r < 0.8).length,
      low: successRates.filter(r => r < 0.5).length,
    };
    content.push('\nSuccess Rate Distribution:');
    content.push(`High (>80%): ${successDistribution.high}`);
    content.push(`Medium (50-80%): ${successDistribution.medium}`);
    content.push(`Low (<50%): ${successDistribution.low}`);
  }

  if (includeCharts) {
    content.push('\n[Chart placeholders would be inserted here]');
    // Note: Actual chart generation would require a PDF generation library
  }

  // Return formatted content
  return content.join('\n');
}

export function anonymizeData(responses: SurveyResponse[]): SurveyResponse[] {
  const anonymousPrefix = 'ANON_';
  let participantCounter = 1;
  const participantMap = new Map<string, string>();

  return responses.map(response => {
    // Generate consistent anonymous ID for each participant
    if (!participantMap.has(response.participant_id)) {
      participantMap.set(
        response.participant_id,
        `${anonymousPrefix}${participantCounter++}`
      );
    }

    // Create anonymized copy of response
    return {
      ...response,
      participant_id: participantMap.get(response.participant_id)!,
      // Remove or obscure any other identifying information
      created_at: response.created_at.split('T')[0], // Keep only the date
    };
  });
}

export function validateFormat(responses: SurveyResponse[]): ExportValidation {
  const validation: ExportValidation = {
    isValid: true,
    errors: [],
  };

  // Check for empty dataset
  if (responses.length === 0) {
    validation.errors.push('No responses to export');
    validation.isValid = false;
    return validation;
  }

  // Validate each response
  responses.forEach((response, index) => {
    // Check required fields
    if (!response.id) {
      validation.errors.push(`Response at index ${index} missing ID`);
      validation.isValid = false;
    }

    if (!response.survey_id) {
      validation.errors.push(`Response at index ${index} missing survey ID`);
      validation.isValid = false;
    }

    if (!response.participant_id) {
      validation.errors.push(`Response at index ${index} missing participant ID`);
      validation.isValid = false;
    }

    // Validate status
    if (!['started', 'completed', 'abandoned'].includes(response.status)) {
      validation.errors.push(`Response at index ${index} has invalid status: ${response.status}`);
      validation.isValid = false;
    }

    // Validate numeric fields
    if (response.success_rate !== null && (response.success_rate < 0 || response.success_rate > 1)) {
      validation.errors.push(`Response at index ${index} has invalid success rate`);
      validation.isValid = false;
    }

    if (response.time_taken !== null && response.time_taken < 0) {
      validation.errors.push(`Response at index ${index} has invalid time taken`);
      validation.isValid = false;
    }

    // Validate sound matches if present
    if (response.sound_matches) {
      response.sound_matches.forEach((match, matchIndex) => {
        if (!match.sound_id || !match.function_id) {
          validation.errors.push(
            `Response at index ${index}, sound match ${matchIndex} has missing required fields`
          );
          validation.isValid = false;
        }
      });
    }
  });

  return validation;
}