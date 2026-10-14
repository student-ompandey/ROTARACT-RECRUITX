import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin, isSupabaseConfigured } from '@/lib/auth/guards';
import { formatToIST } from '@/lib/crypto/tokens';

export interface DashboardMetrics {
  totalRegisteredStudents: number;
  scheduledInterviews: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  selectedStudents: number;
  activeDriveName: string;
  interviewDateFormatted: string;
  isDemoMode: boolean;
}

export async function getDashboardOverview(): Promise<DashboardMetrics> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    const { mockStore } = await import('@/lib/services/mock-store');
    const drive = mockStore.drives[0];
    const totalStudents = mockStore.candidates.length;
    const scheduled = mockStore.candidates.filter(
      (c) => c.status === 'scheduled' || c.status === 'interviewed' || c.status === 'selected'
    ).length;
    const completed = mockStore.candidates.filter(
      (c) => c.status === 'interviewed' || c.status === 'selected'
    ).length;
    const pending = Math.max(0, scheduled - completed);
    const selected = mockStore.candidates.filter((c) => c.status === 'selected').length;

    return {
      totalRegisteredStudents: totalStudents,
      scheduledInterviews: scheduled,
      completedEvaluations: completed,
      pendingEvaluations: pending,
      selectedStudents: selected,
      activeDriveName: drive?.name || 'Rotaract Induction Drive 2026-27',
      interviewDateFormatted: drive ? formatToIST(drive.starts_at) : '16 Oct 2026, 10:00 AM IST',
      isDemoMode: true,
    };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Get active drive
  const { data: drive } = await supabase
    .from('recruitment_drives')
    .select('id, name, starts_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const driveId = drive?.id;

  // 2. Real counts from DB
  const { count: totalStudents } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true })
    .eq('drive_id', driveId || '');

  const { count: scheduled } = await supabase
    .from('interview_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('drive_id', driveId || '');

  const { count: completed } = await supabase
    .from('scorecards')
    .select('*, interview_assignments!inner(drive_id)', { count: 'exact', head: true })
    .eq('interview_assignments.drive_id', driveId || '');

  const { count: selected } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true })
    .eq('drive_id', driveId || '')
    .eq('status', 'selected');

  const pending = Math.max(0, (scheduled || 0) - (completed || 0));

  return {
    totalRegisteredStudents: totalStudents || 0,
    scheduledInterviews: scheduled || 0,
    completedEvaluations: completed || 0,
    pendingEvaluations: pending,
    selectedStudents: selected || 0,
    activeDriveName: drive?.name || 'No Active Drive',
    interviewDateFormatted: drive?.starts_at ? formatToIST(drive.starts_at) : 'Date Not Set',
    isDemoMode: false,
  };
}
