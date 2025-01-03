import { supabaseAdmin } from '../../../chunks/supabase_D4M8dM3h.mjs';
import { u as uploadSound } from '../../../chunks/storageUtils_BVHAiK5w.mjs';
import { R as RateLimiter, a as RATE_LIMITS } from '../../../chunks/rateLimit_D-TMYXgA.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = RateLimiter.getKey(clientIp, "sound-upload");
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.UPLOAD);
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Too many upload attempts. Please try again later."
      }), {
        status: 429,
        headers
      });
    }
    const token = cookies.get("sb-token")?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authentication token not found" }),
        {
          status: 401,
          headers
        }
      );
    }
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers
        }
      );
    }
    const { data: userData } = await supabaseAdmin.from("users").select("role").eq("id", user.id).single();
    if (!userData || userData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        {
          status: 403,
          headers
        }
      );
    }
    const formData = await request.formData();
    const file = formData.get("sound");
    const profileId = formData.get("profileId");
    const profileSlug = formData.get("profileSlug");
    const name = formData.get("name");
    const description = formData.get("description");
    if (!file || !profileId || !profileSlug || !name || !description) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers
        }
      );
    }
    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
    const validExtensions = [".mp3", ".wav", ".ogg"];
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);
    if (!isValidType) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Please upload MP3, WAV, or OGG files only." }),
        {
          status: 400,
          headers
        }
      );
    }
    const { path: storagePath, signedUrl } = await uploadSound({
      file,
      profileSlug,
      contentType: file.type || "audio/mpeg"
      // Default to audio/mpeg if type is empty
    });
    const { data: newSound, error: dbError } = await supabaseAdmin.from("sounds").insert({
      name,
      description,
      file_path: signedUrl,
      storage_path: storagePath,
      profile_id: profileId
    }).select().single();
    if (dbError) {
      throw dbError;
    }
    return new Response(
      JSON.stringify({
        success: true,
        sound: newSound
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Upload failed"
      }),
      {
        status: 500,
        headers
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
