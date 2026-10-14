'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Server Action for authenticating with Email and Password.
 */
export async function signInAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  if (!email || !password) {
    return { error: 'Please provide both email and password.' };
  }

  // Graceful support for local demo testing when remote Supabase project is not yet provisioned
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured = Boolean(
    supabaseUrl &&
    !supabaseUrl.includes('dummy') &&
    !supabaseUrl.includes('your-project')
  );

  if (!isConfigured) {
    // In local demo mode, any test login or demo credentials redirect smoothly to dashboard
    redirect(redirectTo);
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

/**
 * Server Action to sign out current user and clear session cookies.
 */
export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
