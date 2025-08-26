import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { getClient } from '../../../lib/supabase';
import type { Database } from '../../../types/database';
import { rateLimitMiddleware } from '../../../utils/rateLimit';

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('[LOGIN API] ==================== STARTING LOGIN REQUEST ====================');
  console.log('[LOGIN API] Request method:', request.method);
  console.log('[LOGIN API] Request URL:', request.url);
  console.log('[LOGIN API] Content-Type header:', request.headers.get('content-type'));
  console.log('[LOGIN API] All headers:', Object.fromEntries(request.headers.entries()));
  
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    console.log('[LOGIN API] Applying rate limiting middleware...');
    const rateLimitResponse = await rateLimitMiddleware('LOGIN')(request);
    if (rateLimitResponse instanceof Response) {
      console.log('[LOGIN API] Rate limit response returned, blocking request');
      return rateLimitResponse;
    }
    console.log('[LOGIN API] Rate limiting passed, adding headers:', rateLimitResponse.headers);
    Object.assign(headers, rateLimitResponse.headers);

    console.log('[LOGIN API] Attempting to parse request body...');
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('[LOGIN API] Request body parsed successfully');
    } catch (jsonError) {
      console.error('[LOGIN API] Failed to parse JSON:', jsonError);
      const text = await request.text();
      console.log('[LOGIN API] Raw request body:', text);
      throw new Error(`Invalid JSON in request body: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
    }
    
    const { email, password } = requestBody;
    
    console.log('[LOGIN API] Email present:', !!email, 'Password present:', !!password);
    
    // Normalize email and validate format
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[LOGIN API] Normalized email:', normalizedEmail);
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      console.log('[LOGIN API] Invalid email format, returning error');
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
    console.log('[LOGIN API] Attempting Supabase authentication...');
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      console.log('[LOGIN API] Authentication failed:', authError.message);
      return new Response(JSON.stringify({
        success: false,
        error: authError.message
      }), {
        status: 401,
        headers
      });
    }
    console.log('[LOGIN API] Authentication successful, user ID:', authData.user?.id);

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
    const supabase = getClient();
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

    // Don't fail completely if user data fetch fails
    if (userError) {
      console.error('Error fetching user data:', userError);
      // Return minimal user data from auth
      return new Response(JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: 'client', // Default role
          createdAt: authData.user.created_at
        }
      }), {
        status: 200,
        headers
      });
    }

    // Return success response
    console.log('[LOGIN API] Returning successful login response');
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
    console.error('[LOGIN API] ==================== LOGIN ERROR ====================');
    console.error('[LOGIN API] Error type:', typeof error);
    console.error('[LOGIN API] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[LOGIN API] Error message:', error instanceof Error ? error.message : error);
    console.error('[LOGIN API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[LOGIN API] Full error object:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication failed'
    }), {
      status: 500,
      headers
    });
  }
};