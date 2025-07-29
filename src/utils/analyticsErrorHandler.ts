/**
 * Comprehensive error handling and user feedback system for analytics operations
 */

export interface AnalyticsError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestions?: string[];
}

export interface UserFeedback {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  details?: string;
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
}

export class AnalyticsErrorHandler {
  private static instance: AnalyticsErrorHandler;
  private errorLog: Array<{ timestamp: Date; error: AnalyticsError; context?: any }> = [];

  private constructor() {}

  static getInstance(): AnalyticsErrorHandler {
    if (!AnalyticsErrorHandler.instance) {
      AnalyticsErrorHandler.instance = new AnalyticsErrorHandler();
    }
    return AnalyticsErrorHandler.instance;
  }

  /**
   * Handle and categorize analytics errors
   */
  handleError(error: any, context?: any): AnalyticsError {
    let analyticsError: AnalyticsError;

    // Categorize different types of errors
    if (error.name === 'TypeError' && error.message.includes('Cannot read property')) {
      analyticsError = {
        code: 'DATA_STRUCTURE_ERROR',
        message: error.message,
        userMessage: 'The survey data structure is incomplete. Some analytics may not display correctly.',
        severity: 'medium',
        recoverable: true,
        suggestions: [
          'Check if the survey has completed responses',
          'Verify that sound matches are properly recorded',
          'Try refreshing the page to reload data'
        ]
      };
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      analyticsError = {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Unable to load analytics data due to network issues.',
        severity: 'high',
        recoverable: true,
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the issue persists'
        ]
      };
    } else if (error.message?.includes('timeout')) {
      analyticsError = {
        code: 'TIMEOUT_ERROR',
        message: error.message,
        userMessage: 'Analytics processing is taking longer than expected.',
        severity: 'medium',
        recoverable: true,
        suggestions: [
          'The dataset may be large - please wait a moment',
          'Try using filters to reduce the data size',
          'Consider exporting data in smaller chunks'
        ]
      };
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      analyticsError = {
        code: 'PERMISSION_ERROR',
        message: error.message,
        userMessage: 'You do not have permission to access this analytics data.',
        severity: 'high',
        recoverable: false,
        suggestions: [
          'Contact your administrator for access',
          'Verify you are logged in with the correct account'
        ]
      };
    } else if (error.message?.includes('memory') || error.message?.includes('heap')) {
      analyticsError = {
        code: 'MEMORY_ERROR',
        message: error.message,
        userMessage: 'The dataset is too large to process in your browser.',
        severity: 'high',
        recoverable: true,
        suggestions: [
          'Try using filters to reduce the dataset size',
          'Use the export feature for large datasets',
          'Close other browser tabs to free up memory'
        ]
      };
    } else if (error.code === 'PGRST116' || error.message?.includes('row level security')) {
      analyticsError = {
        code: 'DATABASE_ACCESS_ERROR',
        message: error.message,
        userMessage: 'Unable to access survey data due to security restrictions.',
        severity: 'high',
        recoverable: false,
        suggestions: [
          'Verify you have access to this survey',
          'Contact support if you believe this is an error'
        ]
      };
    } else {
      analyticsError = {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        userMessage: 'An unexpected error occurred while processing analytics.',
        severity: 'medium',
        recoverable: true,
        suggestions: [
          'Try refreshing the page',
          'Check the browser console for more details',
          'Contact support if the issue persists'
        ]
      };
    }

    // Log the error
    this.logError(analyticsError, context);

    return analyticsError;
  }

  /**
   * Generate user-friendly feedback messages
   */
  generateUserFeedback(error: AnalyticsError): UserFeedback {
    const baseActions = [
      {
        label: 'Retry',
        action: 'retry',
        primary: true
      },
      {
        label: 'Report Issue',
        action: 'report'
      }
    ];

    switch (error.severity) {
      case 'critical':
        return {
          type: 'error',
          title: 'Critical Analytics Error',
          message: error.userMessage,
          details: error.suggestions?.join(' • '),
          actions: [
            {
              label: 'Contact Support',
              action: 'support',
              primary: true
            },
            ...baseActions
          ]
        };

      case 'high':
        return {
          type: 'error',
          title: 'Analytics Error',
          message: error.userMessage,
          details: error.suggestions?.join(' • '),
          actions: error.recoverable ? baseActions : [
            {
              label: 'Contact Support',
              action: 'support',
              primary: true
            }
          ]
        };

      case 'medium':
        return {
          type: 'warning',
          title: 'Analytics Warning',
          message: error.userMessage,
          details: error.suggestions?.join(' • '),
          actions: baseActions
        };

      case 'low':
        return {
          type: 'info',
          title: 'Analytics Notice',
          message: error.userMessage,
          details: error.suggestions?.join(' • '),
          actions: [
            {
              label: 'Dismiss',
              action: 'dismiss',
              primary: true
            }
          ]
        };

      default:
        return {
          type: 'error',
          title: 'Analytics Error',
          message: error.userMessage,
          actions: baseActions
        };
    }
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: AnalyticsError, context?: any): void {
    const logEntry = {
      timestamp: new Date(),
      error,
      context
    };

    this.errorLog.push(logEntry);

    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Console logging for development
    console.group(`🔍 Analytics Error [${error.severity.toUpperCase()}]`);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('User Message:', error.userMessage);
    if (context) {
      console.error('Context:', context);
    }
    if (error.suggestions) {
      console.info('Suggestions:', error.suggestions);
    }
    console.groupEnd();
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byCode: Record<string, number>;
    recent: Array<{ timestamp: Date; code: string; severity: string }>;
  } {
    const stats = {
      total: this.errorLog.length,
      bySeverity: {} as Record<string, number>,
      byCode: {} as Record<string, number>,
      recent: this.errorLog.slice(-10).map(entry => ({
        timestamp: entry.timestamp,
        code: entry.error.code,
        severity: entry.error.severity
      }))
    };

    this.errorLog.forEach(entry => {
      const { severity, code } = entry.error;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      stats.byCode[code] = (stats.byCode[code] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    console.log('Analytics error log cleared');
  }
}

/**
 * Wrapper function for safe analytics operations
 */
export async function safeAnalyticsOperation<T>(
  operation: () => Promise<T> | T,
  context?: any,
  fallbackValue?: T
): Promise<{ success: boolean; data?: T; error?: AnalyticsError; feedback?: UserFeedback }> {
  const errorHandler = AnalyticsErrorHandler.getInstance();

  try {
    const result = await Promise.resolve(operation());
    return {
      success: true,
      data: result
    };
  } catch (error) {
    const analyticsError = errorHandler.handleError(error, context);
    const feedback = errorHandler.generateUserFeedback(analyticsError);

    return {
      success: false,
      error: analyticsError,
      feedback,
      data: fallbackValue
    };
  }
}

/**
 * Progress tracking for long-running operations
 */
export class ProgressTracker {
  private callbacks: Array<(progress: number, message?: string) => void> = [];
  private currentProgress = 0;
  private currentMessage = '';

  onProgress(callback: (progress: number, message?: string) => void): void {
    this.callbacks.push(callback);
  }

  updateProgress(progress: number, message?: string): void {
    this.currentProgress = Math.max(0, Math.min(100, progress));
    this.currentMessage = message || '';
    
    this.callbacks.forEach(callback => {
      try {
        callback(this.currentProgress, this.currentMessage);
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    });
  }

  complete(message?: string): void {
    this.updateProgress(100, message || 'Complete');
  }

  reset(): void {
    this.currentProgress = 0;
    this.currentMessage = '';
    this.callbacks = [];
  }

  getCurrentProgress(): { progress: number; message: string } {
    return {
      progress: this.currentProgress,
      message: this.currentMessage
    };
  }
}

// Export singleton instance
export const analyticsErrorHandler = AnalyticsErrorHandler.getInstance();