import type { MiddlewareHandler } from 'astro';

// Define proper types
declare module 'astro' {
  interface Locals {
    user?: {
      id: string;
      email: string;
      role: 'admin' | 'client';
      clientId?: string | null;
      createdAt: string;
    };
  }
}

export const onRequest: MiddlewareHandler = async ({ request, locals, cookies }, next) => {
  try {
    const token = cookies.get('sb-token');
    console.log('Middleware running - Token:', token?.value);

    if (token?.value) {
      try {
        const { supabaseAdmin } = await import('./lib/supabase');
        
        // Verify token with error logging
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token.value);
        
        if (authError) {
          console.error('Auth error in middleware:', authError);
          return next();
        }

        if (authUser) {
          // Get user data with error logging
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (userError) {
            console.error('User data error in middleware:', userError);
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
            console.log('User data set in middleware:', locals.user);
          }
        }
      } catch (error) {
        console.error('Middleware error:', error);
        // Log the error stack trace if available
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        // Continue the request instead of crashing
        return next();
      }
    }

    return next();
  } catch (error) {
    console.error('Fatal middleware error:', error);
    // Log the error stack trace if available
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    // Return a basic response instead of crashing
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
};