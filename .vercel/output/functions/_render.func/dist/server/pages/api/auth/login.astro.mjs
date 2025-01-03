import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../chunks/supabase_D4M8dM3h.mjs';
export { renderers } from '../../../renderers.mjs';

const rateLimitStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.lastReset > 24 * 60 * 60 * 1e3) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1e3);
const RATE_LIMITS = {
  // Authentication
  LOGIN: { windowMs: 15 * 60 * 1e3, maxAttempts: 5 },
  // 5 attempts per 15 minutes
  PASSWORD_RESET: { windowMs: 60 * 60 * 1e3, maxAttempts: 3 },
  // 3 attempts per hour
  CREATE_USER: { windowMs: 24 * 60 * 60 * 1e3, maxAttempts: 10 },
  // 10 new users per day
  // File Operations
  UPLOAD: { windowMs: 60 * 60 * 1e3, maxAttempts: 50 },
  // 50 uploads per hour
  DELETE: { windowMs: 60 * 60 * 1e3, maxAttempts: 30 },
  // 30 deletions per hour
  // Public APIs
  CONTACT: { windowMs: 60 * 60 * 1e3, maxAttempts: 5 },
  // 5 contact emails per hour
  API: { windowMs: 60 * 1e3, maxAttempts: 100 }
  // 100 API calls per minute
};
class RateLimiter {
  /**
   * Check if an action should be rate limited
   * @param key Unique identifier (e.g., IP + endpoint or user ID + action)
   * @param config Rate limit configuration
   * @returns Result containing success status and remaining attempts
   */
  static check(key, config) {
    const now = Date.now();
    const record = rateLimitStore.get(key);
    if (!record) {
      rateLimitStore.set(key, {
        attempts: 1,
        lastReset: now
      });
      return {
        success: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs)
      };
    }
    if (now - record.lastReset > config.windowMs) {
      record.attempts = 1;
      record.lastReset = now;
      rateLimitStore.set(key, record);
      return {
        success: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs)
      };
    }
    if (record.attempts >= config.maxAttempts) {
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(record.lastReset + config.windowMs)
      };
    }
    record.attempts++;
    rateLimitStore.set(key, record);
    return {
      success: true,
      remaining: config.maxAttempts - record.attempts,
      resetAt: new Date(record.lastReset + config.windowMs)
    };
  }
  /**
   * Helper function to get a unique key combining IP and endpoint
   */
  static getKey(ip, endpoint) {
    return `${ip}:${endpoint}`;
  }
  /**
   * Helper function to generate rate limit headers
   */
  static getHeaders(result) {
    return {
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.resetAt ? result.resetAt.toISOString() : "",
      ...result.success ? {} : { "Retry-After": Math.ceil((result.resetAt.getTime() - Date.now()) / 1e3).toString() }
    };
  }
}

const POST = async ({ request, cookies }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = RateLimiter.getKey(clientIp, "login");
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.LOGIN);
    const rateLimitHeaders = RateLimiter.getHeaders(rateLimitResult);
    Object.assign(headers, rateLimitHeaders);
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Too many login attempts. Please try again later."
      }), {
        status: 429,
        headers
      });
    }
    const { email, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return new Response(JSON.stringify({
        error: "Please enter a valid email address"
      }), {
        status: 400,
        headers
      });
    }
    const supabaseAuth = createClient(
      "https://iubzudsaueifxrwrqfjw.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Ynp1ZHNhdWVpZnhyd3JxZmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3Njc2NzQsImV4cCI6MjA0OTM0MzY3NH0.SNXX_0_NMSJqOKSMMxM5WP6sfR3zokgCgdJkH4s-xfg",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    if (authError || !authData.user) {
      return new Response(JSON.stringify({
        success: false,
        error: authError?.message || "Authentication failed"
      }), {
        status: 401,
        headers
      });
    }
    const { data: userData, error: userError } = await supabaseAdmin.from("users").select("*").eq("id", authData.user.id).single();
    if (userError || !userData) {
      return new Response(JSON.stringify({
        success: false,
        error: "User data not found"
      }), {
        status: 404,
        headers
      });
    }
    let clientData = null;
    if (userData.client_id) {
      const { data: client } = await supabaseAdmin.from("clients").select("*").eq("id", userData.client_id).single();
      clientData = client;
    }
    cookies.set("sb-token", authData.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: authData.session.expires_in
    });
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: clientData,
        createdAt: userData.created_at
      }
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Login process error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Authentication failed"
    }), {
      status: 500,
      headers
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
