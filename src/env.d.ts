/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface User {
  id: string; // Unique user ID
  email: string; // Email address
  role: 'admin' | 'client'; // User role
  clientId?: string; // Optional client ID, if applicable
  createdAt?: string; // Timestamp for when the user was created
  client?: {
    id: string; // Associated client ID
    name: string; // Client name
    active: boolean; // Client active status
  };
}

declare namespace App {
  interface Locals {
    user?: User; // User data stored in the request context
  }
}
