import type { MiddlewareHandler } from 'astro';
import type { User } from './types/auth';

declare module 'astro' {
  interface Locals {
    user?: User;
  }
}


const shouldSkipAuth = (pathname: string) => {
  const SKIP_AUTH_PATTERNS = [
    /\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/,
    /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
      /^\/(login|reset-password|api\/auth\/(login|logout)|fonts|images|about|contact|works|blog)?$/,
    /^\/reset-password\/confirm/
  ];
  return SKIP_AUTH_PATTERNS.some(pattern => pattern.test(pathname));
};

const verifyAndGetUser = async (token: string): Promise<User | null> => {
  try {
        const { supabaseAdmin } = await import('./lib/supabase');
    
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authUser && !authError) {
            // Still using hardcoded role until we fix the RLS issues
             console.log('Middleware - User verified, authUser:', authUser);
            const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

              if (userError || !userData) {
                console.error('Middleware - Error fetching user data:', userError);
                 return null;
              } else {
                  console.log('Middleware - User Data Fetched:', userData);
                    return {
                      id: authUser.id,
                      email: authUser.email || '',
                      role: userData.role as 'admin' | 'client',
                      clientId: userData.client_id,
                      createdAt: authUser.created_at || new Date().toISOString()
                    };
                }
            } else {
                 console.error('Middleware - Invalid token');
                return null;
            }
  } catch (error) {
    console.error('Middleware - Auth error:', error);
    return null;
  }
};


export const onRequest: MiddlewareHandler = async ({ request, locals, cookies }, next) => {
  const url = new URL(request.url);

  console.log('Middleware - Request URL:', url.pathname);

  if (shouldSkipAuth(url.pathname)) {
     console.log('Middleware - Skipping auth or user in locals:', url.pathname);
    return next();
  }

    // If we already have a user in locals, skip auth check
    if (locals.user) {
         console.log('Middleware - User already in locals:', locals.user);
      return next();
    }


  const token = cookies.get('sb-token');
  if (!token?.value) {
    console.log('Middleware - No token found, redirecting to login:', url.pathname);
    return url.pathname.startsWith('/api/')
      ? new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      : new Response(null, {
          status: 302,
          headers: { 'Location': '/login' }
        });
  }

  try {
      console.log('Middleware - Verifying and getting user data.');
    locals.user = await verifyAndGetUser(token.value);
    if (!locals.user) {
        console.log('Middleware - Invalid token, clearing cookie');
      cookies.delete('sb-token', { path: '/' });
    }
  } catch (error) {
    console.error('Middleware - Auth error:', error);
  }
    console.log('Middleware - Proceeding to next middleware/route handler:', url.pathname);
  return next();
};