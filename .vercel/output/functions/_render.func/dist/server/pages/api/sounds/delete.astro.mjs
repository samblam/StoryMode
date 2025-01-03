import { supabaseAdmin } from '../../../chunks/supabase_CUwi8gWR.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, locals }) => {
  try {
    if (!locals.user || locals.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const { id: soundId } = await request.json();
    if (!soundId) {
      return new Response(JSON.stringify({ error: "Sound ID is required" }), { status: 400 });
    }
    const { data: sound, error: fetchError } = await supabaseAdmin.from("sounds").select("storage_path").eq("id", soundId).single();
    if (fetchError) {
      console.error("Error fetching sound:", fetchError);
      throw new Error("Failed to fetch sound details");
    }
    if (!sound) {
      return new Response(JSON.stringify({ error: "Sound not found" }), { status: 404 });
    }
    if (sound.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage.from("sounds").remove([sound.storage_path]);
      if (storageError) {
        console.error("Storage deletion error:", storageError);
        throw new Error("Failed to delete sound file");
      }
    }
    const { error: dbError } = await supabaseAdmin.from("sounds").delete().eq("id", soundId);
    if (dbError) {
      console.error("Database deletion error:", dbError);
      throw new Error("Failed to delete sound record");
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Delete failed" }),
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
