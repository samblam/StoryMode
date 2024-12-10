import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Create a dummy sound profile
    console.log('Creating test sound profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('sound_profiles')
      .insert({
        title: `Test Profile ${new Date().toISOString()}`,
        description: 'Test profile created during connection test',
        slug: `test-profile-${Date.now()}`
      })
      .select()
      .single();

    if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`);
    console.log('Created profile:', profileData);

    // Create a dummy sound and link it to the profile
    console.log('Creating test sound...');
    const { data: soundData, error: soundError } = await supabase
      .from('sounds')
      .insert({
        name: `Test Sound ${new Date().toISOString()}`,
        description: 'Test sound created during connection test',
        file_path: '/test/dummy-sound.mp3',
        profile_id: profileData.id
      })
      .select()
      .single();

    if (soundError) throw new Error(`Failed to create sound: ${soundError.message}`);
    console.log('Created sound:', soundData);

    // Fetch all profiles with their related sounds
    console.log('Fetching all profiles and sounds...');
    const { data: allProfiles, error: fetchError } = await supabase
      .from('sound_profiles')
      .select(`
        *,
        sounds (*)
      `);

    if (fetchError) throw new Error(`Failed to fetch data: ${fetchError.message}`);
    console.log('All profiles and sounds:', allProfiles);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database operations successful',
        data: {
          createdProfile: profileData,
          createdSound: soundData,
          allProfiles: allProfiles
        }
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Test failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          message: error.message,
          cause: error.cause
        } : undefined
      }),
      { status: 500, headers }
    );
  }
};