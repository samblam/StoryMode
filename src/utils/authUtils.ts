import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../lib/supabase';
import type { User, AuthError } from '../types/auth';
import { isRLSError, handleRLSError } from './accessControl';
import type { AstroCookies } from 'astro';

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Gets the current authenticated user with RLS support
 * @returns User object or null if not authenticated
 * @throws RLSError if RLS policy prevents access
 */
export async function getCurrentUser(cookies?: AstroCookies): Promise<User | null> {
  try {
    // Try to get token from cookies if provided
    const token = cookies?.get('sb-token')?.value;
    
    if (token) {
      // If we have a token, verify it first
      const { data: { user: authUser }, error: authError } = 
        await supabaseAdmin.auth.getUser(token);

      if (authError || !authUser) {
        console.error('Auth error or no user found:', authError);
        return null;
      }

      // Get user data with admin client to bypass RLS
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          clients!client_id (
            id,
            name,
            email,
            active
          )
        `)
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: userData.clients ? {
          id: userData.clients.id,
          name: userData.clients.name,
          email: userData.clients.email,
          active: userData.clients.active
        } : null,
        createdAt: authUser.created_at || '',
      };
    }

    // Rest of the file remains the same...

    // If no token or no cookies provided, try session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

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
        
        if (!adminData) {
          return null;
        }

        return {
          id: adminData.id,
          email: adminData.email,
          role: adminData.role,
          clientId: adminData.client_id,
          createdAt: adminData.created_at,
        };
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
 * Creates a new survey participant
 * @param email - Participant's email address (optional)
 * @returns Object containing participant ID and error information
 */
export async function createParticipant(
  email?: string
): Promise<{ participantId: string | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .insert({
        email: email ? normalizeEmail(email) : null
      })
      .select('id')
      .single();

    if (error) {
      const authError: AuthError = {
        message: error.message,
        status: 500,
        code: 'CREATE_PARTICIPANT_ERROR',
      };
      return {
        participantId: null,
        error: authError,
      };
    }

    return {
      participantId: data.id,
      error: null,
    };
  } catch (error) {
    const err = error as any;
    const authError: AuthError = {
      message: err.message || 'An unknown error occurred',
      status: 500,
      code: 'INTERNAL_ERROR',
    };
    return {
      participantId: null,
      error: authError,
    };
  }
}

/**
 * Gets a participant by ID with RLS support
 * @param participantId - The participant's ID
 * @returns Object containing participant data and error information
 */
export async function getParticipantById(
  participantId: string
): Promise<{ participant: { id: string, email: string | null } | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id, email')
      .eq('id', participantId)
      .single();

    if (error) {
      if (isRLSError(error)) {
        // Fall back to admin client if RLS blocks access
        const { data: adminData } = await supabaseAdmin
          .from('participants')
          .select('id, email')
          .eq('id', participantId)
          .single();

        if (!adminData) {
          const authError: AuthError = {
            message: 'Participant not found',
            status: 404,
            code: 'PARTICIPANT_NOT_FOUND',
          };
          return {
            participant: null,
            error: authError,
          };
        }

        return {
          participant: adminData,
          error: null,
        };
      } else {
        // Type assertion: Tell TypeScript 'error' is a PostgrestError
        const pgError = error as PostgrestError;
        const authError: AuthError = {
          message: pgError.message,
          status: 403,
          code: 'PERMISSION_DENIED',
        };
        return {
          participant: null,
          error: authError,
        };
      }
    }

    return {
      participant: data,
      error: null,
    };
  } catch (error) {
    const authError: AuthError = {
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      status: 500,
      code: 'INTERNAL_ERROR',
    };
    return {
      participant: null,
      error: authError,
    };
  }
}

/**
 * Validates if a participant has access to a specific survey
 * @param participantId - The participant's ID
 * @param surveyId - The survey's ID
 * @returns boolean indicating access status
 */
export async function validateParticipantAccess(
  participantId: string,
  surveyId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('participant_id', participantId)
      .eq('survey_id', surveyId)
      .single();

    if (error) {
      if (isRLSError(error)) {
        // Fall back to admin client if RLS blocks access
        const { data: adminData } = await supabaseAdmin
          .from('survey_responses')
          .select('id')
          .eq('participant_id', participantId)
          .eq('survey_id', surveyId)
          .single();

        return !!adminData;
      }
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error validating participant access:', error);
    return false;
  }
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