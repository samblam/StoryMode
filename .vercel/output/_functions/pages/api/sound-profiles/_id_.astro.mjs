import { supabaseAdmin } from '../../../chunks/supabase_CUwi8gWR.mjs';
export { renderers } from '../../../renderers.mjs';

const DELETE = async ({ params, locals }) => {
  try {
    if (!locals.user || locals.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Profile ID is required" }), { status: 400 });
    }
    const { data: sounds, error: fetchError } = await supabaseAdmin.from("sounds").select("storage_path").eq("profile_id", id);
    if (fetchError) {
      console.error("Error fetching sounds:", fetchError);
      throw new Error("Failed to fetch profile sounds");
    }
    if (sounds && sounds.length > 0) {
      const storagePaths = sounds.map((sound) => sound.storage_path).filter((path) => !!path);
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage.from("sounds").remove(storagePaths);
        if (storageError) {
          console.error("Storage deletion error:", storageError);
          throw new Error("Failed to delete sound files");
        }
      }
    }
    const { error: soundsDeleteError } = await supabaseAdmin.from("sounds").delete().eq("profile_id", id);
    if (soundsDeleteError) {
      console.error("Sounds deletion error:", soundsDeleteError);
      throw new Error("Failed to delete sounds");
    }
    const { error: profileDeleteError } = await supabaseAdmin.from("sound_profiles").delete().eq("id", id);
    if (profileDeleteError) {
      console.error("Profile deletion error:", profileDeleteError);
      throw new Error("Failed to delete profile");
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
  DELETE
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
