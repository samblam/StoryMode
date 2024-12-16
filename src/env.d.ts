// src/env.d.ts
/// <reference types="astro/client" />
import type { User } from './types/auth';

declare namespace App {
  interface Locals {
    user?: User;
  }
}