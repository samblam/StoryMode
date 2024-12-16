export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  clientId?: string;
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
