// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import type { Database } from '../../../types/database';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';
import { isRLSError, handleRLSError, verifyAuthorization } from '../../../utils/accessControl';
import type { AuthResponse, AuthError } from '../../../types/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('LOGIN')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    const { email, password } = await request.json();
    
    // Normalize email and validate format
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return new Response(JSON.stringify({ 
        error: 'Please enter a valid email address' 
      }), { 
        status: 400,
        headers 
      });
    }

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

    // Step 1: Initial Authentication
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      return new Response(JSON.stringify({
        success: false,
        error: authError.message
      }), {
        status: 401,
        headers
      });
    }

    if (!authData.session) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No session created'
      }), {
        status: 401,
        headers
      });
    }

    // Step 2: Set Auth Cookie
    cookies.set('sb-token', authData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Step 3: Get User Data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        client_id,
        client:clients(
          id,
          name,
          email,
          active
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch user data'
      }), {
        status: 500,
        headers
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: userData.client,
        createdAt: authData.user.created_at
      }
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Login process error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication failed'
    }), { 
      status: 500,
      headers 
    });
  }
};