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

    // Sign in with email and password
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // Get user role and client info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        clients (
          id,
          name,
          company,
          active
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;

    // Check if user exists and is active
    if (!userData) throw new Error('User not found');
    if (userData.clients && !userData.clients.active) {
      throw new Error('Account is inactive. Please contact support.');
    }

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
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: userData.clients
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Authentication failed'
      }),
      { status: 401 }
    );
  }
};