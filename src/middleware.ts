import type { MiddlewareHandler } from "astro";
import { verifyAuthorization } from "./utils/accessControl";
import { getParticipantById, validateParticipantAccess } from "./utils/authUtils";
import type { User } from "./types/auth";

// Define proper types
declare module 'astro' {
  interface Locals {
    user?: User;
    participantId?: string | null;
  }
}

export const onRequest: MiddlewareHandler = async ({ request, locals, cookies }, next) => {
  try {
    console.log('Middleware - Starting authentication check');
    const token = cookies.get('sb-token');
    const participantToken = cookies.get('participant-token');

    // Handle participant authentication
    if (participantToken?.value) {
      console.log('Middleware - Participant token found');
      const { participant, error } = await getParticipantById(participantToken.value);
      if (participant) {
        console.log('Middleware - Participant authenticated:', participant.id);
        locals.participantId = participant.id;
        locals.user = {
          id: participant.id,
          email: participant.email || '',
          role: 'participant',
          createdAt: new Date().toISOString(),
          client: null
        };
        return next();
      } else {
        console.error('Middleware - Invalid participant token:', error);
        cookies.delete('participant-token', { path: '/' });
        return next();
      }
    }

    if (!token?.value) {
      console.log('Middleware - No token found');
      return next();
    }

    try {
      // Step 1: Verify token
      console.log('Middleware - Verifying token');
      const { supabaseAdmin } = await import('./lib/supabase');
      const { data: { user: authUser }, error: authError } =
        await supabaseAdmin.auth.getUser(token.value);
      
      if (authError) {
        console.error('Middleware - Auth error:', authError);
        cookies.delete('sb-token', { path: '/' });
        return next();
      }

      if (authUser) {
        console.log('Middleware - User authenticated:', authUser.id);
        // Step 2: Set minimal user data
        locals.user = {
          id: authUser.id,
          email: authUser.email || '',
          role: 'client', // Default role
          createdAt: authUser.created_at || '',
          client: null
        };

        // Step 3: Try to get additional user data
        try {
          console.log('Middleware - Fetching additional user data');
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select(`
              role,
              client_id,
              clients!client_id(
                id,
                name,
                email,
                active
              )
            `)
            .eq('id', authUser.id)
            .single()
            .throwOnError();

          if (userData) {
            console.log('Middleware - Additional user data found:', {
              role: userData.role,
              clientId: userData.client_id
            });
            
            // Update user data with role and client info
            const role = userData.role || 'client';
            const clientData = Array.isArray(userData.clients) && userData.clients.length > 0
              ? {
                  id: String(userData.clients[0].id),
                  name: String(userData.clients[0].name),
                  email: String(userData.clients[0].email),
                  active: Boolean(userData.clients[0].active)
                }
              : null;

            locals.user = {
              id: authUser.id,
              email: authUser.email || '',
              role: role,
              clientId: userData.client_id,
              client: clientData,
              createdAt: authUser.created_at || ''
            };
          }
        } catch (error) {
          console.error('Middleware - Error fetching additional user data:', error);
          cookies.delete('sb-token', { path: '/' });
          if (locals.user) {
            locals.user = {
              ...locals.user,
              client: null
            };
          }
        }
      } else {
        console.log('Middleware - No auth user found');
      }
    } catch (error) {
      console.error('Middleware - Auth error:', error);
      cookies.delete('sb-token', { path: '/' });
    }

    // Survey-specific route protection
    const surveyIdMatch = request.url.match(/\/api\/surveys\/([a-f0-9-]+)/);
    if (surveyIdMatch) {
      const surveyId = surveyIdMatch[1];
      const user = locals.user;

      // Check if user is a participant and has access to the survey
      if (user?.role === 'participant' && locals.participantId) {
        const hasAccess = await validateParticipantAccess(locals.participantId, surveyId);
        if (!hasAccess) {
          return new Response('Unauthorized', { status: 403 });
        }
        return next();
      }

      // Check if user is an admin or client and has access to the survey
      if (user?.role === 'admin' || user?.role === 'client') {
        const requiredRole = request.method === 'GET' ? 'read' : 'write';
        const { authorized, error } = await verifyAuthorization(user, user.role, requiredRole);
        if (!authorized) {
          return new Response(JSON.stringify(error), { status: 403 });
        }
      }
    }

    return next();
  } catch (error) {
    console.error('Middleware - Fatal error:', error);
    // Log the error stack trace if available
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    // Return a basic response instead of crashing
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
   });
 }
};