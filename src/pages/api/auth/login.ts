// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import type { Database } from '../../../types/database';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';
import { AppError, AuthError, ValidationError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';

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
      throw new ValidationError('Please enter a valid email address', {
        email: normalizedEmail
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
      throw new AuthError(authError?.message || 'Authentication failed');
    }

    // Step 2: Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      throw new AppError(404, 'User data not found', 'notFound');
    }

    // Step 3: Get client data if applicable
    let clientData = null;
    if (userData.client_id) {
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', userData.client_id)
        .single();
      
      if (clientError) {
        throw new DatabaseError('Failed to retrieve client data', {
          clientId: userData.client_id,
          error: clientError.message
        });
      }
      clientData = client;
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

  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiErrorHandler(error, { request, cookies });
    }
    return apiErrorHandler(new Error('Unknown error occurred'), { request, cookies });
  }
};