// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabase';
import type { Database } from '../../../types/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const { email, password } = await request.json();
    // Normalize email and validate format
const normalizedEmail = email.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
  return new Response(JSON.stringify({ 
    error: 'Please enter a valid email address' 
  }), { 
    status: 400,
    headers 
  });
}

    // Create a new Supabase client for this request
    const supabaseAuth = createClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Step 1: Sign in with normalized email and password
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: authError?.message || 'Authentication failed' 
      }), { 
        status: 401,
        headers 
      });
    }

    // Step 2: Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'User data not found' 
      }), { 
        status: 404,
        headers 
      });
    }

    // Step 3: Get client data if applicable
    let clientData = null;
    if (userData.client_id) {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', userData.client_id)
        .single();
      clientData = client;
    }

    // Set the auth cookie
    cookies.set('sb-token', authData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: authData.session.expires_in
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        clientId: userData.client_id,
        client: clientData,
        createdAt: userData.created_at
      }
    }), { 
      status: 200,
      headers 
    });

  } catch (error) {
    console.error('Login process error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication failed'
    }), { 
      status: 500,
      headers 
    });
  }
};