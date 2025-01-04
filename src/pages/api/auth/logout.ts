import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';
import { AuthError, apiErrorHandler } from '../../../utils/errorHandler';

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AuthError('Failed to sign out', {
        error: error.message
      });
    }

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
  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiErrorHandler(error, { request, cookies });
    }
    return apiErrorHandler(new Error('Logout failed'), { request, cookies });
  }
};