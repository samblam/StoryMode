// src/types/auth.ts
export type UserRole = 'admin' | 'client' | 'participant';


export interface ClientInfo {
  id: string;
  name: string;
  company?: string | null;
  email: string;
  active: boolean;
  created_at?: string; // Make this optional since we don't always need it
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  clientId?: string | null;
  client?: ClientInfo | null;
  createdAt: string;
}
export interface AuthError {
  message: string;
  status: number;
  code?: string;
}

export type AuthErrorCode =
  | 'AUTH_ERROR'
  | 'USER_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INTERNAL_ERROR'
  | 'ADMIN_REQUIRED'
  | 'RLS_VIOLATION'
  | 'PARTICIPANT_REQUIRED';

export interface AuthResponse {
  success: boolean;
  error?: AuthError;
  data?: unknown;
}