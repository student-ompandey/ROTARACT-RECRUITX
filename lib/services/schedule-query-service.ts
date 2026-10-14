import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { formatToIST } from '@/lib/crypto/tokens';

export interface ScheduleSlotItem {
  id: string;
  driveId: string;
  panelId: string;
  panelName: string;
  meetLink: string | null;
  startsAt: string;
  endsAt: string;
  startsAtFormatted: string;
  endsAtFormatted: string;
  candidateId: string | null;
  candidateName: string | null;
  candidateEnrollment: string | null;
  candidateBranch: string | null;
}

export interface DriveScheduleOverview {
  driveId: string;
  driveName: string;
  driveStatus: string;
  totalCandidates: number;
  assignedSlotsCount: number;
  totalSlotsCount: number;
  panels: Array<{
    id: string;
    name: string;
    meetLink: string | null;
    slotsCount: number;
    assignedCount: number;
  }>;
  slots: ScheduleSlotItem[];
}

/**
 * Queries persisted interview slots and assignments for a recruitment drive.
 */
export async function getDriveSchedule(
  driveId?: string
): Promise<DriveScheduleOverview | null> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // 1. Pick target drive (or latest active drive)
  let targetDriveId = driveId;
  if (!targetDriveId) {
    const { data: latestDrive } = await supabase
      .from('recruitment_drives')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    targetDriveId = latestDrive?.id;
  }

  if (!targetDriveId) {
    return null;
  }

  // 2. Fetch drive details
  const { data: drive } = await supabase
    .from('recruitment_drives')
    .select('id, name, status')
    .eq('id', targetDriveId)
    .single();

  if (!drive) return null;

  // 3. Count candidates
  const { count: totalCandidates } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true })
    .eq('drive_id', targetDriveId);

  // 4. Fetch panels
  const { data: panelsData } = await supabase
    .from('interview_panels')
    .select('id, name, meet_link')
    .eq('drive_id', targetDriveId)
    .order('name', { ascending: true });

  // 5. Fetch slots with joined assignments
  const { data: slotsData } = await supabase
    .from('interview_slots')
    .select(`
      id,
      drive_id,
      panel_id,
      starts_at,
      ends_at,
      interview_panels (
        name,
        meet_link
      ),
      interview_assignments (
        candidate_id,
        candidates (
          id,
          full_name,
          enrollment_no,
          branch
        )
      )
    `)
    .eq('drive_id', targetDriveId)
    .order('starts_at', { ascending: true });

  const slots: ScheduleSlotItem[] = (slotsData || []).map((s: any) => {
    const assignment = s.interview_assignments?.[0];
    const candidate = assignment?.candidates;

    return {
      id: s.id,
      driveId: s.drive_id,
      panelId: s.panel_id,
      panelName: s.interview_panels?.name || 'Panel',
      meetLink: s.interview_panels?.meet_link || null,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      startsAtFormatted: formatToIST(s.starts_at),
      endsAtFormatted: formatToIST(s.ends_at),
      candidateId: candidate?.id || null,
      candidateName: candidate?.full_name || null,
      candidateEnrollment: candidate?.enrollment_no || null,
      candidateBranch: candidate?.branch || null,
    };
  });

  const assignedSlotsCount = slots.filter((s) => s.candidateId !== null).length;

  const panels = (panelsData || []).map((p) => {
    const panelSlots = slots.filter((s) => s.panelId === p.id);
    return {
      id: p.id,
      name: p.name,
      meetLink: p.meet_link,
      slotsCount: panelSlots.length,
      assignedCount: panelSlots.filter((s) => s.candidateId !== null).length,
    };
  });

  return {
    driveId: drive.id,
    driveName: drive.name,
    driveStatus: drive.status,
    totalCandidates: totalCandidates || 0,
    assignedSlotsCount,
    totalSlotsCount: slots.length,
    panels,
    slots,
  };
}
