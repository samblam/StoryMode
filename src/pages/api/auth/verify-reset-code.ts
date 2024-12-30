// src/pages/api/auth/verify-reset-code.ts
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, code, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !code || !password) {
      return new Response(
        JSON.stringify({ error: 'Email, code, and password are required' }),
        { status: 400 }
      );
    }

    // Validate code format (must be exactly 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format' }),
        { status: 400 }
      );
    }

    // Get user by email
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

    // Verify reset code using service role
    const { data: resetData, error: resetError } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('user_id', userData.id)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (resetError || !resetData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset code' }),
        { status: 400 }
      );
    }

    // Mark code as used
    const { error: updateCodeError } = await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq('id', resetData.id);

    if (updateCodeError) {
      throw updateCodeError;
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password }
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset verification error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to verify reset code'
      }),
      { status: 500 }
    );
  }
};