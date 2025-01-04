import { supabaseAdmin, supabase } from '../../../chunks/supabase_C0n-HHBb.mjs';
import { v as verifyAuthorization, i as isRLSError, h as handleRLSError } from '../../../chunks/accessControl_C1E0aB50.mjs';
import { g as getCurrentUser } from '../../../chunks/authUtils_6Lejhq6S.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        code: "UNAUTHORIZED"
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
  const { authorized, error: authError } = await verifyAuthorization(
    currentUser,
    "admin");
  if (!authorized) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: authError?.message || "Unauthorized",
          code: authError?.code || "ADMIN_REQUIRED",
          status: 403
        }
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };
  try {
    const token = cookies.get("sb-token")?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: "No token found in cookie" }), {
        status: 401,
        headers
      });
    }
    const { data: { user: authUser }, error: authError2 } = await supabaseAdmin.auth.getUser(token);
    if (authError2 || !authUser) {
      return new Response(JSON.stringify({ error: "Invalid authentication token" }), {
        status: 401,
        headers
      });
    }
    const { data: regularData, error: regularError } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    let userData = null;
    if (regularError) {
      if (isRLSError(regularError)) {
        const { data: adminData, error: adminError } = await supabaseAdmin.from("users").select("*").eq("id", authUser.id).single();
        if (adminError) {
          return handleRLSError(adminError);
        }
        if (!adminData) {
          return new Response(JSON.stringify({
            error: "User data not found",
            code: "USER_NOT_FOUND"
          }), {
            status: 404,
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
      return new Response(JSON.stringify({
        error: "User data not found",
        code: "USER_NOT_FOUND"
      }), {
        status: 404,
        headers
      });
    }
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        role: userData.role,
        clientId: userData.client_id,
        createdAt: authUser.created_at
      }
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error during user check:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "User check failed"
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
