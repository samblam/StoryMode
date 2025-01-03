import 'es-module-lexer';
import './chunks/astro-designed-error-pages_DoCOnal4.mjs';
import 'cookie';
import { s as sequence } from './chunks/index_D_wZw1_T.mjs';

const onRequest$1 = async ({ request, locals, cookies }, next) => {
  try {
    const token = cookies.get("sb-token");
    console.log("Middleware running - Token:", token?.value);
    if (token?.value) {
      try {
        const { supabaseAdmin } = await import('./chunks/supabase_D4M8dM3h.mjs');
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token.value);
        if (authError) {
          console.error("Auth error in middleware:", authError);
          return next();
        }
        if (authUser) {
          const { data: userData, error: userError } = await supabaseAdmin.from("users").select("*").eq("id", authUser.id).single();
          if (userError) {
            console.error("User data error in middleware:", userError);
            return next();
          }
          if (userData) {
            locals.user = {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              clientId: userData.client_id,
              createdAt: userData.created_at
            };
            console.log("User data set in middleware:", locals.user);
          }
        }
      } catch (error) {
        console.error("Middleware error:", error);
        if (error instanceof Error) {
          console.error("Error stack:", error.stack);
        }
        return next();
      }
    }
    return next();
  } catch (error) {
    console.error("Fatal middleware error:", error);
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
