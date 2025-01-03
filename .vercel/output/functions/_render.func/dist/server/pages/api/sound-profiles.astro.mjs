import { supabaseAdmin } from '../../chunks/supabase_D4M8dM3h.mjs';
import { R as RateLimiter, a as RATE_LIMITS } from '../../chunks/rateLimit_D-TMYXgA.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request, locals, cookies }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = RateLimiter.getKey(clientIp, "profile-create");
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.PROFILE_CREATE);
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Too many profile creation attempts. Please try again later."
      }), {
        status: 429,
        headers
      });
    }
    const data = await request.json();
    const { user } = locals;
    console.log("Profile Creation Debug:", {
      requestData: data,
      user,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (!user) {
      console.log("Unauthorized: No user in locals");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers
        }
      );
    }
    if (!data.title || !data.description) {
      console.log("Validation failed:", { data });
      return new Response(
        JSON.stringify({ error: "Title and description are required" }),
        {
          status: 400,
          headers
        }
      );
    }
    let clientId = null;
    if (user.role === "admin") {
      clientId = data.clientId || null;
    } else if (user.role === "client") {
      clientId = user.clientId;
    }
    console.log("Preparing to create profile:", {
      title: data.title,
      description: data.description,
      clientId,
      userRole: user.role
    });
    const profileData = {
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      client_id: clientId,
      is_template: false
      // Add any default fields needed
    };
    console.log("Sending to Supabase:", profileData);
    const { data: newProfile, error } = await supabaseAdmin.from("sound_profiles").insert(profileData).select().single();
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    console.log("Profile created successfully:", newProfile);
    const token = cookies.get("sb-token");
    return new Response(
      JSON.stringify(newProfile),
      {
        status: 201,
        headers: {
          ...headers,
          "Set-Cookie": `sb-token=${token?.value}; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      }
    );
  } catch (error) {
    console.error("Profile creation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to create profile",
        details: error instanceof Error ? error.stack : void 0
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
const PUT = async ({ request, locals, cookies }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = RateLimiter.getKey(clientIp, "profile-update");
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.PROFILE_UPDATE);
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Too many profile update attempts. Please try again later."
      }), {
        status: 429,
        headers
      });
    }
    const data = await request.json();
    const { user } = locals;
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers
        }
      );
    }
    if (!data.id || !data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: "ID, title, and description are required" }),
        {
          status: 400,
          headers
        }
      );
    }
    const { data: existingProfile, error: fetchError } = await supabaseAdmin.from("sound_profiles").select("*").eq("id", data.id).single();
    if (fetchError || !existingProfile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 404,
          headers
        }
      );
    }
    if (user.role === "client" && existingProfile.client_id !== user.clientId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 403,
          headers
        }
      );
    }
    const updateData = {
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    };
    if (user.role === "admin" && "clientId" in data) {
      updateData.client_id = data.clientId || null;
    }
    const { data: updatedProfile, error } = await supabaseAdmin.from("sound_profiles").update(updateData).eq("id", data.id).select().single();
    if (error) {
      throw error;
    }
    const token = cookies.get("sb-token");
    return new Response(
      JSON.stringify(updatedProfile),
      {
        status: 200,
        headers: {
          ...headers,
          "Set-Cookie": `sb-token=${token?.value}; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update profile"
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
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
