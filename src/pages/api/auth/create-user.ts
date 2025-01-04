import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../../utils/rateLimit';
import { ValidationError, AuthError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
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
      throw new ValidationError('Missing required fields', {
        fields: {
          email: !!normalizedEmail,
          password: !!password,
          role: !!role
        }
      });
    }

    // Validate role
    if (!['admin', 'client'].includes(role)) {
      throw new ValidationError('Invalid role', {
        validRoles: ['admin', 'client'],
        providedRole: role
      });
    }

    // If client role, validate client name
    if (role === 'client' && !name) {
      throw new ValidationError('Client name is required', {
        requiredForRole: 'client',
        missingField: 'name'
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      throw new ValidationError('Email already in use', {
        email: normalizedEmail,
        existingUserId: existingUser.id
      });
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true
    });

    if (authError) {
      throw new AuthError('Auth creation failed', {
        error: authError.message,
        email: normalizedEmail,
        errorCode: authError.code
      });
    }
    if (!authData.user) {
      throw new AuthError('No user returned from auth creation', {
        email: normalizedEmail
      });
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
        throw new DatabaseError('Client creation failed', {
          error: clientError.message,
          clientName: name,
          company,
          errorCode: clientError.code
        });
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
      throw new DatabaseError('User record creation failed', {
        error: userError.message,
        userId,
        clientId,
        errorCode: userError.code
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers
      }
    );

  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiErrorHandler(error, { request, cookies });
    }
    return apiErrorHandler(new Error('Failed to create user'), { request, cookies });
  }
};