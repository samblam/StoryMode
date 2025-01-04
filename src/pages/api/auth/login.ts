// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
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
    const normalizedEmail = email.trim().toLowerCase();

    // Step 1: Initial Authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
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

    // Step 2: Get user data with auth token
    const getUserResponse = await fetch(`${import.meta.env.PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_authenticated_user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'apikey': import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!getUserResponse.ok) {
      console.error('Error fetching user data:', await getUserResponse.text());
      return new Response(JSON.stringify({
        success: false,
        error: 'Error fetching user data'
      }), {
        status: 500,
        headers
      });
    }

    const userData = await getUserResponse.json();

    // Step 3: Set auth cookie only after successful data fetch
    cookies.set('sb-token', authData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

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