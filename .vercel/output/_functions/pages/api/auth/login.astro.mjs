import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../chunks/supabase_CUwi8gWR.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
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
      undefined                                   ,
      undefined                                        ,
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
