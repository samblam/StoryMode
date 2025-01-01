import { supabaseAdmin } from '../../../chunks/supabase_BytQILit.mjs';
export { renderers } from '../../../renderers.mjs';

const rateLimitStore = /* @__PURE__ */ new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1e3;
function validateInput(email, code, password) {
  if (!email || !code || !password) {
    return { error: "Email, code, and password are required", status: 400 };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: "Invalid code format", status: 400 };
  }
  return null;
}
function isRateLimited(key) {
  const record = rateLimitStore.get(key);
  if (!record) return false;
  const now = Date.now();
  if (now - record.lastReset > WINDOW_MS) {
    record.count = 0;
    record.lastReset = now;
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}
function incrementRateLimit(key) {
  const record = rateLimitStore.get(key);
  const now = Date.now();
  if (!record) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
  } else if (now - record.lastReset > WINDOW_MS) {
    record.count = 1;
    record.lastReset = now;
  } else {
    record.count++;
  }
}
const POST = async ({ request, clientAddress }) => {
  try {
    const { email, code, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    const emailKey = `email:${normalizedEmail}`;
    const ipKey = `ip:${clientAddress}`;
    if (isRateLimited(emailKey) || isRateLimited(ipKey)) {
      return new Response(
        JSON.stringify({ error: "Too many requests, please try again later." }),
        { status: 429 }
      );
    }
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
    incrementRateLimit(emailKey);
    incrementRateLimit(ipKey);
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
