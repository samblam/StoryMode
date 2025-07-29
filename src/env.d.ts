/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface User {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'participant';
  clientId?: string | null;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    active: boolean;
  } | null;
}

interface StudyParticipant {
  id: string;
  sessionId: string;
  expiresAt: string;
}

declare namespace App {
  interface Locals {
    user?: User;
    participant?: StudyParticipant;
    participantId?: string | null;
    supabase?: import('@supabase/supabase-js').SupabaseClient;
  }
}