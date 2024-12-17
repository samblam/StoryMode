import type { MiddlewareHandler } from 'astro';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/about', '/contact', '/blog', '/works', '/'];

export const onRequest: MiddlewareHandler = async ({ request, cookies, url, locals }, next) => {
  console.log('Middleware running, checking auth...');
  
  // Get token from cookie
  const token = cookies.get('sb-token')?.value;
  console.log('Token found:', !!token);

  // Check if current path is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => url.pathname === route);

  if (token) {
    try {
      // Verify token and get user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error('Auth error:', authError);
        cookies.delete('sb-token', { path: '/' });
        if (!isPublicRoute) {
          return Response.redirect(new URL('/login', url));
        }
      } else {
        console.log('Auth user found:', authUser.id);

        // Get user data from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, clients(*)')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          console.error('User data error:', userError);
          cookies.delete('sb-token', { path: '/' });
          if (!isPublicRoute) {
            return Response.redirect(new URL('/login', url));
          }
        } else if (userData) {
          // Set user in locals
          locals.user = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            clientId: userData.client_id,
            client: userData.clients,
            createdAt: userData.created_at,
          } as User;

          console.log('User set in locals:', locals.user);
        }
      }
    } catch (error) {
      console.error('Middleware error:', error);
      cookies.delete('sb-token', { path: '/' });
      if (!isPublicRoute) {
        return Response.redirect(new URL('/login', url));
      }
    }
  } else if (!isPublicRoute) {
    // Redirect to login only if trying to access protected route
    return Response.redirect(new URL('/login', url));
  }

  // Continue to the next middleware/route handler
  return next();
};