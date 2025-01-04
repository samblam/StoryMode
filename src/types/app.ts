import type { Session } from '@supabase/supabase-js';
import type { User } from './auth';

export interface AppLocals {
  auth?: {
    session: Session | null;
    user: User | null;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResponse {
  success: boolean;
  errors?: ValidationError[];
  error?: string;  // For general errors
}