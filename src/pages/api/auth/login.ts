import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const { email, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    console.log('Login attempt for:', normalizedEmail);

    // Step 1: Auth sign in
    console.log('Attempting Supabase auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 401, headers }
      );
    }

    if (!authData.user || !authData.session) {
      console.error('No user or session returned from auth');
      return new Response(
        JSON.stringify({ error: 'Authentication failed - no user data returned' }),
        { status: 401, headers }
      );
    }

    console.log('Auth successful for user ID:', authData.user.id);

    // Set auth cookie
    cookies.set('sb-token', authData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    // Return success without querying users table
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: 'admin', // Hardcode for now to get past the login
          createdAt: authData.user.created_at
        }
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Unexpected login error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Authentication failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }),
      { status: 500, headers }
    );
  }
};