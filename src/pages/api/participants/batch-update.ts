import type { APIRoute } from "astro";
import { getClient } from "../../../lib/supabase";
import { verifyAuthorization } from "../../../utils/accessControl";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check for admin access
    const { authorized, error: authError } = await verifyAuthorization(locals.user, 'admin', 'write');
    if (!authorized) {
      return new Response(JSON.stringify({ error: authError?.message || "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { participantIds, newStatus, surveyId } = body;

    if ((!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) && !surveyId) {
      return new Response(JSON.stringify({ error: "Either participantIds or surveyId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    const supabase = getClient({ requiresAdmin: true });
    let query = supabase.from("participants").update({ 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    });

    // Apply filters
    if (participantIds && participantIds.length > 0) {
      query = query.in("id", participantIds);
    }

    if (surveyId) {
      query = query.eq("survey_id", surveyId);
    }

    // Execute update
    const { data, error, count } = await query.select().order('created_at', { ascending: false });

    if (error) {
      console.error("Error updating participants status:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Updated ${count || data.length} participants to status: ${newStatus}`,
      participants: data 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error updating participants status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};