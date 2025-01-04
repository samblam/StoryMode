import { describe, it, expect, beforeAll } from '@jest/globals';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:4323'; // Updated base URL

describe('Authentication with RLS', () => {
  beforeAll(() => {
    // Create a test user before running tests
    try {
      execSync(
        `node -e "import { createClient } from '@supabase/supabase-js'; const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY); async function createTestUser() { const { error } = await supabase.auth.signUp({ email: 'test@example.com', password: 'password' }); if (error) throw error; } createTestUser();"`,
        { stdio: 'inherit' }
      );
    } catch (error) {
      console.error('Failed to create test user:', error);
    }
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
  });
});