import type { MiddlewareHandler } from 'astro';

// Define proper types
declare module 'astro' {
  interface Locals {
    user?: {
      id: string;
      email: string;
      role: 'admin' | 'client';
      clientId?: string | null;
      client?: {
        id: string;
        name: string;
        email: string;
        active: boolean;
      } | null;
      createdAt: string;
    };
  }
}

export const onRequest: MiddlewareHandler = async ({ request, locals, cookies }, next) => {
  try {
    const token = cookies.get('sb-token');
    if (!token?.value) {
      return next();
    }

    try {
      // Step 1: Verify token
      const { supabaseAdmin } = await import('./lib/supabase');
      const { data: { user: authUser }, error: authError } =
        await supabaseAdmin.auth.getUser(token.value);
      
      if (authError) {
        cookies.delete('sb-token', { path: '/' });
        return next();
      }

      if (authUser) {
        // Step 2: Set minimal user data
        locals.user = {
          id: authUser.id,
          email: authUser.email || '',
          role: 'client', // Default role
          createdAt: authUser.created_at || ''
        };

        // Step 3: Try to get additional user data
        try {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select(`
              role,
              client_id,
              clients!client_id(
                id,
                name,
                email,
                active
              )
            `)
            .eq('id', authUser.id)
            .single()
            .throwOnError();

          if (userData) {
            locals.user = {
              ...locals.user,
              role: userData.role,
              clientId: userData.client_id,
              client: userData.clients?.length ? {
                id: userData.clients[0].id,
                name: userData.clients[0].name,
                active: userData.clients[0].active
              } : undefined
            };
          }
        } catch (error) {
          console.warn('Error fetching additional user data:', error);
          // Continue with minimal user data
        }
      }
    } catch (error) {
      console.error('Auth error in middleware:', error);
      cookies.delete('sb-token', { path: '/' });
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