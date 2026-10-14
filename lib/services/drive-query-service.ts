import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { formatToIST } from '@/lib/crypto/tokens';

export interface DriveListItem {
  id: string;
  name: string;
  academicYear: string;
  status: string;
  targetCandidates: number;
  description: string | null;
  startsAtFormatted: string;
  endsAtFormatted: string;
  panelsCount: number;
  candidatesCount: number;
  assignmentsCount: number;
}

export interface DriveDetailData {
  id: string;
  name: string;
  academicYear: string;
  status: string;
  targetCandidates: number;
  description: string | null;
  startsAt: string;
  endsAt: string;
  startsAtFormatted: string;
  endsAtFormatted: string;
  stats: {
    totalCandidates: number;
    assignedInterviews: number;
    pendingScorecards: number;
    completedScorecards: number;
    panelsCount: number;
  };
  panels: Array<{
    id: string;
    name: string;
    description: string | null;
    meetLink: string | null;
    members: Array<{
      userId: string;
      fullName: string;
      email: string;
      roleInPanel: string;
    }>;
  }>;
}

/**
 * Fetches all recruitment drives with aggregated operational counts from Supabase.
 */
export async function getDrivesList(): Promise<DriveListItem[]> {
  await requireAdmin();

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    return mockStore.drives.map((d) => ({
      id: d.id,
      name: d.name,
      academicYear: d.academic_year,
      status: d.status,
      targetCandidates: d.target_candidates,
      description: d.description,
      startsAtFormatted: formatToIST(d.starts_at),
      endsAtFormatted: d.ends_at ? formatToIST(d.ends_at) : 'Not specified',
      panelsCount: mockStore.panels.filter((p) => p.drive_id === d.id).length,
      candidatesCount: mockStore.candidates.filter((c) => c.drive_id === d.id).length,
      assignmentsCount: mockStore.candidates.filter((c) => c.drive_id === d.id).length,
    }));
  }

  const supabase = await createServerSupabaseClient();

  const { data: drives, error } = await supabase
    .from('recruitment_drives')
    .select(`
      id,
      name,
      academic_year,
      status,
      target_candidates,
      description,
      starts_at,
      ends_at,
      interview_panels (count),
      candidates (count),
      interview_assignments (count)
    `)
    .order('created_at', { ascending: false });

  if (error || !drives) {
    return [];
  }

  return drives.map((d: any) => ({
    id: d.id,
    name: d.name,
    academicYear: d.academic_year,
    status: d.status,
    targetCandidates: d.target_candidates,
    description: d.description,
    startsAtFormatted: formatToIST(d.starts_at),
    endsAtFormatted: d.ends_at ? formatToIST(d.ends_at) : 'Not specified',
    panelsCount: d.interview_panels?.[0]?.count || 0,
    candidatesCount: d.candidates?.[0]?.count || 0,
    assignmentsCount: d.interview_assignments?.[0]?.count || 0,
  }));
}

/**
 * Fetches full details, panels, members, and aggregated stats for a specific drive.
 */
export async function getDriveDetail(driveId: string): Promise<DriveDetailData | null> {
  await requireAdmin();

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    const drive = mockStore.drives.find((d) => d.id === driveId) || mockStore.drives[0];
    if (!drive) return null;

    const panels = mockStore.panels
      .filter((p) => p.drive_id === drive.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        meetLink: p.meet_link,
        members: [
          { userId: 'u1', fullName: 'Lead Evaluator', email: 'lead@rotaract.org', roleInPanel: 'lead' },
          { userId: 'u2', fullName: 'Domain Evaluator', email: 'eval@rotaract.org', roleInPanel: 'evaluator' },
        ],
      }));

    return {
      id: drive.id,
      name: drive.name,
      academicYear: drive.academic_year,
      status: drive.status,
      targetCandidates: drive.target_candidates,
      description: drive.description,
      startsAt: drive.starts_at,
      endsAt: drive.ends_at,
      startsAtFormatted: formatToIST(drive.starts_at),
      endsAtFormatted: drive.ends_at ? formatToIST(drive.ends_at) : 'TBD',
      stats: {
        totalCandidates: mockStore.candidates.filter((c) => c.drive_id === drive.id).length,
        assignedInterviews: mockStore.candidates.filter((c) => c.drive_id === drive.id).length,
        pendingScorecards: 1,
        completedScorecards: 2,
        panelsCount: panels.length,
      },
      panels,
    };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Fetch drive record
  const { data: drive, error: driveErr } = await supabase
    .from('recruitment_drives')
    .select('*')
    .eq('id', driveId)
    .single();

  if (driveErr || !drive) {
    return null;
  }

  // 2. Fetch panels with panel_members & user details
  const { data: panelsData } = await supabase
    .from('interview_panels')
    .select(`
      id,
      name,
      description,
      meet_link,
      panel_members (
        user_id,
        role_in_panel,
        user_roles (
          full_name,
          email
        )
      )
    `)
    .eq('drive_id', driveId)
    .order('created_at', { ascending: true });

  // 3. Operational Counts
  const { count: totalCandidates } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true })
    .eq('drive_id', driveId);

  const { count: assignedInterviews } = await supabase
    .from('interview_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('drive_id', driveId);

  const { count: completedScorecards } = await supabase
    .from('scorecards')
    .select('*, interview_assignments!inner(drive_id)', { count: 'exact', head: true })
    .eq('interview_assignments.drive_id', driveId);

  const pendingScorecards = Math.max(0, (assignedInterviews || 0) - (completedScorecards || 0));

  const panels = (panelsData || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    meetLink: p.meet_link,
    members: (p.panel_members || []).map((pm: any) => ({
      userId: pm.user_id,
      fullName: pm.user_roles?.full_name || 'Evaluator',
      email: pm.user_roles?.email || '',
      roleInPanel: pm.role_in_panel,
    })),
  }));

  return {
    id: drive.id,
    name: drive.name,
    academicYear: drive.academic_year,
    status: drive.status,
    targetCandidates: drive.target_candidates,
    description: drive.description,
    startsAt: drive.starts_at,
    endsAt: drive.ends_at,
    startsAtFormatted: formatToIST(drive.starts_at),
    endsAtFormatted: drive.ends_at ? formatToIST(drive.ends_at) : 'TBD',
    stats: {
      totalCandidates: totalCandidates || 0,
      assignedInterviews: assignedInterviews || 0,
      pendingScorecards,
      completedScorecards: completedScorecards || 0,
      panelsCount: panels.length,
    },
    panels,
  };
}

/**
 * Fetches all active interviewers available to be assigned to panels.
 */
export async function getAvailableInterviewers() {
  await requireAdmin();

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    return mockStore.interviewers.map((i) => ({
      id: i.id,
      full_name: i.full_name,
      email: i.email,
      role: i.role,
    }));
  }

  const supabase = await createServerSupabaseClient();

  const { data: interviewers } = await supabase
    .from('user_roles')
    .select('id, full_name, email, role')
    .order('full_name', { ascending: true });

  return interviewers || [];
}
