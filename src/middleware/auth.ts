// src/middleware/auth.ts
import type { MiddlewareHandler } from 'astro';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';

export const onRequest: MiddlewareHandler = async ({ request, cookies, url, locals }, next) => {
  console.log('Middleware running, checking auth...');
  
  // Initialize user as undefined
  locals.user = undefined;

  // Get token from cookie
  const token = cookies.get('sb-token')?.value;
  console.log('Token found:', !!token);

  if (token) {
    try {
      // Verify token and get user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error('Auth error:', authError);
        cookies.delete('sb-token', { path: '/' });
        return Response.redirect(new URL('/login', url));
      }

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
        return Response.redirect(new URL('/login', url));
      }

      if (!userData) {
        console.error('No user data found');
        cookies.delete('sb-token', { path: '/' });
        return Response.redirect(new URL('/login', url));
      }

      // Set user in locals
      locals.user = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: userData.clients,
        createdAt: userData.created_at
      };

      console.log('User set in locals:', locals.user);
    } catch (error) {
      console.error('Middleware error:', error);
      cookies.delete('sb-token', { path: '/' });
      if (!url.pathname.startsWith('/login')) {
        return Response.redirect(new URL('/login', url));
      }
    }
  } else if (!url.pathname.startsWith('/login')) {
    return Response.redirect(new URL('/login', url));
  }

  // Continue to the next middleware/route handler
  const response = await next();

  // Log final state
  console.log('Final locals.user state:', locals.user);
  return response;
};