import type { APIRoute } from "astro";
import { getClient } from "../../../../lib/supabase";
import { verifyAuthorization } from "../../../../utils/accessControl";

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check for admin access
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError?.message || "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const participantId = params.id;
    if (!participantId) {
      return new Response(JSON.stringify({ error: "Participant ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { newStatus } = body;

    if (!newStatus) {
      return new Response(JSON.stringify({ error: "New status is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate status
    const validStatuses = ["inactive", "active", "completed", "expired"];
    if (!validStatuses.includes(newStatus)) {
      return new Response(JSON.stringify({ error: "Invalid status value" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update participant status
    const supabase = getClient({ requiresAdmin: true });
    const { data, error } = await supabase
      .from("participants")
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", participantId)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating participant status:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, participant: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error updating participant status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};