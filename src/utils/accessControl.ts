import { supabase, supabaseAdmin } from '../lib/supabase';
import type { User, ClientInfo, AuthErrorCode, AuthError } from '../types/auth';
import type { Database } from '../types/database';
import type { AstroGlobal } from 'astro';
import { getCurrentUser } from './authUtils';

/**
 * Error type for Row Level Security (RLS) violations
 */
export interface RLSError extends Error {
  code: string;
  details?: string;
}

/**
 * Type guard to check if an error is an RLSError
 * @param error - The error to check
 * @returns boolean indicating if the error is an RLSError
 */
export function isRLSError(error: unknown): error is RLSError {
  return error instanceof Error &&
         'code' in error &&
         (error as any).code === 'PGRST301';
}

/**
 * Handles RLS errors and returns an appropriate response
 * @param error - The error to handle
 * @returns Response object with error details
 */
export async function handleRLSError(error: unknown): Promise<Response> {
  if (isRLSError(error)) {
    return new Response(JSON.stringify({
      error: 'Access denied',
      code: 'PERMISSION_DENIED'
    }), { status: 403 });
  }
  
  // Handle other errors
  return new Response(JSON.stringify({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }), { status: 500 });
}

/**
 * Verifies user authorization for a specific operation
 * @param user - The user to verify
 * @param requiredRole - The required role for the operation
 * @param operationType - Type of operation being performed
 * @returns Promise resolving to authorization status and optional error
 */
export async function verifyAuthorization(
  user: User | undefined,
  requiredRole: string,
  operationType: 'read' | 'write' | 'admin' | 'participant'
): Promise<{
  authorized: boolean;
  error?: {
    code: AuthErrorCode;
    message: string;
  }
}> {
  if (!user) {
    return {
      authorized: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not authenticated'
      }
    };
  }

  // Admin operations require admin role
  if (operationType === 'admin' && !isAdmin(user)) {
    return {
      authorized: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin privileges required'
      }
    };
  }

    // Participant operations require participant role
    if (operationType === 'participant' && user.role !== 'participant') {
        return {
            authorized: false,
            error: {
                code: 'PARTICIPANT_REQUIRED',
                message: 'Participant privileges required'
            }
        };
    }

    // Check if user has required role
    if (!isUserAuthorized(user, requiredRole)) {
        return {
            authorized: false,
            error: {
                code: 'PERMISSION_DENIED' as AuthErrorCode,
                message: 'Insufficient permissions'
            }
        };
    }

  return { authorized: true };
}

/**
 * Checks if a user has admin privileges
 * @param user - The user to check
 * @returns boolean indicating admin status
 */
export function isAdmin(user: User | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * Checks if a user is authorized for an operation
 * @param user - The user to check
 * @param requiredRole - The required role for the operation
 * @returns boolean indicating authorization status
 */
export function isUserAuthorized(user: User | undefined, requiredRole: string): boolean {
  if (!user) return false;
  return user.role === requiredRole || isAdmin(user) || user.role === 'participant';
}

/**
 * Checks if a user is authorized to view survey results
 * @param user - The user to check
 * @param survey - The survey to check
 * @returns boolean indicating authorization status
 */
export function canViewSurveyResults(user: User | undefined, survey: { client_id: string, visible_to_client: boolean }): boolean {
    if (!user) return false;
    if (isAdmin(user)) return true;
    if (user.role === 'client' && user.clientId === survey.client_id && survey.visible_to_client) return true;
    return false;
}

type SoundProfileWithClient = Database['public']['Tables']['sound_profiles']['Row'] & {
  client?: Database['public']['Tables']['clients']['Row'] | null;
  sounds: Database['public']['Tables']['sounds']['Row'][];
};


export async function getAccessibleSoundProfiles(user: User | undefined): Promise<SoundProfileWithClient[]> {
  if (!user) {
    return [];
  }

  try {
    let query = supabaseAdmin
      .from('sound_profiles')
      .select(`
        *,
        client:clients(*),
        sounds(*)
      `)
      .order('created_at', { ascending: false });

    // If user is a client or participant, filter to only show their profiles
    if (user.role === 'client' && user.clientId) {
      query = query.eq('client_id', user.clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sound profiles:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sound profiles:', error);
    return [];
  }
}

export async function getAccessibleSounds(user: User | undefined) {
  if (!user) {
    return [];
  }

  try {
    let query = supabaseAdmin
      .from('sounds')
      .select(`
        *,
        sound_profiles!inner(
          *,
          client:clients(*)
        )
      `)
      .order('created_at', { ascending: false });

    // If user is a client, filter to only show their sounds
    if (user.role === 'client' && user.clientId) {
      query = query.eq('sound_profiles.client_id', user.clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sounds:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching sounds:', error);
    return [];
  }
}

export function organizeProfilesByClient(profiles: SoundProfileWithClient[]) {
  return profiles.reduce((acc, profile) => {
    const clientName = profile.client?.name || 'No Client';
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(profile);
    return acc;
  }, {} as Record<string, SoundProfileWithClient[]>);
}

/**
 * Checks if the current request is from an admin user
 * @param Astro - The Astro global object
 * @returns Promise<boolean> indicating if user has admin access
 */
export async function checkAdminAccess(Astro: AstroGlobal): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    return isAdmin(user);
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}