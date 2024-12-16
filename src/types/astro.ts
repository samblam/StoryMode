// src/types/astro.ts
import type { User } from './auth';

declare module 'astro' {
  interface Locals {
    user?: User;  // Changed to use optional property syntax
  }
}