/**
 * Comprehensive test suite for analytics functionality
 * Tests all analytics operations with real survey data
 */

import { getClient } from '../lib/supabase';
import { SurveyVisualization } from './surveyVisualization';
import { exportSurveyData, exportSurveyDataEnhanced } from './surveyExport';
import { analyticsCache } from './analyticsCache';
import { analyticsErrorHandler, safeAnalyticsOperation } from './analyticsErrorHandler';
import type { SurveyResponse } from '../types/database';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
  warnings?: string[];
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class AnalyticsTestSuite {
  private supabase = getClient({ requiresAdmin: true });
  private visualization = SurveyVisualization.getInstance();
  private testResults: TestSuite[] = [];

  /**
   * Run comprehensive analytics tests
   */
  async runAllTests(): Promise<{
    success: boolean;
    summary: {
      totalSuites: number;
      totalTests: number;
      passedTests: number;
      failedTests: number;
      totalDuration: number;
    };
    suites: TestSuite[];
    recommendations: string[];
  }> {
    console.log('🧪 Starting Analytics Test Suite...');
    
    const startTime = Date.now();
    this.testResults = [];

    // Run test suites
    await this.testDataProcessing();
    await this.testVisualizationGeneration();
    await this.testExportFunctionality();
    await this.testCachingSystem();
    await this.testErrorHandling();
    await this.testPerformance();

    const totalDuration = Date.now() - startTime;

    // Calculate summary
    const summary = this.calculateSummary(totalDuration);
    const recommendations = this.generateRecommendations();

    console.log('✅ Analytics Test Suite Complete');
    console.log(`📊 Summary: ${summary.passedTests}/${summary.totalTests} tests passed in ${summary.totalDuration}ms`);

    return {
      success: summary.failedTests === 0,
      summary,
      suites: this.testResults,
      recommendations
    };
  }

  /**
   * Test data processing functions
   */
  private async testDataProcessing(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Data Processing',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Get test data
    const testData = await this.getTestSurveyData();

    // Test correlation data processing
    await this.runTest(suite, 'Process Correlation Data', async () => {
      const result = this.visualization.processCorrelationData(testData);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid correlation data structure');
      }

      const data = (result as any).data || [];
      if (!Array.isArray(data)) {
        throw new Error('Correlation data should be an array');
      }

      // Validate data structure
      if (data.length > 0) {
        const sample = data[0];
        if (typeof sample.x !== 'number' || typeof sample.y !== 'number' || typeof sample.v !== 'number') {
          throw new Error('Invalid correlation data point structure');
        }
      }

      return { dataPoints: data.length, structure: 'valid' };
    });

    // Test error data processing
    await this.runTest(suite, 'Process Error Data', async () => {
      const result = this.visualization.processErrorData(testData);
      
      if (!result || !result.labels || !result.values) {
        throw new Error('Invalid error data structure');
      }

      if (!Array.isArray(result.labels) || !Array.isArray(result.values)) {
        throw new Error('Error data labels and values should be arrays');
      }

      if (result.labels.length !== result.values.length) {
        throw new Error('Error data labels and values length mismatch');
      }

      return { errorTypes: result.labels.length, totalErrors: result.values.reduce((a, b) => a + b, 0) };
    });

    // Test success data processing
    await this.runTest(suite, 'Process Success Data', async () => {
      const result = this.visualization.processSuccessData(testData);
      
      if (!result || !result.labels || !result.values) {
        throw new Error('Invalid success data structure');
      }

      if (!Array.isArray(result.labels) || !Array.isArray(result.values)) {
        throw new Error('Success data labels and values should be arrays');
      }

      // Validate success rates are percentages
      const invalidRates = result.values.filter(v => v < 0 || v > 100);
      if (invalidRates.length > 0) {
        throw new Error('Success rates should be between 0 and 100');
      }

      return { dataPoints: result.labels.length, averageSuccess: result.values.reduce((a, b) => a + b, 0) / result.values.length };
    });

    this.testResults.push(suite);
  }

  /**
   * Test visualization generation
   */
  private async testVisualizationGeneration(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Visualization Generation',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    const testData = await this.getTestSurveyData();

    // Create test containers
    const correlationContainer = this.createTestContainer('correlation-test');
    const errorContainer = this.createTestContainer('error-test');
    const successContainer = this.createTestContainer('success-test');

    // Test correlation chart generation
    await this.runTest(suite, 'Generate Correlation Chart', async () => {
      const chart = await this.visualization.generateCorrelationChart(correlationContainer, testData);
      
      if (!chart && correlationContainer.innerHTML.includes('analytics-error-display')) {
        // Error display is acceptable if no data
        return { status: 'error_display_shown', hasData: false };
      }

      if (chart) {
        return { status: 'chart_created', chartType: (chart.config as any).type };
      }

      throw new Error('No chart created and no error display shown');
    });

    // Test error pattern chart generation
    await this.runTest(suite, 'Generate Error Pattern Chart', async () => {
      const chart = await this.visualization.generateErrorPatternChart(errorContainer, testData);
      
      if (!chart && errorContainer.innerHTML.includes('analytics-error-display')) {
        return { status: 'error_display_shown', hasData: false };
      }

      if (chart) {
        return { status: 'chart_created', chartType: (chart.config as any).type };
      }

      throw new Error('No chart created and no error display shown');
    });

    // Test success rate chart generation
    await this.runTest(suite, 'Generate Success Rate Chart', async () => {
      const chart = await this.visualization.generateSuccessRateChart(successContainer, testData);
      
      if (!chart && successContainer.innerHTML.includes('analytics-error-display')) {
        return { status: 'error_display_shown', hasData: false };
      }

      if (chart) {
        return { status: 'chart_created', chartType: (chart.config as any).type };
      }

      throw new Error('No chart created and no error display shown');
    });

    // Cleanup test containers
    this.cleanupTestContainers([correlationContainer, errorContainer, successContainer]);

    this.testResults.push(suite);
  }

  /**
   * Test export functionality
   */
  private async testExportFunctionality(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Export Functionality',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    const testSurveyId = await this.getTestSurveyId();

    if (!testSurveyId) {
      suite.results.push({
        testName: 'Export Tests',
        success: false,
        duration: 0,
        error: 'No test survey available',
        warnings: ['Skipping export tests - no survey data found']
      });
      this.testResults.push(suite);
      return;
    }

    // Test CSV export
    await this.runTest(suite, 'CSV Export', async () => {
      const result = await exportSurveyData(testSurveyId, { format: 'csv' });
      
      if (!result.data || typeof result.data !== 'string') {
        throw new Error('CSV export should return string data');
      }

      if (!result.contentType.includes('csv')) {
        throw new Error('CSV export should have CSV content type');
      }

      const lines = result.data.split('\n').filter(line => line.trim());
      return { lines: lines.length, contentType: result.contentType, size: result.data.length };
    });

    // Test JSON export
    await this.runTest(suite, 'JSON Export', async () => {
      const result = await exportSurveyData(testSurveyId, { format: 'json' });
      
      if (!result.data || typeof result.data !== 'string') {
        throw new Error('JSON export should return string data');
      }

      // Validate JSON structure
      const parsed = JSON.parse(result.data);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON export should return an array');
      }

      return { records: parsed.length, contentType: result.contentType, size: result.data.length };
    });

    // Test PDF export
    await this.runTest(suite, 'PDF Export', async () => {
      const result = await exportSurveyData(testSurveyId, { format: 'pdf' });
      
      if (!result.data || typeof result.data !== 'string') {
        throw new Error('PDF export should return string data');
      }

      // PDF should be data URI or base64
      const isPDF = result.data.startsWith('data:application/pdf') || result.contentType.includes('pdf');
      if (!isPDF) {
        throw new Error('PDF export should return PDF data');
      }

      return { contentType: result.contentType, size: result.data.length };
    });

    // Test enhanced export (streaming)
    await this.runTest(suite, 'Enhanced Export', async () => {
      const result = await exportSurveyDataEnhanced(testSurveyId, { format: 'csv' });
      
      if (!result.data) {
        throw new Error('Enhanced export should return data');
      }

      return { 
        isStreaming: result.isStreaming || false, 
        contentType: result.contentType,
        size: result.data.length 
      };
    });

    this.testResults.push(suite);
  }

  /**
   * Test caching system
   */
  private async testCachingSystem(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Caching System',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    const testData = await this.getTestSurveyData();
    const testSurveyId = testData[0]?.survey_id || 'test-survey';

    // Test cache set and get
    await this.runTest(suite, 'Cache Set/Get', async () => {
      const testKey = 'test-operation';
      const testValue = { test: 'data', timestamp: Date.now() };

      analyticsCache.set(testSurveyId, testKey, testValue);
      const retrieved = analyticsCache.get(testSurveyId, testKey);

      if (!retrieved || (retrieved as any).test !== testValue.test) {
        throw new Error('Cache set/get failed');
      }

      return { cached: true, value: retrieved };
    });

    // Test cache invalidation
    await this.runTest(suite, 'Cache Invalidation', async () => {
      const testKey = 'invalidation-test';
      analyticsCache.set(testSurveyId, testKey, { data: 'test' });
      
      analyticsCache.invalidateSurvey(testSurveyId);
      const retrieved = analyticsCache.get(testSurveyId, testKey);

      if (retrieved !== null) {
        throw new Error('Cache invalidation failed');
      }

      return { invalidated: true };
    });

    // Test cache statistics
    await this.runTest(suite, 'Cache Statistics', async () => {
      const stats = analyticsCache.getStats();
      
      if (typeof stats.size !== 'number' || !Array.isArray(stats.entries)) {
        throw new Error('Invalid cache statistics structure');
      }

      return stats;
    });

    this.testResults.push(suite);
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Error Handling',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    // Test safe operation wrapper
    await this.runTest(suite, 'Safe Operation Success', async () => {
      const result = await safeAnalyticsOperation(
        () => Promise.resolve({ success: true }),
        { test: 'context' }
      );

      if (!result.success || !result.data) {
        throw new Error('Safe operation should handle success case');
      }

      return result.data;
    });

    // Test safe operation error handling
    await this.runTest(suite, 'Safe Operation Error', async () => {
      const result = await safeAnalyticsOperation(
        () => { throw new Error('Test error'); },
        { test: 'error context' },
        { fallback: 'value' }
      );

      if (result.success) {
        throw new Error('Safe operation should handle error case');
      }

      if (!result.error || !result.feedback) {
        throw new Error('Safe operation should provide error and feedback');
      }

      return { errorHandled: true, fallbackUsed: result.data?.fallback === 'value' };
    });

    // Test error categorization
    await this.runTest(suite, 'Error Categorization', async () => {
      const networkError = new Error('Network request failed');
      const permissionError = new Error('Permission denied');
      const memoryError = new Error('Out of memory');

      const networkResult = analyticsErrorHandler.handleError(networkError);
      const permissionResult = analyticsErrorHandler.handleError(permissionError);
      const memoryResult = analyticsErrorHandler.handleError(memoryError);

      return {
        networkCode: networkResult.code,
        permissionCode: permissionResult.code,
        memoryCode: memoryResult.code
      };
    });

    this.testResults.push(suite);
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Performance',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    const testData = await this.getTestSurveyData();

    // Test data processing performance
    await this.runTest(suite, 'Data Processing Performance', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        this.visualization.processCorrelationData(testData);
        this.visualization.processErrorData(testData);
        this.visualization.processSuccessData(testData);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      if (avgTime > 1000) { // 1 second threshold
        throw new Error(`Performance too slow: ${avgTime}ms average`);
      }

      return { averageTime: avgTime, maxTime, iterations };
    });

    // Test memory usage
    await this.runTest(suite, 'Memory Usage', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create and destroy multiple charts
      for (let i = 0; i < 5; i++) {
        const container = this.createTestContainer(`memory-test-${i}`);
        await this.visualization.generateCorrelationChart(container, testData);
        this.visualization.destroyChart(container.id);
        container.remove();
      }

      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      return { 
        initialMemory, 
        finalMemory, 
        memoryIncrease,
        memoryIncreaseKB: Math.round(memoryIncrease / 1024)
      };
    });

    this.testResults.push(suite);
  }

  /**
   * Helper methods
   */
  private async getTestSurveyData(): Promise<SurveyResponse[]> {
    try {
      const { data: responses } = await this.supabase
        .from('survey_responses')
        .select('*')
        .limit(100);

      return responses || [];
    } catch (error) {
      console.warn('Could not fetch test survey data:', error);
      return [];
    }
  }

  private async getTestSurveyId(): Promise<string | null> {
    try {
      const { data: surveys } = await this.supabase
        .from('surveys')
        .select('id')
        .limit(1);

      return surveys?.[0]?.id || null;
    } catch (error) {
      console.warn('Could not fetch test survey ID:', error);
      return null;
    }
  }

  private createTestContainer(id: string): HTMLElement {
    const container = document.createElement('canvas');
    container.id = id;
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }

  private cleanupTestContainers(containers: HTMLElement[]): void {
    containers.forEach(container => {
      this.visualization.destroyChart(container.id);
      container.remove();
    });
  }

  private async runTest(suite: TestSuite, testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    suite.totalTests++;

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      suite.results.push({
        testName,
        success: true,
        duration,
        data: result
      });

      suite.passedTests++;
      suite.totalDuration += duration;

      console.log(`✅ ${testName}: ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;

      suite.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });

      suite.failedTests++;
      suite.totalDuration += duration;

      console.log(`❌ ${testName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private calculateSummary(totalDuration: number) {
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = this.testResults.reduce((sum, suite) => sum + suite.failedTests, 0);

    return {
      totalSuites: this.testResults.length,
      totalTests,
      passedTests,
      failedTests,
      totalDuration
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze test results for recommendations
    this.testResults.forEach(suite => {
      if (suite.failedTests > 0) {
        recommendations.push(`Address ${suite.failedTests} failed tests in ${suite.suiteName}`);
      }

      // Performance recommendations
      if (suite.suiteName === 'Performance') {
        const perfTest = suite.results.find(r => r.testName.includes('Performance'));
        if (perfTest?.data?.averageTime > 500) {
          recommendations.push('Consider optimizing data processing performance');
        }
      }

      // Memory recommendations
      const memoryTest = suite.results.find(r => r.testName.includes('Memory'));
      if (memoryTest?.data?.memoryIncreaseKB > 1000) {
        recommendations.push('Monitor memory usage - potential memory leaks detected');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All tests passed - analytics system is functioning well');
    }

    return recommendations;
  }
}

// Export test runner function
export async function runAnalyticsTests(): Promise<any> {
  const testSuite = new AnalyticsTestSuite();
  return await testSuite.runAllTests();
}