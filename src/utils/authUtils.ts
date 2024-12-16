import { supabase } from '../lib/supabase';
import type { User, Client, AuthError } from '../types/auth';

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

export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

export async function getClientId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.clientId ?? null;
}

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
