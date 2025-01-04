import { supabase } from '../../../chunks/supabase_C0n-HHBb.mjs';
import { r as rateLimitMiddleware } from '../../../chunks/rateLimit_FwDC2vWM.mjs';
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
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
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
    const getUserResponse = await fetch(`${"https://iubzudsaueifxrwrqfjw.supabase.co"}/rest/v1/rpc/get_authenticated_user`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authData.session.access_token}`,
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Ynp1ZHNhdWVpZnhyd3JxZmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3Njc2NzQsImV4cCI6MjA0OTM0MzY3NH0.SNXX_0_NMSJqOKSMMxM5WP6sfR3zokgCgdJkH4s-xfg",
        "Content-Type": "application/json"
      }
    });
    if (!getUserResponse.ok) {
      console.error("Error fetching user data:", await getUserResponse.text());
      return new Response(JSON.stringify({
        success: false,
        error: "Error fetching user data"
      }), {
        status: 500,
        headers
      });
    }
    const userData = await getUserResponse.json();
    cookies.set("sb-token", authData.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
      // 1 week
    });
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
