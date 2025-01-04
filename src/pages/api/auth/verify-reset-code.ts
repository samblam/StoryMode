import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';
import { ValidationError, AuthError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';
function validateInput(email: string, code: string, password: string) {
  if (!email || !code || !password) {
    throw new ValidationError('Email, code, and password are required', {
      fields: {
        email: !!email,
        code: !!code,
        password: !!password
      }
    });
  }
  if (!/^\d{6}$/.test(code)) {
    throw new ValidationError('Invalid code format', {
      code,
      expectedFormat: '6 digits'
    });
  }
  return null;
}

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

    const { email, code, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    // --- Input Validation ---
    validateInput(normalizedEmail, code, password);

    // --- Get user by email ---
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

    // --- Verify reset code ---
    const { data: resetData, error: resetError } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('user_id', userData.id)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (resetError || !resetData) {
      throw new AuthError('Invalid or expired reset code', {
        code,
        userId: userData.id
      });
    }

    // --- Update password FIRST ---
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password }
    );

    if (updateError) {
      throw updateError;
    }

    // --- Mark code as used AFTER successful password update ---
    const { error: updateCodeError } = await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq('id', resetData.id);

    if (updateCodeError) {
      throw updateCodeError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiErrorHandler(error, { request });
    }
    return apiErrorHandler(new Error('Failed to verify reset code'), { request });
  }
};