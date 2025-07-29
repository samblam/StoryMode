import type { SurveyResponse, SurveyWithRelations } from '../types/database';
import {
  Chart,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  ScatterController,
  Tooltip,
  Title,
  Legend
} from 'chart.js';
import type { ChartConfiguration } from 'chart.js';

// Register the necessary Chart.js components
Chart.register(
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  ScatterController,
  Tooltip,
  Title,
  Legend
);
import { analyticsCache } from './analyticsCache';
import { safeAnalyticsOperation } from './analyticsErrorHandler';

export interface ChartData {
  title: string;
  headers: string[];
  data: (string | number)[][];
}

// Type definitions for analytics data structures
interface CorrelationDataPoint {
  x: number;
  y: number;
  v: number;
}

interface CorrelationData {
  data: CorrelationDataPoint[];
}

interface ErrorData {
  labels: string[];
  values: number[];
}

interface SuccessData {
  labels: string[];
  values: number[];
}

export class SurveyVisualization {
  private static instance: SurveyVisualization;
  private charts: Map<string, Chart> = new Map();

  private constructor() {}

  static getInstance(): SurveyVisualization {
    if (!SurveyVisualization.instance) {
      SurveyVisualization.instance = new SurveyVisualization();
    }
    return SurveyVisualization.instance;
  }

  private destroyExistingChart(containerId: string) {
    const existingChart = this.charts.get(containerId);
    if (existingChart) {
      existingChart.destroy();
      this.charts.delete(containerId);
    }
  }

  private createChart(container: HTMLElement, config: ChartConfiguration) {
    this.destroyExistingChart(container.id);
    const ctx = (container as HTMLCanvasElement).getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    const chart = new Chart(ctx, config);
    this.charts.set(container.id, chart);
    return chart;
  }

  // Public method to clean up a specific chart
  destroyChart(containerId: string): void {
    this.destroyExistingChart(containerId);
  }

  // Public method to clean up all charts (prevents memory leaks)
  destroyAllCharts(): void {
    this.charts.forEach((chart, containerId) => {
      try {
        chart.destroy();
      } catch (error) {
        console.warn(`Error destroying chart ${containerId}:`, error);
      }
    });
    this.charts.clear();
  }

  // Get chart instance for updates instead of recreation
  getChart(containerId: string): Chart | undefined {
    return this.charts.get(containerId);
  }

  // Update chart data without recreating the entire chart
  updateChartData(containerId: string, newData: any): boolean {
    const chart = this.charts.get(containerId);
    if (!chart) return false;

    try {
      chart.data = newData;
      chart.update('none'); // Update without animation for better performance
      return true;
    } catch (error) {
      console.error(`Error updating chart ${containerId}:`, error);
      return false;
    }
  }

  // Display error chart with user-friendly message
  private displayErrorChart(container: HTMLElement, feedback: any): void {
    // Clear any existing chart
    this.destroyExistingChart(container.id);
    
    // Create error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'analytics-error-display';
    errorDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      padding: 20px;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      text-align: center;
      color: #6c757d;
    `;

    const iconColor = feedback.type === 'error' ? '#dc3545' :
                     feedback.type === 'warning' ? '#ffc107' : '#17a2b8';

    errorDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px; color: ${iconColor};">
        ${feedback.type === 'error' ? '⚠️' : feedback.type === 'warning' ? '⚠️' : 'ℹ️'}
      </div>
      <h3 style="margin: 0 0 8px 0; color: #495057;">${feedback.title}</h3>
      <p style="margin: 0 0 16px 0; max-width: 400px;">${feedback.message}</p>
      ${feedback.details ? `<p style="margin: 0; font-size: 14px; color: #6c757d;">${feedback.details}</p>` : ''}
      <div style="margin-top: 16px;">
        <button onclick="window.location.reload()" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        ">Retry</button>
        <button onclick="console.log('Report issue clicked')" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Report Issue</button>
      </div>
    `;

    // Clear container and add error display
    container.innerHTML = '';
    container.appendChild(errorDiv);
  }

  async generateCorrelationChart(container: HTMLElement, data: SurveyResponse[]) {
    const result = await safeAnalyticsOperation<CorrelationData>(
      () => this.processCorrelationData(data),
      { operation: 'generateCorrelationChart', dataLength: data.length },
      { data: [] }
    );

    if (!result.success) {
      this.displayErrorChart(container, result.feedback!);
      return null;
    }

    const correlationData = result.data!;

    if (!correlationData || !correlationData.data || correlationData.data.length === 0) {
      this.displayErrorChart(container, {
        type: 'info',
        title: 'No Correlation Data Available',
        message: 'There is no sufficient survey data to generate the correlation chart. Please ensure surveys have completed responses with sound matches.',
        details: 'This chart requires at least one completed survey response with sound matches to display meaningful data.'
      });
      return null;
    }
    
    const config: ChartConfiguration = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Sound-Function Correlation',
          data: (correlationData.data || []).map((item: CorrelationDataPoint) => ({ x: item.x, y: item.y, r: item.v * 10 })),
          backgroundColor: (context: any) => {
            const value = context.dataset.data[context.dataIndex]?.r / 10; // Added safe navigation
            return `rgba(66, 133, 244, ${value || 0})`; // Added fallback for value
          },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Sound-Function Correlation Matrix'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const dataPoint = context.dataset.data[context.dataIndex];
                const value = dataPoint && typeof dataPoint === 'object' && 'r' in dataPoint ? dataPoint.r : 0;
                return `Correlation: ${(value * 10).toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category', // Explicitly define type for category scale
            title: {
              display: true,
              text: 'Functions'
            }
          },
          y: {
            type: 'category', // Explicitly define type for category scale
            title: {
              display: true,
              text: 'Sounds'
            }
          }
        }
      }
    };

    return this.createChart(container, config);
  }

  async generateErrorPatternChart(container: HTMLElement, data: SurveyResponse[]) {
    const result = await safeAnalyticsOperation(
      () => this.processErrorData(data),
      { operation: 'generateErrorPatternChart', dataLength: data.length },
      { labels: ['No Data'], values: [0] }
    );

    if (!result.success) {
      this.displayErrorChart(container, result.feedback!);
      return null;
    }

    const errorData = result.data!;
    
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: errorData.labels,
        datasets: [{
          label: 'Error Frequency',
          data: errorData.values,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Error Patterns'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Errors'
            }
          }
        }
      }
    };

    return this.createChart(container, config);
  }

  async generateSuccessRateChart(container: HTMLElement, data: SurveyResponse[]) {
    const result = await safeAnalyticsOperation(
      () => this.processSuccessData(data),
      { operation: 'generateSuccessRateChart', dataLength: data.length },
      { labels: ['No Data'], values: [0] }
    );

    if (!result.success) {
      this.displayErrorChart(container, result.feedback!);
      return null;
    }

    const successData = result.data!;
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: successData.labels,
        datasets: [{
          label: 'Success Rate Over Time',
          data: successData.values,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Success Rate Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Success Rate (%)'
            }
          }
        }
      }
    };

    return this.createChart(container, config);
  }

  processCorrelationData(data: SurveyResponse[]): CorrelationData {
    console.log('processCorrelationData called with data:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('processCorrelationData - No data provided');
      return { data: [] };
    }

    // Try to get from cache first
    const surveyId = data[0]?.survey_id || 'unknown';
    const cacheKey = `correlation:${data.length}:${Date.now() - Date.now() % (5 * 60 * 1000)}`; // 5-minute cache buckets
    
    const cached = analyticsCache.get(surveyId, 'processCorrelationData', cacheKey) as CorrelationData | null;
    if (cached) {
      console.log('processCorrelationData returning cached result');
      return cached;
    }

    // Filter completed responses with sound mapping data (JSONB structure)
    const completedResponses = data.filter(response => {
      const mappingData = response.sound_mapping_responses as any;
      const hasData = response.completed === true &&
        mappingData &&
        typeof mappingData === 'object' &&
        mappingData.sound_mapping &&
        Object.keys(mappingData.sound_mapping).length > 0;
      
      console.log(`processCorrelationData - Response ${response.id}: completed=${response.completed}, hasMapping=${hasData}`);
      return hasData;
    });

    console.log(`processCorrelationData - Found ${completedResponses.length} completed responses with sound mapping data`);

    if (completedResponses.length === 0) {
      const result = { data: [] };
      analyticsCache.set(surveyId, 'processCorrelationData', result, cacheKey, 2 * 60 * 1000); // 2 minutes for empty results
      return result;
    }

    // Create correlation matrix data using JSONB structure
    const correlationMap = new Map<string, Map<string, { correct: number, total: number }>>();
    
    completedResponses.forEach((response, responseIndex) => {
      console.log(`processCorrelationData - Processing response ${responseIndex}:`, response.id);
      
      const mappingData = response.sound_mapping_responses as any;
      const soundMappingData = mappingData?.sound_mapping;
      if (!soundMappingData) return;
      
      Object.entries(soundMappingData).forEach(([soundId, mapping]: [string, any]) => {
        console.log(`processCorrelationData - Processing sound mapping ${soundId}:`, {
          intended: mapping.intended,
          matched: mapping.matched,
          sound_name: mapping.sound_name
        });
        
        const soundKey = mapping.sound_name || `sound_${soundId}`;
        const functionKey = mapping.intended || 'unknown';
        
        if (!correlationMap.has(soundKey)) {
          correlationMap.set(soundKey, new Map());
        }
        
        const soundMap = correlationMap.get(soundKey)!;
        if (!soundMap.has(functionKey)) {
          soundMap.set(functionKey, { correct: 0, total: 0 });
        }
        
        const stats = soundMap.get(functionKey)!;
        stats.total++;
        if (mapping.matched === true) {
          stats.correct++;
        }
      });
    });

    console.log('processCorrelationData - Correlation map:', correlationMap);

    // Convert to chart data format
    const correlationData: { x: number, y: number, v: number }[] = [];
    let soundIndex = 0;
    
    correlationMap.forEach((functionMap, soundName) => {
      let functionIndex = 0;
      functionMap.forEach((stats, functionName) => {
        const correlation = stats.total > 0 ? stats.correct / stats.total : 0;
        console.log(`processCorrelationData - Correlation for ${soundName} -> ${functionName}: ${correlation} (${stats.correct}/${stats.total})`);
        
        correlationData.push({
          x: functionIndex,
          y: soundIndex,
          v: correlation
        });
        functionIndex++;
      });
      soundIndex++;
    });

    const result = { data: correlationData };
    
    // Cache the result for 5 minutes
    analyticsCache.set(surveyId, 'processCorrelationData', result, cacheKey, 5 * 60 * 1000);
    
    console.log('processCorrelationData returning computed result:', result);
    return result;
  }

  processErrorData(data: SurveyResponse[]): ErrorData {
    console.log('processErrorData called with data:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('processErrorData - No data provided');
      return { labels: [], values: [] };
    }

    // Analyze error patterns from survey responses using JSONB structure
    const errorPatterns = {
      'Incomplete Responses': 0,
      'Incorrect Matches': 0,
      'No Sound Mapping': 0,
      'Low Match Rate': 0
    };

    data.forEach((response, index) => {
      const mappingData = response.sound_mapping_responses as any;
      console.log(`processErrorData - Processing response ${index}:`, {
        id: response.id,
        completed: response.completed,
        hasMapping: !!(mappingData?.sound_mapping)
      });
      
      // Count incomplete responses
      if (!response.completed) {
        errorPatterns['Incomplete Responses']++;
      }
      
      // Count responses with no sound mapping data
      if (!mappingData?.sound_mapping) {
        errorPatterns['No Sound Mapping']++;
        return;
      }
      
      // Count incorrect matches using JSONB structure
      const soundMappingData = mappingData.sound_mapping;
      let totalMappings = 0;
      let incorrectMappings = 0;
      
      Object.entries(soundMappingData).forEach(([soundId, mapping]: [string, any]) => {
        totalMappings++;
        if (mapping.matched === false) {
          incorrectMappings++;
        }
      });
      
      errorPatterns['Incorrect Matches'] += incorrectMappings;
      
      // Count low match rate responses (less than 50% correct)
      if (totalMappings > 0) {
        const matchRate = (totalMappings - incorrectMappings) / totalMappings;
        if (matchRate < 0.5) {
          errorPatterns['Low Match Rate']++;
        }
      }
    });

    console.log('processErrorData - Error patterns:', errorPatterns);

    // Filter out error types with zero occurrences for cleaner visualization
    const filteredLabels: string[] = [];
    const filteredValues: number[] = [];
    
    Object.entries(errorPatterns).forEach(([label, value]) => {
      if (value > 0) {
        filteredLabels.push(label);
        filteredValues.push(value);
      }
    });

    // If no errors found, show a placeholder
    if (filteredLabels.length === 0) {
      filteredLabels.push('No Errors Detected');
      filteredValues.push(0);
    }

    const result = {
      labels: filteredLabels,
      values: filteredValues
    };
    
    console.log('processErrorData returning:', result);
    return result;
  }

  processSuccessData(data: SurveyResponse[]): SuccessData {
    console.log('processSuccessData called with data:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('processSuccessData - No data provided');
      return { labels: [], values: [] };
    }

    // Filter completed responses and sort by creation date
    const completedResponses = data
      .filter(response => response.completed === true && response.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    console.log(`processSuccessData - Found ${completedResponses.length} completed responses`);

    if (completedResponses.length === 0) {
      return {
        labels: ['No Data'],
        values: [0]
      };
    }

    // Group responses by day for time-series analysis
    const dailyData = new Map<string, { total: number, successSum: number }>();
    
    completedResponses.forEach((response, index) => {
      console.log(`processSuccessData - Processing response ${index}:`, response.id);
      
      const date = new Date(response.created_at);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { total: 0, successSum: 0 });
      }
      
      const dayStats = dailyData.get(dateKey)!;
      dayStats.total++;
      
      // Calculate success rate from JSONB sound_mapping_responses
      let successRate = 0;
      const mappingData = response.sound_mapping_responses as any;
      
      if (mappingData?.sound_mapping) {
        const soundMappingData = mappingData.sound_mapping;
        const mappingEntries = Object.entries(soundMappingData);
        
        console.log(`processSuccessData - Response ${response.id} has ${mappingEntries.length} sound mappings`);
        
        if (mappingEntries.length > 0) {
          const correctMatches = mappingEntries.filter(([_, mapping]: [string, any]) => {
            console.log(`processSuccessData - Mapping matched: ${mapping.matched}`);
            return mapping.matched === true;
          }).length;
          
          successRate = correctMatches / mappingEntries.length;
          console.log(`processSuccessData - Success rate for response ${response.id}: ${successRate} (${correctMatches}/${mappingEntries.length})`);
        }
      } else {
        console.log(`processSuccessData - Response ${response.id} has no sound mapping data`);
      }
      
      dayStats.successSum += successRate * 100; // Convert to percentage
    });

    // Convert to chart format
    const labels: string[] = [];
    const values: number[] = [];
    
    // Sort dates and calculate daily success rates
    const sortedDates = Array.from(dailyData.keys()).sort();
    
    sortedDates.forEach(dateKey => {
      const stats = dailyData.get(dateKey)!;
      const dailySuccessRate = stats.total > 0 ? stats.successSum / stats.total : 0;
      
      // Format date for display
      const date = new Date(dateKey);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      labels.push(formattedDate);
      values.push(Math.round(dailySuccessRate * 100) / 100); // Round to 2 decimal places
    });

    // If we have only one data point, add a trend line by duplicating
    if (labels.length === 1) {
      labels.push('Current');
      values.push(values[0]);
    }

    const result = {
      labels,
      values
    };
    
    console.log('processSuccessData returning:', result);
    return result;
  }

  formatDataForExport(data: SurveyResponse[]) {
    return {
      csv: this.generateCSV(data),
      json: JSON.stringify(data, null, 2),
      pdf: null // Will be implemented with PDF generation
    };
  }

  private generateCSV(data: SurveyResponse[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  generatePDFReport(data: SurveyResponse[]) {
    // TODO: Implement PDF report generation
    console.log('Generating PDF report', { data });
  }
}

export const formatChartData = (survey: SurveyWithRelations): ChartData[] => {
  if (!survey.survey_responses) return [];

  const responses = survey.survey_responses;
  const totalResponses = responses.length;
  const completedResponses = responses.filter(r => r.completed === true).length;
  const averageSuccess = responses.reduce((acc, r) => {
    if (r.sound_mapping_responses && Array.isArray(r.sound_mapping_responses)) {
      const soundMappings = r.sound_mapping_responses as any[];
      if (soundMappings.length > 0) {
        const correctMatches = soundMappings.filter(match => match.is_correct).length;
        return acc + (correctMatches / soundMappings.length);
      }
    }
    return acc;
  }, 0) / totalResponses;

  return [
    {
      title: 'Response Summary',
      headers: ['Metric', 'Value'],
      data: [
        ['Total Responses', totalResponses],
        ['Completed Responses', completedResponses],
        ['Average Success Rate', `${(averageSuccess * 100).toFixed(1)}%`],
      ]
    }
  ];
};

// Export singleton instance
export const surveyVisualization = SurveyVisualization.getInstance();

// Export standalone functions that use the singleton instance
export const generateCorrelationData = (data: SurveyResponse[]) => {
  return {
    labels: ['Sound-Function Correlation'],
    datasets: [{
      label: 'Correlation Strength',
      data: ((surveyVisualization.processCorrelationData(data) as any)?.data || []).map((d: any) => d.v),
      backgroundColor: 'rgba(66, 133, 244, 0.5)',
      borderColor: 'rgba(66, 133, 244, 1)',
      borderWidth: 1
    }]
  };
};

export const generateSuccessRateData = (data: SurveyResponse[]) => {
  const processedData = surveyVisualization.processSuccessData(data);
  return {
    labels: processedData.labels,
    datasets: [{
      label: 'Success Rate',
      data: processedData.values,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
};

export const generateErrorPatternData = (data: SurveyResponse[]) => {
  const processedData = surveyVisualization.processErrorData(data);
  return {
    labels: processedData.labels,
    datasets: [{
      label: 'Error Frequency',
      data: processedData.values,
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  };
};

export const generateTimelineData = (data: SurveyResponse[]) => {
  const dates = data.map(r => new Date(r.created_at).toLocaleDateString());
  const counts = dates.reduce((acc: {[key: string]: number}, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return {
    labels: Object.keys(counts),
    datasets: [{
      label: 'Responses per Day',
      data: Object.values(counts),
      fill: false,
      borderColor: 'rgb(153, 102, 255)',
      tension: 0.1
    }]
  };
};