import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

// In-memory rate limit store (replace with Redis or similar in production)
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();
const MAX_ATTEMPTS = 5; // Max attempts per window
const WINDOW_MS = 60 * 60 * 1000; // 1-hour window (in milliseconds)

function validateInput(email: string, code: string, password: string) {
  if (!email || !code || !password) {
    return { error: 'Email, code, and password are required', status: 400 };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: 'Invalid code format', status: 400 };
  }
  return null;
}

// Function to check if a key (email or IP) is rate-limited
function isRateLimited(key: string): boolean {
  const record = rateLimitStore.get(key);
  if (!record) return false;

  const now = Date.now();
  if (now - record.lastReset > WINDOW_MS) {
    // Window expired, reset the count
    record.count = 0;
    record.lastReset = now;
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

// Function to increment the rate limit counter for a key
function incrementRateLimit(key: string): void {
  const record = rateLimitStore.get(key);
  const now = Date.now();

  if (!record) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
  } else if (now - record.lastReset > WINDOW_MS) {
    // Window expired, reset
    record.count = 1;
    record.lastReset = now;
  } else {
    record.count++;
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const { email, code, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    // --- RATE LIMITING ---
    const emailKey = `email:${normalizedEmail}`;
    const ipKey = `ip:${clientAddress}`;

    if (isRateLimited(emailKey) || isRateLimited(ipKey)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests, please try again later.' }),
        { status: 429 }
      );
    }

    // --- Input Validation ---
    const validationError = validateInput(normalizedEmail, code, password);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError.error }), {
        status: validationError.status,
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

    // --- Increment rate limit counters AFTER password update ---
    incrementRateLimit(emailKey);
    incrementRateLimit(ipKey);

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