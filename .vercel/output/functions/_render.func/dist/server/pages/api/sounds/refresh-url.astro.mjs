import { supabaseAdmin } from '../../../chunks/supabase_D4M8dM3h.mjs';
import { g as getSignedUrl } from '../../../chunks/storageUtils_BVHAiK5w.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const { soundId } = await request.json();
    if (!soundId) {
      return new Response(JSON.stringify({ error: "Sound ID is required" }), {
        status: 400
      });
    }
    const { data: sound, error: fetchError } = await supabaseAdmin.from("sounds").select("storage_path").eq("id", soundId).single();
    if (fetchError || !sound) {
      throw new Error("Sound not found");
    }
    const signedUrl = await getSignedUrl(sound.storage_path);
    const { error: updateError } = await supabaseAdmin.from("sounds").update({ file_path: signedUrl }).eq("id", soundId);
    if (updateError) {
      throw updateError;
    }
    return new Response(
      JSON.stringify({
        success: true,
        url: signedUrl
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("URL refresh error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to refresh URL"
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
