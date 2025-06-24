import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';
import { isRLSError, handleRLSError, verifyAuthorization } from '../../../utils/accessControl';
import type { AuthResponse, AuthError } from '../../../types/auth';

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
    return new Response(JSON.stringify({ error: 'No session found' }), {
      status: 401,
      headers
    });
  }

  try {
    const supabaseAdmin = getClient({ requiresAdmin: true });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      cookies.delete('sb-token', { path: '/' });
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers
      });
    }

    // Get user data - try with regular client first
    let userData = null;
    const supabase = getClient();
    const { data: regularData, error: regularError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (regularError) {
      if (isRLSError(regularError)) {
        // Fall back to admin client if RLS blocks access
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (adminError || !adminData) {
          cookies.delete('sb-token', { path: '/' });
          return new Response(JSON.stringify({
            error: 'User data not found',
            code: 'USER_NOT_FOUND'
          }), {
            status: 401,
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
      cookies.delete('sb-token', { path: '/' });
      return new Response(JSON.stringify({
        error: 'User data not found',
        code: 'USER_NOT_FOUND'
      }), {
        status: 401,
        headers
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

  } catch (error) {
    console.error('Session verification error:', error);
    cookies.delete('sb-token', { path: '/' });
    return new Response(JSON.stringify({ error: 'Session verification failed' }), {
      status: 401,
      headers
    });
  }
};