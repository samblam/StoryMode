import { supabase } from '../../../chunks/supabase_CUwi8gWR.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ cookies }) => {
  try {
    await supabase.auth.signOut();
    cookies.delete("sb-token", {
      path: "/"
    });
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Logout failed"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
