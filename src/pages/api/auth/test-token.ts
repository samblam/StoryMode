import type { APIRoute } from 'astro';
import { getClient } from '../../../lib/supabase';
import { isRLSError, handleRLSError, verifyAuthorization } from '../../../utils/accessControl';
import { getCurrentUser } from '../../../utils/authUtils';
export const POST: APIRoute = async ({ cookies }) => {
  // Get current user from session
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Check if requester is authorized to test tokens (requires admin role)
  const { authorized, error: authError } = await verifyAuthorization(
    currentUser,
    'admin',
    'admin'
  );

  if (!authorized) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: authError?.message || 'Unauthorized',
          code: authError?.code || 'ADMIN_REQUIRED',
          status: 403
        }
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

    try {
        const token = cookies.get('sb-token')?.value;

        if (!token) {
            return new Response(JSON.stringify({ error: 'No token found in cookie' }), {
                status: 401,
                headers
            });
        }
        
    // Verify the token
    const supabaseAdmin = getClient({ requiresAdmin: true });
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers
      });
    }

      // Try with regular client first
      const supabase = getClient();
      const { data: regularData, error: regularError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let userData = null;

      if (regularError) {
        if (isRLSError(regularError)) {
          // Fall back to admin client if RLS blocks access
          const supabaseAdmin = getClient({ requiresAdmin: true });
          const { data: adminData, error: adminError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (adminError) {
            return handleRLSError(adminError);
          }
          if (!adminData) {
            return new Response(JSON.stringify({
              error: 'User data not found',
              code: 'USER_NOT_FOUND'
            }), {
              status: 404,
              headers
            });
          }
          userData = adminData;
        } else {
          return handleRLSError(regularError);
        }
      } else {
        userData = regularData;
      }

      if (!userData) {
        return new Response(JSON.stringify({
          error: 'User data not found',
          code: 'USER_NOT_FOUND'
        }), {
          status: 404,
          headers
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: authUser.id,
          email: authUser.email,
          role: userData.role,
          clientId: userData.client_id,
          createdAt: authUser.created_at
        }
      }), {
        status: 200,
        headers
      });
    
  } catch (error) {
    console.error('Error during user check:', error);
    return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "User check failed",
    }), {
      status: 500,
        headers
    });
  }
};