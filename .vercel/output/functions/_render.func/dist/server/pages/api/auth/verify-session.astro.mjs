import { supabaseAdmin, supabase } from '../../../chunks/supabase_C0n-HHBb.mjs';
import { r as rateLimitMiddleware } from '../../../chunks/rateLimit_FwDC2vWM.mjs';
import { i as isRLSError, h as handleRLSError } from '../../../chunks/accessControl_C1E0aB50.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  const rateLimitResponse = await rateLimitMiddleware("API")(request);
  if (rateLimitResponse instanceof Response) {
    return rateLimitResponse;
  }
  Object.assign(headers, rateLimitResponse.headers);
  const token = cookies.get("sb-token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "No session found" }), {
      status: 401,
      headers
    });
  }
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      cookies.delete("sb-token", { path: "/" });
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers
      });
    }
    let userData = null;
    const { data: regularData, error: regularError } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (regularError) {
      if (isRLSError(regularError)) {
        const { data: adminData, error: adminError } = await supabaseAdmin.from("users").select("*").eq("id", user.id).single();
        if (adminError || !adminData) {
          cookies.delete("sb-token", { path: "/" });
          return new Response(JSON.stringify({
            error: "User data not found",
            code: "USER_NOT_FOUND"
          }), {
            status: 401,
            headers
          });
        }
        userData = adminData;
      } else {
        return handleRLSError(regularError);
      }
    } else {
      userData = regularData;
    }
    if (!userData) {
      cookies.delete("sb-token", { path: "/" });
      return new Response(JSON.stringify({
        error: "User data not found",
        code: "USER_NOT_FOUND"
      }), {
        status: 401,
        headers
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
