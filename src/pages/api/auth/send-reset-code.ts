import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import nodemailer from 'nodemailer';

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400 }
      );
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'No account found with this email' }),
        { status: 404 }
      );
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

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send reset code',
      }),
      { status: 500 }
    );
  }
};