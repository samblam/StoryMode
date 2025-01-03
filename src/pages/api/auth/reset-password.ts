import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { rateLimitMiddleware } from '../../../utils/rateLimit';

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
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400 }
      );
    }

    // Verify the user exists before sending reset email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'No account found with this email' }),
        { status: 404 }
      );
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
  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send reset link',
      }),
      { status: 500 }
    );
  }
};