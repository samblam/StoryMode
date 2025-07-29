// src/utils/surveyAnalytics.ts

import type { SurveyResponse } from '../types/database';

interface AnalyticsCache {
  surveyId: string;
  results: any;
  timestamp: number;
  expiresIn: number;
}

const analyticsCache = new Map<string, AnalyticsCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_BATCH_SIZE = 1000;

export function processBatchResults(responses: SurveyResponse[], batchSize: number = DEFAULT_BATCH_SIZE) {
  const batches: SurveyResponse[][] = [];
  for (let i = 0; i < responses.length; i += batchSize) {
    batches.push(responses.slice(i, i + batchSize));
  }

  const results = {
    successMetrics: { successRate: 0, averageCompletionTime: 0 },
    soundPerformance: { majorityChoice: null, majorityChoiceCount: 0, totalResponses: 0 },
    participantBehavior: { averageTimePerQuestion: 0, dropOffRate: 0 },
    aggregatedResults: { totalResponses: 0, averageScore: 0 },
  };

  // Process each batch and aggregate results
  batches.forEach((batch, index) => {
    const batchResults = {
      successMetrics: calculateSuccessMetrics(batch),
      soundPerformance: performSoundPerformanceAnalysis(batch),
      participantBehavior: trackParticipantBehavior(batch),
      aggregatedResults: aggregateResults(batch),
    };

    // Weighted average based on batch size
    const weight = batch.length / responses.length;
    results.successMetrics.successRate += batchResults.successMetrics.successRate * weight;
    results.successMetrics.averageCompletionTime += batchResults.successMetrics.averageCompletionTime * weight;
    results.participantBehavior.averageTimePerQuestion += batchResults.participantBehavior.averageTimePerQuestion * weight;
    results.participantBehavior.dropOffRate += batchResults.participantBehavior.dropOffRate * weight;
    
    // Update sound performance
    if (index === 0 || batchResults.soundPerformance.majorityChoiceCount > results.soundPerformance.majorityChoiceCount) {
      results.soundPerformance = batchResults.soundPerformance;
    }
    
    // Accumulate totals
    results.aggregatedResults.totalResponses += batchResults.aggregatedResults.totalResponses;
    results.aggregatedResults.averageScore += batchResults.aggregatedResults.averageScore * weight;
  });

  return results;
}

export function cacheAnalyticsResults(surveyId: string, results: any, expiresIn: number = CACHE_DURATION) {
  analyticsCache.set(surveyId, {
    surveyId,
    results,
    timestamp: Date.now(),
    expiresIn,
  });
}

export function getCachedAnalytics(surveyId: string): any | null {
  const cached = analyticsCache.get(surveyId);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.expiresIn) {
    analyticsCache.delete(surveyId);
    return null;
  }
  
  return cached.results;
}

export function calculateSuccessMetrics(responses: SurveyResponse[]) {
  console.log('calculateSuccessMetrics - Processing responses:', responses.length);
  
  if (!responses || responses.length === 0) {
    return { successRate: 0, averageCompletionTime: 0 };
  }

  let totalMatches = 0;
  let totalAttempts = 0;
  let totalCompletionTime = 0;
  let completedResponses = 0;

  responses.forEach((response, index) => {
    console.log(`calculateSuccessMetrics - Processing response ${index}:`, {
      id: response.id,
      completed: response.completed,
      hasMapping: !!(response.sound_mapping_responses as any)?.sound_mapping
    });

    if (response.completed && response.sound_mapping_responses) {
      completedResponses++;
      
      // Calculate completion time from created_at (placeholder since we don't have actual timing data)
      if (response.created_at) {
        totalCompletionTime += 30000; // Placeholder: assume 30 seconds average
      }

      const mappingData = response.sound_mapping_responses as any;
      if (mappingData?.sound_mapping) {
        Object.entries(mappingData.sound_mapping).forEach(([soundId, mapping]: [string, any]) => {
          console.log(`calculateSuccessMetrics - Sound mapping ${soundId}:`, {
            intended: mapping.intended,
            actual: mapping.actual?.substring(0, 50) + '...',
            matched: mapping.matched,
            sound_name: mapping.sound_name
          });
          
          // Check if this should actually be a match based on content
          const actualMatch = mapping.actual && mapping.intended &&
            mapping.actual.toLowerCase().includes(mapping.intended.toLowerCase());
          
          if (actualMatch !== mapping.matched) {
            console.log(`calculateSuccessMetrics - MISMATCH DETECTED for ${soundId}:`, {
              storedMatch: mapping.matched,
              contentBasedMatch: actualMatch,
              intended: mapping.intended,
              actual: mapping.actual?.substring(0, 100)
            });
          }
          
          totalAttempts++;
          if (mapping.matched === true) {
            totalMatches++;
          }
        });
      }
    }
  });

  const successRate = totalAttempts > 0 ? totalMatches / totalAttempts : 0;
  const averageCompletionTime = completedResponses > 0 ? totalCompletionTime / completedResponses : 0;

  console.log('calculateSuccessMetrics - Results:', {
    successRate,
    averageCompletionTime,
    totalMatches,
    totalAttempts,
    completedResponses
  });

  return {
    successRate,
    averageCompletionTime,
  };
}

export function performSoundPerformanceAnalysis(responses: SurveyResponse[]) {
  console.log('performSoundPerformanceAnalysis - Processing responses:', responses.length);
  
  const soundCounts = new Map<string, number>();
  
  responses.forEach((response, index) => {
    console.log(`performSoundPerformanceAnalysis - Processing response ${index}:`, response.id);
    
    if (response.sound_mapping_responses) {
      const mappingData = response.sound_mapping_responses as any;
      if (mappingData?.sound_mapping) {
        Object.entries(mappingData.sound_mapping).forEach(([soundId, mapping]: [string, any]) => {
          const soundName = mapping.sound_name || soundId;
          const count = soundCounts.get(soundName) || 0;
          soundCounts.set(soundName, count + 1);
          console.log(`performSoundPerformanceAnalysis - Counted sound: ${soundName} (${count + 1})`);
        });
      }
    }
  });

  let majorityChoice: string | null = null;
  let maxCount = 0;
  soundCounts.forEach((count, soundName) => {
    if (count > maxCount) {
      majorityChoice = soundName;
      maxCount = count;
    }
  });

  console.log('performSoundPerformanceAnalysis - Results:', {
    majorityChoice,
    majorityChoiceCount: maxCount,
    totalResponses: responses.length,
    soundCounts: Object.fromEntries(soundCounts)
  });

  return {
    majorityChoice,
    majorityChoiceCount: maxCount,
    totalResponses: responses.length,
  };
}

export function trackParticipantBehavior(responses: SurveyResponse[]) {
  console.log('trackParticipantBehavior - Processing responses:', responses.length);
  
  // Since we don't have actual timing data, use placeholder calculations
  const completedResponses = responses.filter(r => r.completed === true);
  const incompleteResponses = responses.filter(r => r.completed !== true);
  
  // Placeholder: assume average time per question based on number of sound mappings
  let totalQuestions = 0;
  completedResponses.forEach(response => {
    if (response.sound_mapping_responses) {
      const mappingData = response.sound_mapping_responses as any;
      if (mappingData?.sound_mapping) {
        totalQuestions += Object.keys(mappingData.sound_mapping).length;
      }
    }
  });
  
  const averageTimePerQuestion = totalQuestions > 0 ? (30000 * completedResponses.length) / totalQuestions : 0; // 30s total / questions
  const dropOffRate = responses.length > 0 ? incompleteResponses.length / responses.length : 0;
  
  console.log('trackParticipantBehavior - Results:', {
    averageTimePerQuestion,
    dropOffRate,
    completedResponses: completedResponses.length,
    incompleteResponses: incompleteResponses.length,
    totalQuestions
  });
  
  return {
    averageTimePerQuestion,
    dropOffRate,
  };
}

export function aggregateResults(responses: SurveyResponse[]) {
  console.log('aggregateResults - Processing responses:', responses.length);
  
  const totalResponses = responses.length;
  let totalMatches = 0;
  let totalAttempts = 0;
  
  responses.forEach(response => {
    if (response.sound_mapping_responses) {
      const mappingData = response.sound_mapping_responses as any;
      if (mappingData?.sound_mapping) {
        Object.entries(mappingData.sound_mapping).forEach(([soundId, mapping]: [string, any]) => {
          totalAttempts++;
          if (mapping.matched === true) {
            totalMatches++;
          }
        });
      }
    }
  });
  
  const averageScore = totalAttempts > 0 ? (totalMatches / totalAttempts) * 100 : 0;
  
  console.log('aggregateResults - Results:', {
    totalResponses,
    averageScore,
    totalMatches,
    totalAttempts
  });
  
  return {
    totalResponses,
    averageScore,
  };
}

export function generateConfusionMatrix(responses: SurveyResponse[]) {
  const matrix = new Map<string, Map<string, number>>();
  
  responses.forEach(response => {
    if (response.expected_sound && response.chosen_sound) {
      if (!matrix.has(response.expected_sound)) {
        matrix.set(response.expected_sound, new Map());
      }
      
      const row = matrix.get(response.expected_sound)!;
      row.set(response.chosen_sound, (row.get(response.chosen_sound) || 0) + 1);
    }
  });
  
  return {
    matrix: Array.from(matrix.entries()).map(([expected, row]) => 
      Array.from(row.entries()).map(([actual, count]) => ({
        expected,
        actual,
        count
      }))
    )
  };
}

export function performStatisticalSignificanceTests(responses: SurveyResponse[]) {
  const observed = new Map<string, number>();
  responses.forEach(r => {
    if (r.chosen_sound) {
      observed.set(r.chosen_sound, (observed.get(r.chosen_sound) || 0) + 1);
    }
  });
  
  const expected = responses.length / observed.size;
  const chiSquare = Array.from(observed.values()).reduce((sum, o) => 
    sum + Math.pow(o - expected, 2) / expected, 0);
  
  const degreesOfFreedom = observed.size - 1;
  const pValue = 1 - chiSquareProbability(chiSquare, degreesOfFreedom);
  
  return {
    chiSquare,
    degreesOfFreedom,
    pValue,
    isSignificant: pValue < 0.05
  };
}

function chiSquareProbability(chiSquare: number, df: number): number {
  // Simplified chi-square probability calculation
  const x = chiSquare / 2;
  let sum = Math.exp(-x);
  for (let i = 1; i <= df/2; i++) {
    sum = sum * x / i;
  }
  return Math.max(0, Math.min(1, sum));
}

export function validateData(responses: SurveyResponse[]) {
  return responses.every(response => {
    const hasRequiredFields = 
      response.chosen_sound !== undefined &&
      response.expected_sound !== undefined &&
      response.time_taken !== undefined &&
      response.is_complete !== undefined &&
      response.is_success !== undefined;

    return hasRequiredFields;
  });
}

export function detectOutliers(responses: SurveyResponse[]) {
  const times = responses.map(r => r.time_taken || 0);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(
    times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length
  );
  
  return responses.filter(response => {
    const time = response.time_taken || 0;
    return Math.abs(time - mean) > 2 * stdDev;
  });
}

export function scoreResponseQuality(responses: SurveyResponse[]) {
  return responses.map(response => {
    let score = 1;
    
    // Penalize extremely fast responses
    if (response.time_taken && response.time_taken < 500) {
      score *= 0.5;
    }
    
    // Penalize incomplete responses
    if (response.is_complete === false) {
      score *= 0.7;
    }
    
    // Bonus for successful matches
    if (response.is_success === true) {
      score *= 1.2;
    }
    
    return Math.min(1, Math.max(0, score));
  });
}

export function verifyCompletion(responses: SurveyResponse[]) {
  return responses.every(response => {
    return (
      response.completed === true &&
      response.sound_mapping_responses !== undefined &&
      response.sound_mapping_responses !== null
    );
  });
}