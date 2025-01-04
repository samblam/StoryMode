import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';
import { isRLSError, handleRLSError, verifyAuthorization } from '../../../utils/accessControl';
import { getCurrentUser } from '../../../utils/authUtils';
import type { AuthResponse, AuthError } from '../../../types/auth';

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Get current user from session
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'USER_NOT_FOUND',
            status: 401
          }
        }),
        {
          status: 401,
          headers
        }
      );
    }

    // Authorization check - requires admin role
    const { authorized, error: authCheckError } = await verifyAuthorization(
      currentUser,
      'admin',
      'admin'
    );

    if (!authorized) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: authCheckError?.message || 'Unauthorized',
            code: authCheckError?.code || 'ADMIN_REQUIRED',
            status: 403
          }
        }),
        {
          status: 403,
          headers
        }
      );
    }

    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('CREATE_USER')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    const { email, password, role, name, company } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate required fields
    if (!normalizedEmail || !password || !role) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Missing required fields',
            code: 'AUTH_ERROR',
            status: 400
          }
        }),
        { 
          status: 400,
          headers
        }
      );
    }

    // Validate role
    if (!['admin', 'client'].includes(role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Invalid role',
            code: 'AUTH_ERROR',
            status: 400
          }
        }),
        { 
          status: 400,
          headers
        }
      );
    }

    // If client role, validate client name
    if (role === 'client' && !name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Client name is required',
            code: 'AUTH_ERROR',
            status: 400
          }
        }),
        { 
          status: 400,
          headers
        }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Email already in use',
            code: 'AUTH_ERROR',
            status: 400
          }
        }),
        { 
          status: 400,
          headers
        }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true
    });

    if (authError) {
      return handleRLSError(authError);
    }
    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'No user returned from auth creation',
            code: 'INTERNAL_ERROR',
            status: 500
          }
        }),
        { status: 500, headers }
      );
    }

    const userId = authData.user.id;

    // 2. If client role, create client record
    let clientId: string | null = null;
    if (role === 'client') {
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          name,
          company,
          email: normalizedEmail,
          active: true
        })
        .select('id')
        .single();

      if (clientError) {
        // Cleanup auth user if client creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return handleRLSError(clientError);
      }

      clientId = clientData.id;
    }

    // 3. Create user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: normalizedEmail,
        role,
        client_id: clientId
      });

    if (userError) {
      // Cleanup on user creation failure
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (clientId) {
        await supabaseAdmin.from('clients').delete().eq('id', clientId);
      }
      return handleRLSError(userError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error('Create user error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create user',
          code: 'INTERNAL_ERROR',
          status: 500
        }
      }),
      { 
        status: 500,
        headers
      }
    );
  }
};