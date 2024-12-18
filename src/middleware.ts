import type { MiddlewareHandler } from 'astro';
import type { User } from './types/auth';

declare module 'astro' {
  interface Locals {
    user?: User;
  }
}

export const onRequest: MiddlewareHandler = async ({ request, locals, cookies }, next) => {
    const url = new URL(request.url);

    console.log('Middleware - Request URL:', url.pathname);

    // Skip auth for these patterns
    const SKIP_AUTH_PATTERNS = [
        // Static assets
        /\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/,
        // Storage URLs (matching UUID pattern)
        /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
        // Public routes
        /^\/(login|reset-password|api\/auth\/(login|logout)|fonts|images)/
    ];

    // Skip middleware if URL matches any pattern
    if (SKIP_AUTH_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        console.log('Middleware - Skipping auth for:', url.pathname);
        return next();
    }


    // If we already have a user in locals, skip auth check
    if (locals.user) {
        console.log('Middleware - User already in locals:', locals.user);
        return next();
    }

    const token = cookies.get('sb-token');

    // If no token and route requires auth, handle accordingly
    if (!token?.value) {
        console.log('Middleware - No token found in cookies, redirecting to login');
        if (url.pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(null, {
            status: 302,
            headers: { 'Location': '/login' }
        });
    }

    try {
        console.log('Middleware - Token found, verifying user:', token.value.substring(0,10) + "...");
        const { supabaseAdmin } = await import('./lib/supabase');
    
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token.value);
    
        if (authUser && !authError) {
        // Still using hardcoded role until we fix the RLS issues
        console.log('Middleware - User verified, setting locals:', authUser);
            locals.user = {
                id: authUser.id,
                email: authUser.email || '',
                role: 'admin', // Hardcoded for now
                createdAt: authUser.created_at || new Date().toISOString()
            };
        } else {
            // Clear invalid token
          console.log('Middleware - Invalid token, clearing cookie');
            cookies.delete('sb-token', { path: '/' });
        }
    } catch (error) {
        // Just log the error and continue
        console.error('Middleware - Auth error:', error);
    }

    console.log('Middleware - Proceeding to next middleware/route handler');
    return next();
};