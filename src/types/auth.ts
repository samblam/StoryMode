// src/types/auth.ts
export type UserRole = 'admin' | 'client';

interface ClientInfo {
  id: string;
  name: string;
  active: boolean;
  company?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  clientId?: string;
  client?: ClientInfo;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface AuthError {
  message: string;
  status: number;
}