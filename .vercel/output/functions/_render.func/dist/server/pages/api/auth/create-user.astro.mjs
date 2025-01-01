import { supabaseAdmin } from '../../../chunks/supabase_D4M8dM3h.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const { email, password, role, name, company } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }
    if (!["admin", "client"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400 }
      );
    }
    if (role === "client" && !name) {
      return new Response(
        JSON.stringify({ error: "Client name is required" }),
        { status: 400 }
      );
    }
    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", normalizedEmail).maybeSingle();
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email already in use" }),
        { status: 400 }
      );
    }
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true
    });
    if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
    if (!authData.user) throw new Error("No user returned from auth creation");
    const userId = authData.user.id;
    let clientId = null;
    if (role === "client") {
      const { data: clientData, error: clientError } = await supabaseAdmin.from("clients").insert({
        name,
        company,
        email: normalizedEmail,
        active: true
      }).select("id").single();
      if (clientError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw new Error(`Client creation failed: ${clientError.message}`);
      }
      clientId = clientData.id;
    }
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
      throw new Error(`User record creation failed: ${userError.message}`);
    }
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to create user"
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
