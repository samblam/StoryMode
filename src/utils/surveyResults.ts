// src/utils/surveyResults.ts

import type { SurveyResponse } from '../types/database';

export function processRawData(responses: SurveyResponse[]) {
    console.log('Processing raw data', responses);
    return responses;
}

export function prepareGraphData(responses: SurveyResponse[]) {
    console.log('Preparing graph data for', responses?.length || 0, 'responses');
    
    if (!responses || responses.length === 0) {
        console.log('No responses provided, returning empty chart data');
        return {
            correlationData: { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: '#e5e7eb' }] },
            successRateData: { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: '#e5e7eb' }] },
            errorPatternData: { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: '#e5e7eb' }] },
            timelineData: { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: '#e5e7eb' }] }
        };
    }

    // Process correlation data from JSONB sound_mapping_responses
    const correlationData = processCorrelationChartData(responses);
    const successRateData = processSuccessRateChartData(responses);
    const errorPatternData = processErrorPatternChartData(responses);
    const timelineData = processTimelineChartData(responses);

    console.log('Prepared chart data:', {
        correlationData: correlationData.datasets[0]?.data?.length || 0,
        successRateData: successRateData.datasets[0]?.data?.length || 0,
        errorPatternData: errorPatternData.datasets[0]?.data?.length || 0,
        timelineData: timelineData.datasets[0]?.data?.length || 0
    });

    return {
        correlationData,
        successRateData,
        errorPatternData,
        timelineData
    };
}

function processCorrelationChartData(responses: SurveyResponse[]) {
    const correlationMap = new Map<string, Map<string, { correct: number, total: number }>>();
    
    // Filter completed responses with sound mapping data
    const completedResponses = responses.filter(response => {
        const mappingData = response.sound_mapping_responses as any;
        return response.completed === true &&
            mappingData &&
            typeof mappingData === 'object' &&
            mappingData.sound_mapping &&
            Object.keys(mappingData.sound_mapping).length > 0;
    });

    console.log(`Found ${completedResponses.length} completed responses with sound mapping data`);

    if (completedResponses.length === 0) {
        return {
            labels: ['No Data'],
            datasets: [{
                label: 'Sound-Function Correlation',
                data: [0],
                backgroundColor: '#e5e7eb'
            }]
        };
    }

    // Process sound mapping data
    completedResponses.forEach(response => {
        const mappingData = response.sound_mapping_responses as any;
        const soundMappingData = mappingData?.sound_mapping;
        if (!soundMappingData) return;
        
        Object.entries(soundMappingData).forEach(([soundId, mapping]: [string, any]) => {
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

    // Convert to chart format
    const labels: string[] = [];
    const data: number[] = [];
    
    correlationMap.forEach((functionMap, soundName) => {
        functionMap.forEach((stats, functionName) => {
            const correlation = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
            labels.push(`${soundName} → ${functionName}`);
            data.push(correlation);
        });
    });

    return {
        labels,
        datasets: [{
            label: 'Correlation %',
            data,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
        }]
    };
}

function processSuccessRateChartData(responses: SurveyResponse[]) {
    if (!responses || responses.length === 0) {
        return {
            labels: ['No Data'],
            datasets: [{
                label: 'Success Rate',
                data: [0],
                backgroundColor: '#e5e7eb'
            }]
        };
    }

    // Group responses by date and calculate actual success rates
    const dateGroups = new Map<string, { totalMatches: number, successfulMatches: number, responseCount: number }>();
    
    responses.forEach(response => {
        const date = new Date(response.created_at).toLocaleDateString();
        if (!dateGroups.has(date)) {
            dateGroups.set(date, { totalMatches: 0, successfulMatches: 0, responseCount: 0 });
        }
        
        const group = dateGroups.get(date)!;
        group.responseCount++;
        
        // Calculate success based on sound mapping data
        const mappingData = response.sound_mapping_responses as any;
        if (mappingData?.sound_mapping) {
            const mappings = Object.values(mappingData.sound_mapping) as any[];
            group.totalMatches += mappings.length;
            group.successfulMatches += mappings.filter(m => m.matched === true).length;
        }
    });

    const labels = Array.from(dateGroups.keys()).sort();
    const data = labels.map(date => {
        const group = dateGroups.get(date)!;
        return group.totalMatches > 0 ? (group.successfulMatches / group.totalMatches) * 100 : 0;
    });

    return {
        labels,
        datasets: [{
            label: 'Success Rate %',
            data,
            fill: false,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.1
        }]
    };
}

function processErrorPatternChartData(responses: SurveyResponse[]) {
    console.log('processErrorPatternChartData - Processing responses:', responses.length);
    
    const errorPatterns = {
        'Incomplete Responses': 0,
        'No Sound Mapping': 0,
        'Low Match Rate': 0,
        'Missing Data': 0
    };

    responses.forEach((response, index) => {
        console.log(`processErrorPatternChartData - Processing response ${index}:`, {
            id: response.id,
            completed: response.completed,
            hasMapping: !!response.sound_mapping_responses
        });
        
        if (!response.completed) {
            errorPatterns['Incomplete Responses']++;
            console.log(`processErrorPatternChartData - Response ${index}: Incomplete`);
            return;
        }
        
        const mappingData = response.sound_mapping_responses as any;
        if (!mappingData?.sound_mapping) {
            errorPatterns['No Sound Mapping']++;
            console.log(`processErrorPatternChartData - Response ${index}: No Sound Mapping`);
            return;
        }
        
        const mappings = Object.values(mappingData.sound_mapping) as any[];
        console.log(`processErrorPatternChartData - Response ${index}: Found ${mappings.length} mappings`);
        
        if (mappings.length === 0) {
            errorPatterns['Missing Data']++;
            console.log(`processErrorPatternChartData - Response ${index}: Missing Data (0 mappings)`);
            return;
        }
        
        // Check if any mappings have missing required fields
        const hasInvalidMappings = mappings.some(m => !m.intended || !m.actual || m.matched === undefined);
        if (hasInvalidMappings) {
            errorPatterns['Missing Data']++;
            console.log(`processErrorPatternChartData - Response ${index}: Missing Data (invalid mapping fields)`);
            return;
        }
        
        const successfulMappings = mappings.filter(m => m.matched === true).length;
        const successRate = successfulMappings / mappings.length;
        
        console.log(`processErrorPatternChartData - Response ${index}: Success rate ${successRate} (${successfulMappings}/${mappings.length})`);
        
        if (successRate < 0.5) {
            errorPatterns['Low Match Rate']++;
            console.log(`processErrorPatternChartData - Response ${index}: Low Match Rate`);
        } else {
            console.log(`processErrorPatternChartData - Response ${index}: No errors detected`);
        }
    });

    console.log('processErrorPatternChartData - Final error patterns:', errorPatterns);

    return {
        labels: Object.keys(errorPatterns),
        datasets: [{
            label: 'Error Count',
            data: Object.values(errorPatterns),
            backgroundColor: [
                'rgba(239, 68, 68, 0.5)',
                'rgba(245, 158, 11, 0.5)',
                'rgba(168, 85, 247, 0.5)',
                'rgba(107, 114, 128, 0.5)'
            ],
            borderColor: [
                'rgba(239, 68, 68, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(168, 85, 247, 1)',
                'rgba(107, 114, 128, 1)'
            ],
            borderWidth: 1
        }]
    };
}

function processTimelineChartData(responses: SurveyResponse[]) {
    if (!responses || responses.length === 0) {
        return {
            labels: ['No Data'],
            datasets: [{
                label: 'Response Timeline',
                data: [0],
                backgroundColor: '#e5e7eb'
            }]
        };
    }

    // Group responses by hour with proper chronological sorting
    const hourGroups = new Map<string, { count: number, timestamp: number }>();
    
    responses.forEach(response => {
        const date = new Date(response.created_at);
        const hourKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
        const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
        
        if (!hourGroups.has(hourKey)) {
            hourGroups.set(hourKey, { count: 0, timestamp });
        }
        hourGroups.get(hourKey)!.count++;
    });

    // Sort by timestamp, not alphabetically
    const sortedEntries = Array.from(hourGroups.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const labels = sortedEntries.map(([key]) => key);
    const data = sortedEntries.map(([, value]) => value.count);

    return {
        labels,
        datasets: [{
            label: 'Responses per Hour',
            data,
            fill: false,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.1
        }]
    };
}

export function formatCSVExport(responses: SurveyResponse[]) {
    console.log('Formatting CSV export', responses);
    return 'CSV data';
}

export function generatePDFReport(responses: SurveyResponse[]) {
    console.log('Generating PDF report', responses);
    return 'PDF report content';
}