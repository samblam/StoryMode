import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Test basic connection first
    const healthCheck = await fetch(import.meta.env.PUBLIC_SUPABASE_URL);
    if (!healthCheck.ok) {
      throw new Error(`Failed to connect to Supabase: ${healthCheck.statusText}`);
    }

    // Test database query
    const { data: connectionTest, error: connectionError } = await supabase
      .from('sound_profiles')
      .select('*')
      .limit(1);

    if (connectionError) {
      console.error('Database query failed:', connectionError);
      throw new Error(`Database query failed: ${connectionError.message}`);
    }

    // Create a test profile
    const testProfile = {
      title: `Test Profile ${new Date().toISOString()}`,
      description: 'This is a test sound profile created to verify database connectivity',
      slug: `test-profile-${Date.now()}`
    };

    const { data, error } = await supabase
      .from('sound_profiles')
      .insert(testProfile)
      .select()
      .single();

    if (error) {
      console.error('Profile creation failed:', error);
      throw new Error(`Failed to create test profile: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Connection successful and test profile created',
        data
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Supabase operation error:', error);
    
    let errorMessage = 'Failed to connect to Supabase';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { status: 500, headers }
    );
  }
};