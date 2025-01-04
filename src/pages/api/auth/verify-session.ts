import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';
import { AuthError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Apply rate limiting middleware
  const rateLimitResponse = await rateLimitMiddleware('API')(request);
  if (rateLimitResponse instanceof Response) {
    return rateLimitResponse;
  }
  Object.assign(headers, rateLimitResponse.headers);

  const token = cookies.get('sb-token')?.value;

  if (!token) {
    throw new AuthError('No session found');
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      cookies.delete('sb-token', { path: '/' });
      throw new AuthError('Invalid session', {
        token
      });
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      cookies.delete('sb-token', { path: '/' });
      throw new DatabaseError('User data not found', {
        userId: user.id
      });
    }

    // Extend session by setting cookie again
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    };

    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userData.role,
        clientId: userData.client_id,
        createdAt: user.created_at
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `sb-token=${token}; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`
      }
    });

  } catch (error: unknown) {
    cookies.delete('sb-token', { path: '/' });
    if (error instanceof Error) {
      return apiErrorHandler(error, { request, cookies });
    }
    return apiErrorHandler(new Error('Session verification failed'), { request, cookies });
  }
};