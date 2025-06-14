import type { SurveyResponse, SurveyWithRelations } from '../types/database';
import { Chart } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';

export interface ChartData {
  title: string;
  headers: string[];
  data: (string | number)[][];
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

  generateCorrelationChart(container: HTMLElement, data: SurveyResponse[]) {
    const correlationData = this.processCorrelationData(data);
    
    const config: ChartConfiguration = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Sound-Function Correlation',
          data: correlationData.data.map(item => ({ x: item.x, y: item.y, r: item.v * 10 })),
          backgroundColor: (context: any) => {
            const value = context.dataset.data[context.dataIndex].r / 10;
            return `rgba(66, 133, 244, ${value})`;
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
            title: {
              display: true,
              text: 'Functions'
            }
          },
          y: {
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

  generateErrorPatternChart(container: HTMLElement, data: SurveyResponse[]) {
    const errorData = this.processErrorData(data);
    
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

  generateSuccessRateChart(container: HTMLElement, data: SurveyResponse[]) {
    const successData = this.processSuccessData(data);
    
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

  processCorrelationData(data: SurveyResponse[]) {
    console.log('processCorrelationData called with data:', data);
    // TODO: Implement actual correlation data processing
    const result = {
      data: [
        { x: 1, y: 1, v: 0.8 },
        { x: 2, y: 2, v: 0.6 },
      ]
    };
    console.log('processCorrelationData returning:', result);
    return result;
  }

  processErrorData(data: SurveyResponse[]) {
    console.log('processErrorData called with data:', data);
    // TODO: Implement actual error data processing
    const result = {
      labels: ['Error Type 1', 'Error Type 2', 'Error Type 3'],
      values: [5, 3, 7]
    };
    console.log('processErrorData returning:', result);
    return result;
  }

  processSuccessData(data: SurveyResponse[]) {
    console.log('processSuccessData called with data:', data);
    // TODO: Implement actual success rate data processing
    const result = {
      labels: ['Day 1', 'Day 2', 'Day 3'],
      values: [75, 85, 90]
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
  const completedResponses = responses.filter(r => r.status === 'completed').length;
  const averageSuccess = responses.reduce((acc, r) => acc + (r.success_rate || 0), 0) / totalResponses;

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
      data: surveyVisualization.processCorrelationData(data).data.map(d => d.v),
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