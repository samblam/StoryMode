import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../chunks/supabase_D4M8dM3h.mjs';
import { r as rateLimitMiddleware } from '../../../chunks/rateLimit_C37W6zoK.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const rateLimitResponse = await rateLimitMiddleware("LOGIN")(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
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
    if (authError) {
      return new Response(JSON.stringify({
        success: false,
        error: authError.message
      }), {
        status: 401,
        headers
      });
    }
    if (!authData.session) {
      return new Response(JSON.stringify({
        success: false,
        error: "No session created"
      }), {
        status: 401,
        headers
      });
    }
    cookies.set("sb-token", authData.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
      // 1 week
    });
    const { data: userData, error: userError } = await supabase.from("users").select(`
        id,
        email,
        role,
        client_id,
        client:clients(
          id,
          name,
          email,
          active
        )
      `).eq("id", authData.user.id).single();
    if (userError) {
      console.error("Error fetching user data:", userError);
      return new Response(JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: "client",
          // Default role
          createdAt: authData.user.created_at
        }
      }), {
        status: 200,
        headers
      });
    }
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: userData.client,
        createdAt: authData.user.created_at
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
