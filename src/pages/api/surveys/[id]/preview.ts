import { getClient } from '~/lib/supabase';
import { type APIRoute } from 'astro';
import { verifyAuthorization } from '../../../../utils/accessControl';
import { getSignedUrl } from '../../../../utils/storageUtils';

// Functions are stored as simple strings in a JSONB array

interface SurveySound {
  id: string;
  sound_id: string;
  intended_function: string;
  order_index: number;
  sounds: {
    id: string;
    name: string;
    storage_path: string;
    file_path: string;
    url?: string; // URL is added dynamically after fetching
  };
}

export const GET: APIRoute = async ({ params, locals }) => {
  const surveyId = params.id;
  if (!surveyId) {
    return new Response(JSON.stringify({ error: 'Survey ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify admin authorization
    console.log('Preview API - User:', locals.user ? {
      id: locals.user.id,
      role: locals.user.role,
      email: locals.user.email
    } : 'No user in locals');
    
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'read');
    
    if (!authorized) {
      console.log('Preview API - Authorization failed:', authError);
      
      // For testing purposes, we'll continue anyway
      console.log('Preview API - Bypassing authorization for testing');
      
      // Uncomment the following to enforce authorization in production
      
      return new Response(JSON.stringify({ error: authError }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } else {
      console.log('Preview API - User authorized successfully');
    }

    getClient({ requiresAdmin: true });

    console.log('Preview API - Fetching survey data for ID:', surveyId);
    
    // Get survey details with all related data needed for preview
    // Use admin client to bypass RLS
    const adminClient = getClient({ requiresAdmin: true });
    // Use a simpler query format to avoid parsing issues
    // Remove direct reference to 'sounds' as there's no direct relationship with 'surveys'
    const { data: survey, error: surveyError } = await adminClient
      .from('surveys')
      .select(`
        *,
        client:clients (
          id,
          name,
          email
        ),
        sound_profile:sound_profiles (
          id,
          title,
          description,
          sounds (
            id,
            name,
            storage_path,
            file_path
          )
        ),
        survey_sounds(id,sound_id,intended_function,order_index,sounds(id,name,storage_path))
      `)
      .eq('id', surveyId)
      .single();

    if (surveyError) {
      console.error('Error fetching survey:', surveyError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch survey data',
        details: surveyError.message,
        code: surveyError.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Preview API - Survey data retrieved successfully');

    if (!survey) {
      return new Response(JSON.stringify({ error: 'Survey not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Generate signed URL for video if available
    if (survey.video_url) {
      try {
        console.log('Preview API - Generating signed URL for video:', survey.video_url);
        survey.video = {
          url: await getSignedUrl(survey.video_url, 'videos')
        };
        console.log('Preview API - Generated video URL successfully');
      } catch (error) {
        console.error('Error generating signed URL for video:', error);
        // Don't throw, we can still continue with the preview
      }
    } else if (survey.video_path) {
      // Try with video_path if video_url is not available
      try {
        console.log('Preview API - Generating signed URL for video using video_path:', survey.video_path);
        survey.video = {
          url: await getSignedUrl(survey.video_path, 'videos')
        };
        console.log('Preview API - Generated video URL successfully using video_path');
      } catch (error) {
        console.error('Error generating signed URL for video using video_path:', error);
      }
    }

    // Generate signed URLs for all sounds in survey_sounds
    if (survey.survey_sounds && survey.survey_sounds.length > 0) {
      console.log('Preview API - Generating signed URLs for survey sounds');
      await Promise.all(
        survey.survey_sounds.map(async (surveySound: SurveySound) => {
          try {
            if (surveySound.sounds?.storage_path) {
              // Add url property since we no longer have it from the query
              if (!surveySound.sounds.url) {
                surveySound.sounds.url = await getSignedUrl(surveySound.sounds.storage_path, 'sounds');
                console.log(`Preview API - Generated URL for survey sound ${surveySound.sound_id}: ${surveySound.sounds.url}`);
              }
            }
          } catch (error: any) { // Explicitly type error as any
            console.error(`Error generating signed URL for survey sound ${surveySound.sound_id}: ${error.message}`);
            // Don't throw, just continue with other sounds
          }
        })
      );
    }
    
    // Generate signed URLs for all sounds in sound profile
    if (survey.sound_profile?.sounds && Array.isArray(survey.sound_profile.sounds)) {
      console.log('Preview API - Generating signed URLs for sound profile sounds');
      await Promise.all(
        survey.sound_profile.sounds.map(async (sound: any) => {
          try {
            if (sound?.storage_path) {
              // Add url property if it doesn't exist
              if (!sound.url) {
                sound.url = await getSignedUrl(sound.storage_path, 'sounds');
                console.log(`Preview API - Generated URL for profile sound ${sound.id}: ${sound.url}`);
              }
            }
          } catch (error: any) { // Explicitly type error as any
            console.error(`Error generating signed URL for profile sound ${sound.id}: ${error.message}`);
            // Don't throw, just continue with other sounds
          }
        })
      );
    }

    // Validate required survey data
    console.log('Preview API - Validating survey data');
    
    // For testing purposes, we'll create default values if missing
    if (!survey.sound_profile) {
      console.warn('Preview API - Survey sound profile not found, creating a placeholder');
      survey.sound_profile = {
        id: 'placeholder-profile',
        title: 'Placeholder Profile',
        description: 'This is a placeholder profile for preview',
        sounds: [
          {
            id: 'placeholder-sound-id',
            name: 'Placeholder Sound',
            storage_path: 'placeholder.mp3',
            file_path: 'placeholder.mp3',
            url: 'https://example.com/placeholder.mp3' // Add URL directly for placeholder
          }
        ]
      };
      console.log('Preview API - Created placeholder sound profile with sample sound');
    } else {
      console.log('Preview API - Sound profile found:', survey.sound_profile.title);
      
      // Ensure all sounds in the profile have the required fields
      if (survey.sound_profile.sounds && Array.isArray(survey.sound_profile.sounds)) {
        survey.sound_profile.sounds.forEach((sound: any) => {
          if (!sound.storage_path && !sound.file_path && sound.url) {
            // If we have a URL but no storage_path, create placeholder values
            sound.storage_path = 'placeholder.mp3';
            sound.file_path = 'placeholder.mp3';
          }
        });
        console.log('Preview API - Sound profile has', survey.sound_profile.sounds.length, 'sounds');
      } else {
        console.warn('Preview API - Sound profile has no sounds array or it is not an array');
        // Initialize sounds array if it doesn't exist or is not an array
        survey.sound_profile.sounds = [
          {
            id: 'placeholder-sound-id',
            name: 'Placeholder Sound',
            storage_path: 'placeholder.mp3',
            file_path: 'placeholder.mp3',
            url: 'https://example.com/placeholder.mp3' // Add URL directly for placeholder
          }
        ];
        console.log('Preview API - Added placeholder sound to sound profile');
      }
    }

    if (!survey.functions?.length) {
      console.warn('Preview API - Survey functions not configured, creating placeholders');
      survey.functions = ['Placeholder Function'];
    } else {
      console.log('Preview API - Functions found:', survey.functions.length);
    }

    if (!survey.survey_sounds?.length) {
      console.warn('Preview API - Survey sounds not configured, creating placeholders');
      survey.survey_sounds = [{
        id: 'placeholder-sound',
        sound_id: 'placeholder-sound-id',
        intended_function: 'Placeholder',
        order_index: 0,
        sounds: {
          id: 'placeholder-sound-id',
          name: 'Placeholder Sound',
          storage_path: 'placeholder.mp3',
          file_path: 'placeholder.mp3',
          url: 'https://example.com/placeholder.mp3' // Add URL directly for placeholder
        }
      }];
    } else {
      console.log('Preview API - Survey sounds found:', survey.survey_sounds.length);
      
      // Ensure all survey sounds have the required fields
      survey.survey_sounds.forEach((surveySound: any) => {
        if (!surveySound.sounds) {
          console.warn(`Preview API - Survey sound ${surveySound.id} has no sounds object, creating placeholder`);
          surveySound.sounds = {
            id: `placeholder-sound-for-${surveySound.id}`,
            name: 'Placeholder Sound',
            storage_path: 'placeholder.mp3',
            file_path: 'placeholder.mp3',
            url: 'https://example.com/placeholder.mp3' // Add URL directly for placeholder
          };
        } else if (!surveySound.sounds.storage_path) {
          console.warn(`Preview API - Survey sound ${surveySound.id} has no storage_path, adding placeholder`);
          surveySound.sounds.storage_path = 'placeholder.mp3';
          surveySound.sounds.file_path = surveySound.sounds.file_path || 'placeholder.mp3';
          surveySound.sounds.url = surveySound.sounds.url || 'https://example.com/placeholder.mp3';
        }
      });
    }

    // Create a preview context that mimics participant view
    const previewContext = {
      survey: {
        ...survey,
        // Functions are already an array of strings, no need to sort
        // Sort survey sounds by order_index
        survey_sounds: (survey.survey_sounds as SurveySound[]).sort((a: SurveySound, b: SurveySound) => a.order_index - b.order_index),
        // Ensure client data is included
        client: survey.client
      },
      isPreview: true, // Flag to indicate preview mode
      participant: {
        id: 'preview',
        email: 'preview@example.com',
        status: 'active',
        participant_identifier: 'PREVIEW_USER',
        created_at: new Date().toISOString(),
        survey_id: surveyId
      },
      // Add preview-specific settings
      settings: {
        allowSkip: true, // Allow skipping in preview mode
        showDebugInfo: true, // Show additional debug information
        saveResponses: false // Don't save responses in preview mode
      }
    };

    // Log the preview context for debugging
    console.log('Preview API - Preview context created with client data:', survey.client ? 'Yes' : 'No');

    const responseBody = JSON.stringify(previewContext);
    console.log('Preview API - Response body size:', responseBody.length, 'bytes');
    // Log headers just before sending the response
    const headers = { 'Content-Type': 'application/json' };
    console.log('Preview API - Response headers:', headers);

    return new Response(responseBody, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error generating survey preview:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};