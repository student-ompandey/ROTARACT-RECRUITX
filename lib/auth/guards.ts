import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type UserRole = 'admin' | 'interviewer';

export interface AuthSessionUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

/**
 * Checks if Supabase credentials have been configured with a real project.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('dummy') &&
    !url.includes('your-project') &&
    key.length > 20
  );
}

/**
 * Server-side function to get the current authenticated user and their verified database role.
 * NEVER trusts client-side metadata or JWT claims without verifying against public.user_roles.
 */
export async function getCurrentUserRole(): Promise<AuthSessionUser | null> {
  if (!isSupabaseConfigured()) {
    // Development / Demonstration fallback user
    return {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@rotaract-tits.org',
      role: 'admin',
      fullName: 'Lead Administrator',
    };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Fetch verified role from database
    const { data: roleRecord, error: roleError } = await supabase
      .from('user_roles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single();

    if (roleError || !roleRecord) {
      return {
        id: user.id,
        email: user.email || '',
        role: 'interviewer',
        fullName: user.email?.split('@')[0] || 'User',
      };
    }

    return {
      id: user.id,
      email: user.email || roleRecord.email,
      role: roleRecord.role as UserRole,
      fullName: roleRecord.full_name,
    };
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
}

/**
 * Enforces admin authorization on Server Components, Server Actions, or Route Handlers.
 */
export async function requireAdmin(): Promise<AuthSessionUser> {
  const user = await getCurrentUserRole();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/unauthorized?required=admin');
  }

  return user;
}

/**
 * Enforces authenticated interviewer access (accessible by both interviewers and admins).
 */
export async function requireInterviewer(): Promise<AuthSessionUser> {
  const user = await getCurrentUserRole();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'interviewer' && user.role !== 'admin') {
    redirect('/unauthorized?required=interviewer');
  }

  return user;
}
