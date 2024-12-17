// src/types/auth.ts
export type UserRole = 'admin' | 'client';

export interface ClientInfo {
  id: string;
  name: string;
  company?: string | null;
  email: string;
  active: boolean;
  created_at: string;
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
}