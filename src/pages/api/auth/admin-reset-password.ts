import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { RateLimiter, RATE_LIMITS } from '../../../utils/rateLimit';
import { ValidationError, AuthError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';

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
      throw new ValidationError('Email and password are required', {
        fields: {
          email: !!normalizedEmail,
          password: !!password
        }
      });
    }

    // First, verify the user exists using normalized email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !userData) {
      throw new AuthError('User not found', {
        email: normalizedEmail
      });
    }

    // Reset the password
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiErrorHandler(error, { request });
    }
    return apiErrorHandler(new Error('Failed to reset password'), { request });
  }
};