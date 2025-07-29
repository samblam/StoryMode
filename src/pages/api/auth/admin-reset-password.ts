import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { RateLimiter, RATE_LIMITS } from '../../../utils/rateLimit';

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limit
    const rateLimitKey = RateLimiter.getKey(clientIp, 'admin-reset-password');
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.PASSWORD_RESET);

    // Add rate limit headers
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));

    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many password reset attempts. Please try again later.'
      }), {
        status: 429,
        headers
      });
    }

    const { email, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400,
          headers
        }
      );
    }

    // First, verify the user exists using normalized email
    const supabase = getClient({ requiresAdmin: true });
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers
        }
      );
    }

    // Reset the password
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      userData.id,
      { password: password }
    );

    if (resetError) {
      throw resetError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to reset password'
      }),
      { 
        status: 500,
        headers
      }
    );
  }
};