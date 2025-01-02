import 'es-module-lexer';
import './chunks/astro-designed-error-pages_CvTk2sHv.mjs';
import 'cookie';
import { s as sequence } from './chunks/index_uXSnSbmT.mjs';

const onRequest$1 = async ({ request, locals, cookies }, next) => {
  const token = cookies.get("sb-token");
  console.log("Middleware running - Token:", token?.value);
  if (token?.value) {
    try {
      const { supabaseAdmin } = await import('./chunks/supabase_D4M8dM3h.mjs');
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token.value);
      if (authUser && !authError) {
        const { data: userData } = await supabaseAdmin.from("users").select("*").eq("id", authUser.id).single();
        if (userData) {
          locals.user = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            clientId: userData.client_id,
            client: null,
            // Add this
            createdAt: userData.created_at
          };
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  }
  return next();
};

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
