import { describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { http } from 'msw';
import { setupServer } from 'msw/node';

const BASE_URL = 'http://localhost:4321'; // Updated to Astro's default port

// Mock Supabase client
const supabase = createClient('https://mock-supabase-url.com', 'mock-anon-key');

// Mock service worker setup
const server = setupServer(
  http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    if (email === 'test@example.com' && password === 'password') {
      return new Response(JSON.stringify({ user: { id: 'test-user-id' } }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  })
);

describe('Authentication with RLS', () => {
  beforeAll(() => {
    // Start the mock server
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    // Reset all mocks after each test
    server.resetHandlers();
  });

  afterAll(() => {
    // Clean up the mock server
    server.close();
  });

  it('should successfully log in a valid user', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.user).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrong',
      }),
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });
});