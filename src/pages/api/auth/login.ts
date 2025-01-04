// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import type { Database } from '../../../types/database';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';
import { isRLSError, handleRLSError } from '../../../utils/accessControl';

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

    // Step 1: Sign in with normalized email and password
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: authError?.message || 'Authentication failed' 
      }), { 
        status: 401,
        headers 
      });
    }

    // Step 2: Get user data - try with regular client first
    let userData = null;
    let userError = null;
    
    // First try with regular client
    const { data: regularData, error: regularError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (regularError) {
      if (isRLSError(regularError)) {
        // Fall back to admin client if RLS blocks access
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (adminError || !adminData) {
          return new Response(JSON.stringify({
            success: false,
            error: 'User data not found',
            code: 'USER_NOT_FOUND'
          }), {
            status: 404,
            headers
          });
        }
        userData = adminData;
      } else {
        return handleRLSError(regularError);
      }
    } else {
      userData = regularData;
    }

    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User data not found',
        code: 'USER_NOT_FOUND'
      }), {
        status: 404,
        headers
      });
    }

    // Step 3: Get client data if applicable - with RLS support
    let clientData = null;
    if (userData.client_id) {
      // First try with regular client
      const { data: regularClient, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userData.client_id)
        .single();

      if (clientError) {
        if (isRLSError(clientError)) {
          // Fall back to admin client if RLS blocks access
          const { data: adminClient } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('id', userData.client_id)
            .single();
          clientData = adminClient;
        } else {
          console.error('Error fetching client data:', clientError);
        }
      } else {
        clientData = regularClient;
      }
    }

    // Set the auth cookie with security flags
    cookies.set('sb-token', authData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: authData.session.expires_in,
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: clientData,
        createdAt: userData.created_at
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