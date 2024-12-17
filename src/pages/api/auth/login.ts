import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    // Create a new Supabase client for this request
    const supabaseAuth = createClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Step 1: Sign in with email and password
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Authentication error:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('No user returned from auth');
      throw new Error('Authentication failed - no user returned');
    }

    const userId = authData.user.id;
    console.log('Auth successful for user:', userId);

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, clients(*)')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      throw new Error('Failed to fetch user data');
    }

    // Set the auth cookie
    const session = authData.session;
    cookies.set('sb-token', session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: session.expires_in
    });

    return new Response(
      JSON.stringify({
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          clientId: userData.client_id,
          client: userData.clients,
          createdAt: userData.created_at
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Login process error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Authentication failed'
      }),
      { status: 401 }
    );
  }
};