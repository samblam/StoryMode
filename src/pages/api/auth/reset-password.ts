import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';
import { ValidationError, AuthError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('PASSWORD_RESET')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    const { email } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new ValidationError('Email is required', {
        field: 'email',
        value: email
      });
    }

    // Verify the user exists before sending reset email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userData) {
      throw new AuthError('No account found with this email', {
        email: normalizedEmail
      });
    }

    // Send password reset email through Supabase
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${new URL(request.url).origin}/reset-password/confirm`,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiErrorHandler(error, { request });
    }
    return apiErrorHandler(new Error('Failed to send reset link'), { request });
  }
};