import { supabaseAdmin } from '../../../chunks/supabase_C0n-HHBb.mjs';
import { r as rateLimitMiddleware } from '../../../chunks/rateLimit_FwDC2vWM.mjs';
export { renderers } from '../../../renderers.mjs';

class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = "StorageError";
  }
}
async function getSignedUrl(path) {
  try {
    const { data, error } = await supabaseAdmin.storage.from("sounds").createSignedUrl(path, 60 * 60, {
      download: false,
      transform: {
        format: "origin"
      }
    });
    if (error) throw error;
    if (!data?.signedUrl) throw new Error("No signed URL returned");
    return data.signedUrl;
  } catch (error) {
    throw new StorageError(
      `Failed to get signed URL: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

const POST = async ({ request }) => {
  const rateLimitResponse = await rateLimitMiddleware("SOUND_DOWNLOAD", {
    includeIP: true,
    includeUser: true
  })(request);
  if (rateLimitResponse instanceof Response) {
    return rateLimitResponse;
  }
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
