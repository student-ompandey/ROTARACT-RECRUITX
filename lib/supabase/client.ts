import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-safe Supabase client.
 * Uses only NEXT_PUBLIC_ credentials with restricted anon key.
 * Safe to use in Client Components for auth state listeners and interactive triggers.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    // Graceful fallback during setup or build phase before envs are connected
    console.warn('Supabase URL or Anon Key is missing in browser client environment.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
