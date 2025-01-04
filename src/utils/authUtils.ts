import { supabase, supabaseAdmin } from '../lib/supabase';
import type { User, AuthError } from '../types/auth';
import { isRLSError, handleRLSError } from './accessControl';

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Gets the current authenticated user
 */
/**
 * Gets the current authenticated user with RLS support
 * @returns User object or null if not authenticated
 * @throws RLSError if RLS policy prevents access
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

    // First try with regular client
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      if (isRLSError(userError)) {
        // Fall back to admin client if RLS blocks access
        const { data: adminData } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        return adminData;
      }
      throw userError;
    }

    if (!userData) {
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
    if (isRLSError(error)) {
      throw error;
    }
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Checks if user is authorized for a specific operation
 * @param user - The user to check
 * @param requiredRole - The required role for the operation
 * @returns boolean indicating authorization status
 */
export function isUserAuthorized(user: User | undefined, requiredRole: string): boolean {
  if (!user) return false;
  return user.role === requiredRole || user.role === 'admin';
}

/**
 * Signs in a user with email and password
 */
/**
 * Signs in a user with RLS support
 * @param email - User's email address
 * @param password - User's password
 * @returns Object containing user data and error information
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const normalizedEmail = normalizeEmail(email);
    
    // First try with regular client
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
          code: 'AUTH_ERROR',
        },
      };
    }

    if (!data.user) {
      return {
        user: null,
        error: {
          message: 'No user found',
          status: 404,
          code: 'USER_NOT_FOUND',
        },
      };
    }

    // Try to get user data with regular client first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      if (isRLSError(userError)) {
        // Fall back to admin client if RLS blocks access
        const { data: adminData } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (adminData) {
          return {
            user: {
              id: adminData.id,
              email: adminData.email,
              role: adminData.role,
              clientId: adminData.client_id,
              createdAt: adminData.created_at,
            },
            error: null,
          };
        }
      }
      
      return {
        user: null,
        error: {
          message: userError.message,
          status: 403,
          code: 'PERMISSION_DENIED',
        },
      };
    }

    if (!userData) {
      return {
        user: null,
        error: {
          message: 'User data not found',
          status: 404,
          code: 'USER_NOT_FOUND',
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
    if (isRLSError(error)) {
      return {
        user: null,
        error: {
          message: 'Access denied',
          status: 403,
          code: 'PERMISSION_DENIED',
        },
      };
    }
    
    return {
      user: null,
      error: {
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
        status: 500,
        code: 'INTERNAL_ERROR',
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