import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
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

    // Get auth token from cookies
    const token = cookies.get('sb-token')?.value;
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!token && !accessToken && !refreshToken) {
      // If no tokens found, just clear cookies and return success
      const cookiesToClear = ['sb-token', 'sb-refresh-token', 'sb-access-token'];
      cookiesToClear.forEach(cookieName => {
        cookies.delete(cookieName, { path: '/' });
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'No active session found. Cookies cleared.'
      }), {
        status: 200,
        headers
      });
    }

    // If we have a token, verify the user first
    if (token) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError) {
        console.error('User verification error:', userError);
        // Continue with logout even if verification fails
      }

      if (user) {
        try {
          // Sign out the specific user's session
          await supabaseAdmin.auth.admin.signOut(user.id);
        } catch (signOutError) {
          console.error('Sign out error:', signOutError);
          // Continue with cookie cleanup even if signOut fails
        }
      }
    } else if (accessToken && refreshToken) {
      // If we have access and refresh tokens, try to set the session and sign out
      try {
        await supabaseAdmin.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        await supabaseAdmin.auth.signOut({
          scope: 'global'
        });
      } catch (sessionError) {
        console.error('Session error:', sessionError);
        // Continue to cookie cleanup even if session operations fail
      }
    }

    // Clear all auth-related cookies
    const cookiesToClear = ['sb-token', 'sb-refresh-token', 'sb-access-token'];
    cookiesToClear.forEach(cookieName => {
      cookies.delete(cookieName, { path: '/' });
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Attempt to clear cookies even if logout fails
    try {
      const cookiesToClear = ['sb-token', 'sb-refresh-token', 'sb-access-token'];
      cookiesToClear.forEach(cookieName => {
        cookies.delete(cookieName, { path: '/' });
      });
    } catch (cookieError) {
      console.error('Failed to clear cookies:', cookieError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
      message: 'An error occurred during logout. Please try again.'
    }), {
      status: 500,
      headers
    });
  }
};