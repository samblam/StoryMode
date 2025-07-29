// Data Migration Script - Fix Survey Response Matching Logic
// This script re-evaluates existing survey responses using the improved matching logic

import { getClient } from '../lib/supabase';

// Import the improved matching function from the survey form
function checkFunctionMatch(actualText: string, intendedText: string): boolean {
    if (!actualText || !intendedText) return false;
    
    // Exact match (case-insensitive)
    if (actualText.toLowerCase() === intendedText.toLowerCase()) {
        return true;
    }
    
    // Check if intended function is contained in actual text (case-insensitive)
    // This handles cases like "Match" vs "Match Sound of Matching..."
    const actualLower = actualText.toLowerCase();
    const intendedLower = intendedText.toLowerCase();
    
    // Check if intended text is at the start of actual text
    if (actualLower.startsWith(intendedLower)) {
        return true;
    }
    
    // Check if intended text is contained as a whole word in actual text
    const wordBoundaryRegex = new RegExp(`\\b${intendedLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (wordBoundaryRegex.test(actualLower)) {
        return true;
    }
    
    // Check for common variations and synonyms
    const synonymMap: Record<string, string[]> = {
        'match': ['matching', 'matched'],
        'message': ['messaging', 'msg'],
        'activity': ['action', 'active'],
        'notification': ['notify', 'alert'],
        'error': ['warning', 'problem'],
        'success': ['complete', 'done'],
        'click': ['tap', 'select'],
        'hover': ['mouseover', 'focus']
    };
    
    const intendedBase = intendedLower.replace(/[^a-z]/g, '');
    if (synonymMap[intendedBase]) {
        for (const synonym of synonymMap[intendedBase]) {
            if (actualLower.includes(synonym)) {
                return true;
            }
        }
    }
    
    return false;
}

interface SurveyResponse {
    id: string;
    survey_id: string;
    sound_mapping_responses: any;
    completed: boolean;
    created_at: string;
}

interface MigrationResult {
    totalResponses: number;
    responsesProcessed: number;
    matchesUpdated: number;
    errors: string[];
    details: Array<{
        responseId: string;
        soundId: string;
        intended: string;
        actual: string;
        oldMatched: boolean;
        newMatched: boolean;
        updated: boolean;
    }>;
}

export async function migrateSurveyResponseMatching(surveyId?: string): Promise<MigrationResult> {
    console.log('🔄 Starting survey response matching migration...');
    
    const result: MigrationResult = {
        totalResponses: 0,
        responsesProcessed: 0,
        matchesUpdated: 0,
        errors: [],
        details: []
    };

    try {
        const supabase = getClient({ requiresAdmin: true });
        
        // Fetch survey responses
        let query = supabase
            .from('survey_responses')
            .select('*')
            .eq('completed', true);
            
        if (surveyId) {
            query = query.eq('survey_id', surveyId);
        }
        
        const { data: responses, error: fetchError } = await query;
        
        if (fetchError) {
            result.errors.push(`Failed to fetch responses: ${fetchError.message}`);
            return result;
        }
        
        if (!responses || responses.length === 0) {
            console.log('ℹ️ No completed survey responses found');
            return result;
        }
        
        result.totalResponses = responses.length;
        console.log(`📊 Found ${responses.length} completed survey responses to process`);
        
        // Process each response
        for (const response of responses) {
            try {
                result.responsesProcessed++;
                console.log(`\n🔍 Processing response ${response.id}...`);
                
                const mappingData = response.sound_mapping_responses as any;
                if (!mappingData?.sound_mapping) {
                    console.log(`⚠️ Response ${response.id} has no sound mapping data`);
                    continue;
                }
                
                let responseUpdated = false;
                const updatedSoundMapping = { ...mappingData.sound_mapping };
                
                // Process each sound mapping
                for (const [soundId, mapping] of Object.entries(mappingData.sound_mapping) as [string, any][]) {
                    const intended = mapping.intended;
                    const actual = mapping.actual;
                    const oldMatched = mapping.matched;
                    
                    if (!intended || !actual) {
                        console.log(`⚠️ Sound ${soundId} missing intended or actual text`);
                        continue;
                    }
                    
                    // Re-evaluate using improved matching logic
                    const newMatched = checkFunctionMatch(actual, intended);
                    
                    const detail = {
                        responseId: response.id,
                        soundId,
                        intended,
                        actual: actual.length > 50 ? actual.substring(0, 50) + '...' : actual,
                        oldMatched,
                        newMatched,
                        updated: oldMatched !== newMatched
                    };
                    
                    result.details.push(detail);
                    
                    if (oldMatched !== newMatched) {
                        console.log(`🔄 Sound ${soundId}: ${oldMatched} → ${newMatched}`);
                        console.log(`   Intended: "${intended}"`);
                        console.log(`   Actual: "${actual.substring(0, 100)}${actual.length > 100 ? '...' : ''}"`);
                        
                        // Update the mapping
                        updatedSoundMapping[soundId] = {
                            ...mapping,
                            matched: newMatched
                        };
                        
                        responseUpdated = true;
                        result.matchesUpdated++;
                    }
                }
                
                // Update the database if changes were made
                if (responseUpdated) {
                    const updatedMappingData = {
                        ...mappingData,
                        sound_mapping: updatedSoundMapping
                    };
                    
                    const { error: updateError } = await supabase
                        .from('survey_responses')
                        .update({
                            sound_mapping_responses: updatedMappingData
                        })
                        .eq('id', response.id);
                    
                    if (updateError) {
                        const errorMsg = `Failed to update response ${response.id}: ${updateError.message}`;
                        result.errors.push(errorMsg);
                        console.error(`❌ ${errorMsg}`);
                    } else {
                        console.log(`✅ Updated response ${response.id}`);
                    }
                }
                
            } catch (error) {
                const errorMsg = `Error processing response ${response.id}: ${error instanceof Error ? error.message : String(error)}`;
                result.errors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }
        }
        
        // Summary
        console.log('\n📋 Migration Summary:');
        console.log(`   Total responses: ${result.totalResponses}`);
        console.log(`   Responses processed: ${result.responsesProcessed}`);
        console.log(`   Matches updated: ${result.matchesUpdated}`);
        console.log(`   Errors: ${result.errors.length}`);
        
        if (result.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            result.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        return result;
        
    } catch (error) {
        const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        return result;
    }
}

// Utility function to preview changes without updating
export async function previewSurveyResponseMatching(surveyId?: string): Promise<MigrationResult> {
    console.log('👀 Previewing survey response matching changes...');
    
    const result: MigrationResult = {
        totalResponses: 0,
        responsesProcessed: 0,
        matchesUpdated: 0,
        errors: [],
        details: []
    };

    try {
        const supabase = getClient({ requiresAdmin: true });
        
        // Fetch survey responses
        let query = supabase
            .from('survey_responses')
            .select('*')
            .eq('completed', true);
            
        if (surveyId) {
            query = query.eq('survey_id', surveyId);
        }
        
        const { data: responses, error: fetchError } = await query;
        
        if (fetchError) {
            result.errors.push(`Failed to fetch responses: ${fetchError.message}`);
            return result;
        }
        
        if (!responses || responses.length === 0) {
            console.log('ℹ️ No completed survey responses found');
            return result;
        }
        
        result.totalResponses = responses.length;
        console.log(`📊 Found ${responses.length} completed survey responses`);
        
        // Process each response (preview only)
        for (const response of responses) {
            try {
                result.responsesProcessed++;
                
                const mappingData = response.sound_mapping_responses as any;
                if (!mappingData?.sound_mapping) {
                    continue;
                }
                
                // Process each sound mapping
                for (const [soundId, mapping] of Object.entries(mappingData.sound_mapping) as [string, any][]) {
                    const intended = mapping.intended;
                    const actual = mapping.actual;
                    const oldMatched = mapping.matched;
                    
                    if (!intended || !actual) {
                        continue;
                    }
                    
                    // Re-evaluate using improved matching logic
                    const newMatched = checkFunctionMatch(actual, intended);
                    
                    const detail = {
                        responseId: response.id,
                        soundId,
                        intended,
                        actual: actual.length > 50 ? actual.substring(0, 50) + '...' : actual,
                        oldMatched,
                        newMatched,
                        updated: oldMatched !== newMatched
                    };
                    
                    result.details.push(detail);
                    
                    if (oldMatched !== newMatched) {
                        result.matchesUpdated++;
                    }
                }
                
            } catch (error) {
                const errorMsg = `Error processing response ${response.id}: ${error instanceof Error ? error.message : String(error)}`;
                result.errors.push(errorMsg);
            }
        }
        
        // Summary
        console.log('\n📋 Preview Summary:');
        console.log(`   Total responses: ${result.totalResponses}`);
        console.log(`   Responses processed: ${result.responsesProcessed}`);
        console.log(`   Matches that would be updated: ${result.matchesUpdated}`);
        console.log(`   Errors: ${result.errors.length}`);
        
        return result;
        
    } catch (error) {
        const errorMsg = `Preview failed: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        return result;
    }
}