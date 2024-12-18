import { supabase } from '../lib/supabase';
import type { User, AuthError } from '../types/auth';

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      clientId: userData.client_id,
      createdAt: userData.created_at,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Signs in a user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const normalizedEmail = normalizeEmail(email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return {
        user: null,
        error: {
          message: error.message,
          status: 401,
        },
      };
    }

    if (!data.user) {
      return {
        user: null,
        error: {
          message: 'No user found',
          status: 404,
        },
      };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return {
        user: null,
        error: {
          message: 'User data not found',
          status: 404,
        },
      };
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        createdAt: userData.created_at,
      },
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: {
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        error: {
          message: error.message,
          status: 500,
        },
      };
    }
    return { error: null };
  } catch (error) {
    return {
      error: {
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Checks if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Checks if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Gets the client ID of the current user
 */
export async function getClientId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.clientId ?? null;
}

/**
 * Middleware function to require authentication
 */
export function requireAuth() {
  return async ({ request }: { request: Request }) => {
    const user = await getCurrentUser();
    if (!user) {
      return new Response('Redirect', {
        status: 302,
        headers: {
          Location: '/login',
        },
      });
    }
    return user;
  };
}

/**
 * Middleware function to require admin access
 */
export function requireAdmin() {
  return async ({ request }: { request: Request }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return new Response('Redirect', {
        status: 302,
        headers: {
          Location: '/',
        },
      });
    }
    return user;
  };
}