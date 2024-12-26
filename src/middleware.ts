import type { MiddlewareHandler } from 'astro';
import type { User } from './types/auth';
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
  const token = cookies.get('sb-token');
  console.log('Middleware running - Token:', token?.value);

  if (token?.value) {
    try {
      const { supabaseAdmin } = await import('./lib/supabase');
      
      // Verify token
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token.value);
      
      if (authUser && !authError) {
        // Get user data
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

          if (userData) {
            locals.user = {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              clientId: userData.client_id,
              client: null, // Add this
              createdAt: userData.created_at
            };
          }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  return next();
};