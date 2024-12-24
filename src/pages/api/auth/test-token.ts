import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
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
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers
      });
    }

      const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
      
        if (userError || !userData) {
             throw new Error('No user found');
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