// src/types/request.ts

// Extend the RequestInit type to include the duplex property
declare global {
  interface RequestInit {
    duplex?: 'half';
  }
}

export {};