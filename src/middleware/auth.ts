// src/middleware/auth.ts
import type { MiddlewareHandler } from 'astro';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';
// Import the types so they're included
import '../types/astro';

export const onRequest: MiddlewareHandler = async ({ request, cookies, url, locals }, next) => {
  // Paths that don't require authentication
  const publicPaths = ['/login', '/register', '/forgot-password'];
  if (publicPaths.includes(url.pathname)) {
    return next();
  }

  // Get auth token from cookie
  const token = cookies.get('sb-token')?.value;
  if (!token) {
    return Response.redirect(new URL('/login', request.url));
  }

  try {
    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      cookies.delete('sb-token', { path: '/' });
      return Response.redirect(new URL('/login', request.url));
    }

    // Get user role and permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        clients!inner (
          id,
          name,
          active
        )
      `)
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User data not found');
    }

    // Check if client is active (for client users)
    if (userData.role === 'client' && !userData.clients.active) {
      cookies.delete('sb-token', { path: '/' });
      return Response.redirect(new URL('/login', request.url));
    }

    // Check admin-only routes
    const adminPaths = ['/admin', '/clients'];
    if (adminPaths.some(path => url.pathname.startsWith(path)) && userData.role !== 'admin') {
      return Response.redirect(new URL('/', request.url));
    }

    // Add user info to locals for use in components
    locals.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      clientId: userData.client_id,
      client: userData.clients
    };

    return next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    cookies.delete('sb-token', { path: '/' });
    return Response.redirect(new URL('/login', request.url));
  }
};