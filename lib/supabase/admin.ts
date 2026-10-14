import { createClient } from '@supabase/supabase-js';

/**
 * High-privilege administrative Supabase client using the SERVICE ROLE KEY.
 * 
 * SECURITY STRICT RULES:
 * 1. NEVER import this in Client Components ("use client").
 * 2. NEVER expose SUPABASE_SERVICE_ROLE_KEY to NEXT_PUBLIC_ variables.
 * 3. Use solely for administrative tasks like user provisioning, role assignments,
 *    and system queue operations that bypass RLS intentionally.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase administrative credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is undefined.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
