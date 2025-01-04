import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';
import { ValidationError, AuthError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';

function generateResetCode(): string {
  return randomInt(100000, 999999).toString();
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

    const { email } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new ValidationError('Email is required', {
        field: 'email',
        value: email
      });
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !userData) {
      throw new AuthError('No account found with this email', {
        email: normalizedEmail
      });
    }

    // Generate and store reset code
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    const { error: resetError } = await supabaseAdmin
      .from('password_reset_codes')
      .insert({
        user_id: userData.id,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (resetError) {
      throw resetError;
    }

    // Send email with code
    const transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: parseInt(import.meta.env.SMTP_PORT),
      secure: false,
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"Story Mode" <${import.meta.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: "Password Reset Code - Story Mode",
        html: `
          <h2>Password Reset Code</h2>
          <p>You've requested to reset your password. Enter the following code to continue:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px;">${code}</h1>
          <p>This code will expire in 30 minutes.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        `,
      });
    } catch (error) {
      throw new Error('Failed to send password reset email', {
        cause: error
      });
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
    return apiErrorHandler(new Error('Failed to send reset code'), { request });
  }
};