import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('API')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    // Sign out from Supabase
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear the auth cookie
    cookies.delete('sb-token', {
      path: '/',
    });

    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed'
    }), {
      status: 500,
      headers
    });
  }
};