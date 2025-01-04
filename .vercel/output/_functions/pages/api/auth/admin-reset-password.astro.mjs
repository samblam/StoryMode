import { supabaseAdmin } from '../../../chunks/supabase_C0n-HHBb.mjs';
import { R as RateLimiter, a as RATE_LIMITS } from '../../../chunks/rateLimit_FwDC2vWM.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = RateLimiter.getKey(clientIp, "admin-reset-password");
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.PASSWORD_RESET);
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Too many password reset attempts. Please try again later."
      }), {
        status: 429,
        headers
      });
    }
    const { email, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        {
          status: 400,
          headers
        }
      );
    }
    const { data: userData, error: userError } = await supabaseAdmin.from("users").select("id").eq("email", normalizedEmail).single();
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers
        }
      );
    }
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password }
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
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to reset password"
      }),
      {
        status: 500,
        headers
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
