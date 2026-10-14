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
 * Server-side function to get the current authenticated user and their verified database role.
 * NEVER trusts client-side metadata or JWT claims without verifying against public.user_roles.
 */
export async function getCurrentUserRole(): Promise<AuthSessionUser | null> {
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
    // Authenticated in Supabase Auth, but no provisioned role assigned
    return {
      id: user.id,
      email: user.email || '',
      role: 'interviewer', // Default least-privilege fallback
      fullName: user.email?.split('@')[0] || 'User',
    };
  }

  return {
    id: user.id,
    email: user.email || roleRecord.email,
    role: roleRecord.role as UserRole,
    fullName: roleRecord.full_name,
  };
}

/**
 * Enforces admin authorization on Server Components, Server Actions, or Route Handlers.
 * Redirects or throws an error if caller is not an admin.
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

  // Both interviewers and admins can access interviewer workspaces
  if (user.role !== 'interviewer' && user.role !== 'admin') {
    redirect('/unauthorized?required=interviewer');
  }

  return user;
}
