import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { rateLimitMiddleware } from '../../utils/rateLimit';

export const GET: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('CONTACT')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    // Step 1: Test basic connection
    console.log('Testing basic connection...');
    const { error: connectionError } = await supabase
      .from('sound_profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      throw new Error(`Connection test failed: ${connectionError.message}`);
    }

    // Step 2: Create test profile
    console.log('Creating test sound profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('sound_profiles')
      .insert({
        title: `Test Profile ${new Date().toISOString()}`,
        description: 'Test profile created during connection test',
        slug: `test-profile-${Date.now()}`,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    if (!profileData?.id) {
      throw new Error('Profile created but no ID returned');
    }

    console.log('Created profile:', profileData);

    // Step 3: Create test sound
    console.log('Creating test sound...');
    const { data: soundData, error: soundError } = await supabase
      .from('sounds')
      .insert({
        name: `Test Sound ${new Date().toISOString()}`,
        description: 'Test sound created during connection test',
        file_path: '/test/dummy-sound.mp3',
        profile_id: profileData.id,
      })
      .select()
      .single();

    if (soundError) {
      throw new Error(`Failed to create sound: ${soundError.message}`);
    }

    console.log('Created sound:', soundData);

    // Step 4: Verify relationship by fetching profiles with sounds
    console.log('Verifying relationship...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('sound_profiles')
      .select(
        `
        *,
        sounds (*)
      `
      )
      .eq('id', profileData.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify relationship: ${verifyError.message}`);
    }

    if (!verifyData.sounds?.length) {
      throw new Error(
        'Relationship verification failed: No associated sounds found'
      );
    }

    // If we get here, all steps succeeded
    return new Response(
      JSON.stringify({
        success: true,
        message: 'All database operations successful',
        data: {
          createdProfile: profileData,
          createdSound: soundData,
          verification: verifyData,
        },
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Test failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                name: error instanceof Error ? error.name : 'Unknown',
                message:
                  error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
              }
            : undefined,
      }),
      { status: 500, headers }
    );
  }
};
