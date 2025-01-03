require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');
const { Database } = require('../src/types/database');

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'anon_key';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service_role_key';

global.import = global.import || {};
global.import.meta = global.import.meta || { env: {} };
global.import.meta.env.PUBLIC_SUPABASE_URL = supabaseUrl;
global.import.meta.env.PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
global.import.meta.env.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceRole;

const { supabaseAdmin } = require('../src/lib/supabase');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

describe('Cookie Security Tests', () => {
  it('should set the HttpOnly flag on the session cookie', async () => {
    const email = `test${Date.now()}@example.com`;
    const password = 'Password123!';

    // Create a test user
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();

    // Perform login to get the session cookie
    const loginResponse = await request('http://localhost:4321')
      .post('/api/auth/login')
      .send({ email, password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers['set-cookie']).toBeDefined();

    const sessionCookie = loginResponse.headers['set-cookie'].find((cookie: string) =>
      cookie.startsWith('sb-')
    );

    expect(sessionCookie).toContain('HttpOnly');

    // Clean up the test user
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
  }, 10000);
});