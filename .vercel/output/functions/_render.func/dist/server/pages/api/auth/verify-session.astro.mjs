import { supabaseAdmin } from '../../../chunks/supabase_CUwi8gWR.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const token = cookies.get("sb-token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "No session found" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      cookies.delete("sb-token", { path: "/" });
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { data: userData, error: userError } = await supabaseAdmin.from("users").select("*").eq("id", user.id).single();
    if (userError || !userData) {
      cookies.delete("sb-token", { path: "/" });
      return new Response(JSON.stringify({ error: "User data not found" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
      // 1 week
    };
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userData.role,
        clientId: userData.client_id,
        createdAt: user.created_at
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `sb-token=${token}; ${Object.entries(cookieOptions).map(([key, value]) => `${key}=${value}`).join("; ")}`
      }
    });
  } catch (error) {
    console.error("Session verification error:", error);
    cookies.delete("sb-token", { path: "/" });
    return new Response(JSON.stringify({ error: "Session verification failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
