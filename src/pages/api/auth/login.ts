import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
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

    // Test database connection first
    console.log('Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .single();

    if (testError) {
      console.error('Database connection test failed:', testError);
      throw new Error('Database connection failed');
    }
    console.log('Database connection successful');

    // Try to get user with both clients
    console.log('Attempting to fetch user data with ID:', userId);
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        clients(*)
      `)
      .eq('id', userId);

    console.log('Raw query response:', { data: userData, error: userError });

    if (userError) {
      console.error('User query error:', userError);
      throw new Error('Failed to fetch user data');
    }

    // Let's try a simpler query if the join fails
    if (!userData || userData.length === 0) {
      console.log('Attempting simple user query without joins...');
      const { data: basicUserData, error: basicError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId);

      console.log('Simple query response:', { data: basicUserData, error: basicError });

      if (basicError || !basicUserData || basicUserData.length === 0) {
        console.error('Simple user query failed:', basicError);
        throw new Error('User not found in database');
      }

      // We found the user with the simple query
      const user = basicUserData[0];
      console.log('Found user with simple query:', user);

      // Set auth cookie
      const {session} = authData;
      cookies.set('sb-token', session.access_token, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        maxAge: session.expires_in
      });

      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          clientId: user.client_id,
          client: null // No client data in simple query
        }
      }), { status: 200 });
    }

    // We got user data with the join query
    const user = userData[0];
    console.log('Found user with join query:', user);

    // Set auth cookie
    const session = authData.session;
    cookies.set('sb-token', session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: session.expires_in
    });

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.client_id,
        client: user.clients
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Login process error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Authentication failed',
        details: error instanceof Error ? error.cause : undefined
      }),
      { status: 401 }
    );
  }
};