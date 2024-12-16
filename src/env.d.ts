/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  clientId?: string;
  client?: {
    id: string;
    name: string;
    active: boolean;
  };
}

declare namespace App {
  interface Locals {
    user?: User;
  }
}