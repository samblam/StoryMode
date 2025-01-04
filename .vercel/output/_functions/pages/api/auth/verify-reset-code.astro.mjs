import { supabaseAdmin } from '../../../chunks/supabase_C0n-HHBb.mjs';
import { r as rateLimitMiddleware } from '../../../chunks/rateLimit_FwDC2vWM.mjs';
export { renderers } from '../../../renderers.mjs';

function validateInput(email, code, password) {
  if (!email || !code || !password) {
    return { error: "Email, code, and password are required", status: 400 };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: "Invalid code format", status: 400 };
  }
  return null;
}
const POST = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const rateLimitResponse = await rateLimitMiddleware("PASSWORD_RESET")(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
    const { email, code, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    const validationError = validateInput(normalizedEmail, code, password);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError.error }), {
        status: validationError.status
      });
    }
    const { data: userData, error: userError } = await supabaseAdmin.from("users").select("id").eq("email", normalizedEmail).single();
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }
    const { data: resetData, error: resetError } = await supabaseAdmin.from("password_reset_codes").select("*").eq("user_id", userData.id).eq("code", code).eq("used", false).gte("expires_at", (/* @__PURE__ */ new Date()).toISOString()).single();
    if (resetError || !resetData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset code" }),
        { status: 400 }
      );
    }
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password }
    );
    if (updateError) {
      throw updateError;
    }
    const { error: updateCodeError } = await supabaseAdmin.from("password_reset_codes").update({ used: true, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", resetData.id);
    if (updateCodeError) {
      throw updateCodeError;
    }
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset verification error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to verify reset code"
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
