import type { APIRoute } from 'astro';
import { getClient } from '../../../../lib/supabase';
import { verifyAuthorization } from '../../../../utils/accessControl';
import type { ExportOptions } from '../../../../utils/surveyExport';

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  estimatedSize?: string;
  estimatedTime?: string;
  recordCount?: number;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const surveyId = params.id;
    if (!surveyId) {
      return new Response(JSON.stringify({ 
        error: 'Survey ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify admin authorization
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'read');
    if (!authorized) {
      return new Response(JSON.stringify({ 
        error: authError 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse export options from request body
    const body = await request.json();
    const options: ExportOptions = {
      format: body.format || 'csv',
      includeParticipantInfo: body.includeParticipantInfo !== false,
      includeMetadata: body.includeMetadata !== false,
      anonymize: body.anonymize === true,
      includeTimestamps: body.includeTimestamps !== false,
      filterByStatus: body.filterByStatus || ['completed'],
      sortBy: body.sortBy || 'created_at',
      sortDirection: body.sortDirection || 'desc',
      excludeFields: body.excludeFields || []
    };

    // Ensure required fields have proper defaults for type safety
    const filterByStatus = options.filterByStatus || ['completed'];
    const sortBy = options.sortBy || 'created_at';
    const sortDirection = options.sortDirection || 'desc';
    const excludeFields = options.excludeFields || [];

    // Initialize validation result
    const validation: ValidationResult = {
      valid: true,
      warnings: [],
      errors: []
    };

    // Get survey data for validation
    const supabase = getClient({ requiresAdmin: true });
    
    // Check if survey exists
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title, status')
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      validation.valid = false;
      validation.errors.push('Survey not found or access denied');
      return new Response(JSON.stringify(validation), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get response count for size estimation
    const { count: responseCount, error: countError } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId)
      .in('status', filterByStatus);

    if (countError) {
      validation.warnings.push('Could not determine response count for size estimation');
    } else {
      validation.recordCount = responseCount || 0;
    }

    // Validate format
    const supportedFormats = ['csv', 'json', 'pdf'];
    if (!supportedFormats.includes(options.format)) {
      validation.valid = false;
      validation.errors.push(`Unsupported format: ${options.format}. Supported formats: ${supportedFormats.join(', ')}`);
    }

    // Validate filter status values
    const validStatuses = ['started', 'completed', 'abandoned'];
    const invalidStatuses = filterByStatus.filter(status => !validStatuses.includes(status));
    if (invalidStatuses.length > 0) {
      validation.valid = false;
      validation.errors.push(`Invalid status filters: ${invalidStatuses.join(', ')}. Valid statuses: ${validStatuses.join(', ')}`);
    }

    // Validate sort options
    const validSortFields = ['created_at', 'status', 'success_rate', 'time_taken'];
    if (!validSortFields.includes(sortBy)) {
      validation.valid = false;
      validation.errors.push(`Invalid sort field: ${sortBy}. Valid fields: ${validSortFields.join(', ')}`);
    }

    const validSortDirections = ['asc', 'desc'];
    if (!validSortDirections.includes(sortDirection)) {
      validation.valid = false;
      validation.errors.push(`Invalid sort direction: ${sortDirection}. Valid directions: ${validSortDirections.join(', ')}`);
    }

    // Size and performance warnings
    if (validation.recordCount !== undefined) {
      // Estimate file size based on format and options
      let estimatedSizeKB = 0;
      const baseRecordSize = options.includeParticipantInfo ? 2 : 1; // KB per record estimate

      switch (options.format) {
        case 'csv':
          estimatedSizeKB = validation.recordCount * baseRecordSize;
          break;
        case 'json':
          estimatedSizeKB = validation.recordCount * baseRecordSize * 1.5; // JSON is typically larger
          break;
        case 'pdf':
          estimatedSizeKB = validation.recordCount * baseRecordSize * 2; // PDF with formatting
          break;
      }

      // Format size estimate
      if (estimatedSizeKB < 1024) {
        validation.estimatedSize = `${Math.round(estimatedSizeKB)} KB`;
      } else {
        validation.estimatedSize = `${Math.round(estimatedSizeKB / 1024 * 100) / 100} MB`;
      }

      // Estimate processing time (rough approximation)
      const estimatedSeconds = Math.max(1, Math.ceil(validation.recordCount / 1000));
      validation.estimatedTime = estimatedSeconds < 60 
        ? `${estimatedSeconds} seconds`
        : `${Math.ceil(estimatedSeconds / 60)} minutes`;

      // Performance warnings
      if (validation.recordCount > 10000) {
        validation.warnings.push('Large dataset detected. Export may take several minutes to complete.');
      }

      if (validation.recordCount > 50000) {
        validation.warnings.push('Very large dataset. Consider using filters to reduce export size.');
      }

      if (estimatedSizeKB > 50 * 1024) { // 50MB
        validation.warnings.push('Export file will be very large. Consider excluding unnecessary fields.');
      }

      // No data warning
      if (validation.recordCount === 0) {
        validation.warnings.push('No data matches the specified filters. Export will be empty.');
      }
    }

    // Format-specific validations
    if (options.format === 'pdf') {
      if (validation.recordCount && validation.recordCount > 5000) {
        validation.warnings.push('PDF export with large datasets may have formatting issues. Consider using CSV or JSON for large exports.');
      }
    }

    // Anonymization warnings
    if (options.anonymize && options.includeParticipantInfo) {
      validation.warnings.push('Anonymization is enabled but participant info is included. Some fields will be redacted.');
    }

    // Field exclusion validation
    if (excludeFields.length > 0) {
      const validFields = ['participant_id', 'email', 'name', 'created_at', 'time_taken', 'success_rate'];
      const invalidFields = excludeFields.filter(field => !validFields.includes(field));
      if (invalidFields.length > 0) {
        validation.warnings.push(`Unknown fields in exclusion list: ${invalidFields.join(', ')}`);
      }
    }

    // Survey status warnings
    if (survey.status === 'draft') {
      validation.warnings.push('Survey is in draft status. Data may be incomplete.');
    }

    return new Response(JSON.stringify(validation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Export validation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during validation',
      valid: false,
      errors: ['Validation failed due to server error'],
      warnings: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};