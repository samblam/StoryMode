import { supabase } from '../../chunks/supabase_D4M8dM3h.mjs';
import { R as RateLimiter, a as RATE_LIMITS } from '../../chunks/rateLimit_D-TMYXgA.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = RateLimiter.getKey(clientIp, "test-connection");
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.CONTACT);
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Too many connection test attempts. Please try again later."
      }), {
        status: 429,
        headers
      });
    }
    console.log("Testing basic connection...");
    const { error: connectionError } = await supabase.from("sound_profiles").select("count").limit(1);
    if (connectionError) {
      throw new Error(`Connection test failed: ${connectionError.message}`);
    }
    console.log("Creating test sound profile...");
    const { data: profileData, error: profileError } = await supabase.from("sound_profiles").insert({
      title: `Test Profile ${(/* @__PURE__ */ new Date()).toISOString()}`,
      description: "Test profile created during connection test",
      slug: `test-profile-${Date.now()}`
    }).select().single();
    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }
    if (!profileData?.id) {
      throw new Error("Profile created but no ID returned");
    }
    console.log("Created profile:", profileData);
    console.log("Creating test sound...");
    const { data: soundData, error: soundError } = await supabase.from("sounds").insert({
      name: `Test Sound ${(/* @__PURE__ */ new Date()).toISOString()}`,
      description: "Test sound created during connection test",
      file_path: "/test/dummy-sound.mp3",
      profile_id: profileData.id
    }).select().single();
    if (soundError) {
      throw new Error(`Failed to create sound: ${soundError.message}`);
    }
    console.log("Created sound:", soundData);
    console.log("Verifying relationship...");
    const { data: verifyData, error: verifyError } = await supabase.from("sound_profiles").select(
      `
        *,
        sounds (*)
      `
    ).eq("id", profileData.id).single();
    if (verifyError) {
      throw new Error(`Failed to verify relationship: ${verifyError.message}`);
    }
    if (!verifyData.sounds?.length) {
      throw new Error(
        "Relationship verification failed: No associated sounds found"
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "All database operations successful",
        data: {
          createdProfile: profileData,
          createdSound: soundData,
          verification: verifyData
        }
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Test failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: process.env.NODE_ENV === "development" ? {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : void 0
        } : void 0
      }),
      { status: 500, headers }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
