/// <reference path="../.astro/types.d.ts" />
// src/env.d.ts
/// <reference types="astro/client" />

interface Locals {
    user?: {
      id: string;
      email: string;
      role: 'admin' | 'client';
      clientId?: string;
      client?: {
        id: string;
        name: string;
        active: boolean;
      };
    };
  }