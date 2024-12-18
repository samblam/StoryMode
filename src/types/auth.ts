// src/types/auth.ts
export type UserRole = 'admin' | 'client';



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
  role: 'admin' | 'client';
  clientId?: string | null;
  client?: ClientInfo | null;
  createdAt: string;
}
export interface AuthError {
  message: string;
  status: number;
}