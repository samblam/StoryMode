import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { AuthError, DatabaseError, apiErrorHandler } from '../../../utils/errorHandler';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

    try {
        const token = cookies.get('sb-token')?.value;

        if (!token) {
            throw new AuthError('No token found in cookie');
        }
        
    // Verify the token
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      throw new AuthError('Invalid authentication token', {
        token
      });
    }

      const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
      
        if (userError || !userData) {
              throw new DatabaseError('No user found', {
                userId: authUser.id
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
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiErrorHandler(error, { request, cookies });
    }
    return apiErrorHandler(new Error('User check failed'), { request, cookies });
  }
};