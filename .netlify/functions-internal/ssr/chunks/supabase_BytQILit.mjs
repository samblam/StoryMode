import { createClient } from '@supabase/supabase-js/dist/module/index.js';

const supabaseUrl = "https://iubzudsaueifxrwrqfjw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Ynp1ZHNhdWVpZnhyd3JxZmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3Njc2NzQsImV4cCI6MjA0OTM0MzY3NH0.SNXX_0_NMSJqOKSMMxM5WP6sfR3zokgCgdJkH4s-xfg";
const supabaseServiceRole = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Ynp1ZHNhdWVpZnhyd3JxZmp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzc2NzY3NCwiZXhwIjoyMDQ5MzQzNjc0fQ.EYDsOqlYklGx09XvHd7gq0lcc7mmDlqgCYXhyMHJnl4";
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRole,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

export { supabase, supabaseAdmin };
