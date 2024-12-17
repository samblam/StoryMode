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

    // Debug: Log the query we're about to make
    console.log('Attempting to fetch user data with query:', {
      table: 'users',
      id: userId,
      query: 'select * from users where id = $1'
    });

    // Using supabaseAdmin instead of supabase for database queries
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId);

    // Debug: Log the raw response
    console.log('Database response:', {
      data: userData,
      error: userError
    });

    if (userError) {
      console.error('User data error:', userError);
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    if (!userData || userData.length === 0) {
      // Debug: Double check if user exists with a count query using admin client
      const { count, error: countError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('id', userId);
      
      console.log('Count check result:', { count, error: countError });
      
      throw new Error(`User not found in database. Count result: ${count}`);
    }

    const user = userData[0];
    console.log('Found user data:', user);

    // Now get the client data if needed, using admin client
    let clientData = null;
    if (user.client_id) {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', user.client_id)
        .single();
      clientData = client;
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

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.client_id,
        client: clientData,
        createdAt: user.created_at
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Login process error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Authentication failed',
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }),
      { status: 401 }
    );
  }
};