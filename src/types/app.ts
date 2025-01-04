import type { Session } from '@supabase/supabase-js';
import type { User } from './auth';

export interface AppLocals {
  auth?: {
    session: Session | null;
    user: User | null;
  };
}