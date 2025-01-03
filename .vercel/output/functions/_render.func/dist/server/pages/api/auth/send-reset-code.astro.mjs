import { supabaseAdmin } from '../../../chunks/supabase_D4M8dM3h.mjs';
import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
export { renderers } from '../../../renderers.mjs';

function generateResetCode() {
  return randomInt(1e5, 999999).toString();
}
const POST = async ({ request }) => {
  try {
    const { email } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400 }
      );
    }
    const { data: userData, error: userError } = await supabaseAdmin.from("users").select("id").eq("email", normalizedEmail).single();
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "No account found with this email" }),
        { status: 404 }
      );
    }
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1e3);
    const { error: resetError } = await supabaseAdmin.from("password_reset_codes").insert({
      user_id: userData.id,
      code,
      expires_at: expiresAt.toISOString()
    });
    if (resetError) {
      throw resetError;
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.purelymail.com",
      port: parseInt("587"),
      secure: false,
      auth: {
        user: "info@storymode.ca",
        pass: "StoryModeNickBenSam"
      }
    });
    try {
      await transporter.sendMail({
        from: `"Story Mode" <${"info@storymode.ca"}>`,
        to: normalizedEmail,
        subject: "Password Reset Code - Story Mode",
        html: `
          <h2>Password Reset Code</h2>
          <p>You've requested to reset your password. Enter the following code to continue:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px;">${code}</h1>
          <p>This code will expire in 30 minutes.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        `
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send password reset email. Please try again later." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to send reset code"
      }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
