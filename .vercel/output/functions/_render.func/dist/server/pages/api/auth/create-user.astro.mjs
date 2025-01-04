import { supabaseAdmin } from '../../../chunks/supabase_D4M8dM3h.mjs';
import { r as rateLimitMiddleware } from '../../../chunks/rateLimit_C37W6zoK.mjs';
import { g as getCurrentUser } from '../../../chunks/authUtils_mOm6JoyM.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      console.error("Unauthorized: User is not admin", { currentUser });
      return new Response(JSON.stringify({
        success: false,
        error: "Unauthorized - Admin access required"
      }), {
        status: 401,
        headers
      });
    }
    const rateLimitResponse = await rateLimitMiddleware("CREATE_USER")(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
    const { email, password, role, name, company } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || !role) {
      console.error("Validation failed: Missing required fields");
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields"
      }), {
        status: 400,
        headers
      });
    }
    if (!["admin", "client"].includes(role)) {
      console.error("Invalid role specified:", role);
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid role"
      }), {
        status: 400,
        headers
      });
    }
    if (role === "client" && !name) {
      console.error("Client name required for client role");
      return new Response(JSON.stringify({
        success: false,
        error: "Client name is required"
      }), {
        status: 400,
        headers
      });
    }
    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", normalizedEmail).maybeSingle();
    if (existingUser) {
      console.error("Email already in use:", normalizedEmail);
      return new Response(JSON.stringify({
        success: false,
        error: "Email already in use"
      }), {
        status: 400,
        headers
      });
    }
    console.log("Creating auth user...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true
    });
    if (authError) {
      console.error("Auth user creation failed:", authError);
      return new Response(JSON.stringify({
        success: false,
        error: authError.message
      }), {
        status: 500,
        headers
      });
    }
    if (!authData.user) {
      console.error("No user returned from auth creation");
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to create user"
      }), {
        status: 500,
        headers
      });
    }
    const userId = authData.user.id;
    let clientId = null;
    if (role === "client") {
      console.log("Creating client record...");
      const { data: clientData, error: clientError } = await supabaseAdmin.from("clients").insert({
        name,
        company,
        email: normalizedEmail,
        active: true
      }).select("id").single();
      if (clientError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.error("Client creation failed:", clientError);
        return new Response(JSON.stringify({
          success: false,
          error: clientError.message
        }), {
          status: 500,
          headers
        });
      }
      clientId = clientData.id;
    }
    console.log("Creating user record...");
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: normalizedEmail,
      role,
      client_id: clientId
    });
    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (clientId) {
        await supabaseAdmin.from("clients").delete().eq("id", clientId);
      }
      console.error("User record creation failed:", userError);
      return new Response(JSON.stringify({
        success: false,
        error: userError.message
      }), {
        status: 500,
        headers
      });
    }
    console.log("User creation successful:", { userId, role, clientId });
    return new Response(JSON.stringify({
      success: true,
      userId
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Create user error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user"
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
