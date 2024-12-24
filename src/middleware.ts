import type { MiddlewareHandler } from 'astro';
import type { User } from './types/auth';
import { supabaseAdmin } from './lib/supabase';

declare module 'astro' {
    interface Locals {
        user?: User;
    }
}

const PUBLIC_PATHS = [
    '/',
    '/login',
    '/reset-password',
    '/about',
    '/contact',
    '/works',
    '/blog'
];

const isPublicPath = (pathname: string): boolean => {
    return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/reset-password/');
};

const isAsset = (pathname: string): boolean => {
    return !!(
        pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/) ||
        pathname.startsWith('/fonts/') ||
        pathname.startsWith('/images/') ||
        pathname.startsWith('/sounds/')
    );
};

const verifyAndGetUser = async (token: string): Promise<User | null> => {
    console.log('verifyAndGetUser - Attempting verification with token:', !!token);
    try {
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError) {
            console.log('verifyAndGetUser - Auth Error:', authError);
            return null;
        }

        if (authUser) {
            console.log('verifyAndGetUser - authUser found', authUser);
            const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select(`
                *,
                client:clients(*)
              `)
                .eq('id', authUser.id)
                .single();

            if (userError) {
                console.log('verifyAndGetUser - userError', userError);
                return null;
            }
            if (userData) {
                console.log('verifyAndGetUser - userData found', userData);
                return {
                    id: authUser.id,
                    email: authUser.email || '',
                    role: userData.role,
                    clientId: userData.client_id,
                    client: userData.client,
                    createdAt: authUser.created_at || new Date().toISOString()
                };
            } else {
                console.log('verifyAndGetUser - No userData found for user ID', authUser.id);
                return null;
            }
        }
        console.log('verifyAndGetUser - authUser not found');
        return null;
    } catch (error) {
        console.error('verifyAndGetUser - Auth error:', error);
        return null;
    }
};

export const onRequest: MiddlewareHandler = async ({ request, locals, cookies }, next) => {
    const url = new URL(request.url);
    const { pathname } = url;

    console.log('Middleware - Processing request:', { pathname });

    // Always skip assets
    if (isAsset(pathname)) {
        return next();
    }

    // Skip auth endpoints
    if (pathname.startsWith('/api/auth/')) {
        return next();
    }

    // Check for auth token
    const token = cookies.get('sb-token')?.value;

    if (!token) {
        console.log('Middleware - No token found');
    } else {
        console.log('Middleware - Token present:', !!token);
        const user = supabaseAdmin ? await verifyAndGetUser(token) : null;
        if (user) {
            console.log('Middleware - User verified:', user.email);
            locals.user = user;
        } else {
            console.log('Middleware - Invalid token, clearing cookie');
            cookies.delete('sb-token', { path: '/' });
        }
    }

    // Allow public paths to proceed
    if (isPublicPath(pathname)) {
        return next();
    }

    // For all other paths, require authentication
    if (!locals.user) {
        console.log('Middleware - Protected path accessed without auth');
        if (pathname.startsWith('/api/')) {
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

    // For paths under /sounds/profiles/, require admin role
    if (pathname.startsWith('/sounds/profiles/') && locals.user.role !== 'admin') {
        console.log('Middleware - Admin path accessed by non-admin user');
        return new Response(null, {
            status: 302,
            headers: { 'Location': '/sounds' }
        });
    }

    console.log('Middleware - Request authorized, proceeding');
    return next();
};
