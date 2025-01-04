import { getClient } from '../../chunks/supabase_C0n-HHBb.mjs';
import { r as rateLimitMiddleware } from '../../chunks/rateLimit_FwDC2vWM.mjs';
import { v as validateBody } from '../../chunks/validationMiddleware_-_YZoV9A.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const rateLimitResponse = await rateLimitMiddleware("PROFILE_VIEW", {
      includeIP: true
    })(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
    const { data: profiles, error } = await getClient().from("sound_profiles").select("*").order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return new Response(
      JSON.stringify(profiles),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Profile list error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch profiles" }),
      {
        status: 500,
        headers
      }
    );
  }
};
const POST = async ({ request, locals }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const rateLimitResponse = await rateLimitMiddleware("PROFILE_CREATE")(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
    const validation = await validateBody({
      title: "profileTitle",
      description: "description"
    })(request);
    if (validation instanceof Response) {
      return validation;
    }
    const { body } = validation;
    const { user } = locals?.auth || {};
    console.log("Profile Creation Debug:", {
      requestData: body,
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
    let clientId = null;
    if (user.role === "admin") {
      clientId = body.clientId || null;
    } else if (user.role === "client") {
      clientId = user.clientId;
    }
    console.log("Preparing to create profile:", {
      title: body.title,
      description: body.description,
      clientId,
      userRole: user.role
    });
    const profileData = {
      title: body.title,
      description: body.description,
      slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      client_id: clientId,
      is_template: false
      // Add any default fields needed
    };
    console.log("Sending to Supabase:", profileData);
    const { data: newProfile, error } = await getClient().from("sound_profiles").insert(profileData).select().single();
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    console.log("Profile created successfully:", newProfile);
    return new Response(
      JSON.stringify(newProfile),
      {
        status: 201,
        headers
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
const PUT = async ({ request, locals }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const rateLimitResponse = await rateLimitMiddleware("PROFILE_UPDATE")(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
    const data = await request.json();
    const { user } = locals?.auth || {};
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
    const { data: existingProfile, error: fetchError } = await getClient().from("sound_profiles").select("*").eq("id", data.id).single();
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
    const { data: updatedProfile, error } = await getClient().from("sound_profiles").update(updateData).eq("id", data.id).select().single();
    if (error) {
      throw error;
    }
    return new Response(
      JSON.stringify(updatedProfile),
      {
        status: 200,
        headers
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
  GET,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
