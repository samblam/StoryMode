import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';
import { validateField, COMMON_RULES, sanitizeInput } from '../../../utils/validation';

function validateInput(email: string, code: string, password: string) {
  if (!email || !code || !password) {
    return { error: 'Email, code, and password are required', status: 400 };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: 'Invalid code format', status: 400 };
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
    
    // Sanitize inputs
    const normalizedEmail = sanitizeInput(email.trim().toLowerCase());
    const sanitizedCode = sanitizeInput(code);
    const sanitizedPassword = sanitizeInput(password);

    // Validate email
    const emailValidation = validateField(normalizedEmail, COMMON_RULES.email);
    if (!emailValidation.valid) {
      return new Response(JSON.stringify({ error: emailValidation.message }), {
        status: 400,
      });
    }

    // Validate code
    if (!/^\d{6}$/.test(sanitizedCode)) {
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400,
      });
    }

    // Validate password
    const passwordValidation = validateField(sanitizedPassword, COMMON_RULES.password);
    if (!passwordValidation.valid) {
      return new Response(JSON.stringify({ error: passwordValidation.message }), {
        status: 400,
      });
    }

    // --- Get user by email ---
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // --- Verify reset code ---
    const { data: resetData, error: resetError } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('user_id', userData.id)
      .eq('code', sanitizedCode)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (resetError || !resetData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset code' }),
        { status: 400 }
      );
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
  } catch (error) {
    console.error('Password reset verification error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to verify reset code',
      }),
      { status: 500 }
    );
  }
};