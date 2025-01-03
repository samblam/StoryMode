import { supabaseAdmin } from '../../../chunks/supabase_D4M8dM3h.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400 }
      );
    }
    const { data: userData, error: userError } = await supabaseAdmin.from("users").select("id").eq("email", normalizedEmail).single();
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { password }
    );
    if (resetError) {
      throw resetError;
    }
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to reset password"
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
