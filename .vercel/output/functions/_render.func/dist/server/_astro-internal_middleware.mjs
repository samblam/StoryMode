import 'es-module-lexer';
import './chunks/astro-designed-error-pages_DoCOnal4.mjs';
import 'cookie';
import { s as sequence } from './chunks/index_D_wZw1_T.mjs';

const onRequest$1 = async ({ request, locals, cookies }, next) => {
  try {
    console.log("Middleware - Starting authentication check");
    const token = cookies.get("sb-token");
    if (!token?.value) {
      console.log("Middleware - No token found");
      return next();
    }
    try {
      console.log("Middleware - Verifying token");
      const { supabaseAdmin } = await import('./chunks/supabase_D4M8dM3h.mjs');
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token.value);
      if (authError) {
        console.error("Middleware - Auth error:", authError);
        cookies.delete("sb-token", { path: "/" });
        return next();
      }
      if (authUser) {
        console.log("Middleware - User authenticated:", authUser.id);
        locals.user = {
          id: authUser.id,
          email: authUser.email || "",
          role: "client",
          // Default role
          createdAt: authUser.created_at || ""
        };
        try {
          console.log("Middleware - Fetching additional user data");
          const { data: userData } = await supabaseAdmin.from("users").select(`
              role,
              client_id,
              clients!client_id(
                id,
                name,
                email,
                active
              )
            `).eq("id", authUser.id).single().throwOnError();
          if (userData) {
            console.log("Middleware - Additional user data found:", {
              role: userData.role,
              clientId: userData.client_id
            });
            const role = userData.role || "client";
            const clientData = Array.isArray(userData.clients) && userData.clients.length > 0 ? {
              id: String(userData.clients[0].id),
              name: String(userData.clients[0].name),
              email: String(userData.clients[0].email),
              active: Boolean(userData.clients[0].active)
            } : void 0;
            locals.user = {
              id: authUser.id,
              email: authUser.email || "",
              role,
              clientId: userData.client_id,
              client: clientData,
              createdAt: authUser.created_at || ""
            };
          }
        } catch (error) {
          console.error("Middleware - Error fetching additional user data:", error);
          cookies.delete("sb-token", { path: "/" });
          if (locals.user) {
            locals.user = {
              ...locals.user,
              client: void 0
            };
          }
        }
      } else {
        console.log("Middleware - No auth user found");
      }
    } catch (error) {
      console.error("Middleware - Auth error:", error);
      cookies.delete("sb-token", { path: "/" });
    }
    return next();
  } catch (error) {
    console.error("Middleware - Fatal error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }
};

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
