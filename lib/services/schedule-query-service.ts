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
  dateFormatted: string; // e.g. "16 Oct 2026"
  timeFormatted: string; // e.g. "10:00 AM – 10:05 AM"
  startsAtFormatted: string;
  endsAtFormatted: string;
  candidateId: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  candidatePhone: string | null;
  candidateEnrollment: string | null;
  candidateBranch: string | null;
  candidateYear: string | null;
  status: 'Registered' | 'Scheduled' | 'Evaluation Pending' | 'Evaluated';
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

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    const targetDrive =
      (driveId ? mockStore.drives.find((d) => d.id === driveId) : null) || mockStore.drives[0];
    if (!targetDrive) return null;

    const drivePanels = mockStore.panels.filter((p) => p.drive_id === targetDrive.id);
    const driveCandidates = mockStore.candidates.filter((c) => c.drive_id === targetDrive.id);

    const slots: ScheduleSlotItem[] = driveCandidates.map((c, idx) => {
      const panel = drivePanels.find((p) => p.id === c.assigned_panel_id) || drivePanels[idx % drivePanels.length] || drivePanels[0];
      const startsAt = c.slot_starts_at || `${targetDrive.interview_date}T10:00:00+05:30`;
      const endsAt = c.slot_ends_at || `${targetDrive.interview_date}T10:05:00+05:30`;

      // Date formatted cleanly
      const startD = new Date(startsAt);
      const endD = new Date(endsAt);
      const dateFormatted = startD.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const startTimeStr = startD.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const endTimeStr = endD.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Human-readable status mapping
      let readableStatus: ScheduleSlotItem['status'] = 'Registered';
      if (c.status === 'scheduled') {
        readableStatus = 'Scheduled';
      } else if (c.status === 'interviewed') {
        readableStatus = 'Evaluated';
      } else if (c.status === 'applied') {
        readableStatus = 'Registered';
      } else {
        readableStatus = 'Evaluation Pending';
      }

      return {
        id: `slot_${c.id}`,
        driveId: targetDrive.id,
        panelId: panel ? panel.id : 'p1',
        panelName: panel ? panel.name : 'Panel 1',
        meetLink: panel ? panel.meet_link : null,
        startsAt,
        endsAt,
        dateFormatted,
        timeFormatted: `${startTimeStr} – ${endTimeStr}`,
        startsAtFormatted: formatToIST(startsAt),
        endsAtFormatted: formatToIST(endsAt),
        candidateId: c.id,
        candidateName: c.full_name,
        candidateEmail: c.email,
        candidatePhone: c.phone,
        candidateEnrollment: c.enrollment_no,
        candidateBranch: c.branch,
        candidateYear: c.year_of_study,
        status: readableStatus,
      };
    });

    const panels = drivePanels.map((p) => {
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
      driveId: targetDrive.id,
      driveName: targetDrive.name,
      driveStatus: targetDrive.status,
      totalCandidates: driveCandidates.length,
      assignedSlotsCount: slots.filter((s) => s.candidateId !== null).length,
      totalSlotsCount: slots.length,
      panels,
      slots,
    };
  }

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
          email,
          phone,
          enrollment_no,
          branch,
          year_of_study,
          status
        )
      )
    `)
    .eq('drive_id', targetDriveId)
    .order('starts_at', { ascending: true });

  const slots: ScheduleSlotItem[] = (slotsData || []).map((s: any) => {
    const assignment = s.interview_assignments?.[0];
    const candidate = assignment?.candidates;

    const startD = new Date(s.starts_at);
    const endD = new Date(s.ends_at);
    const dateFormatted = startD.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const startTimeStr = startD.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const endTimeStr = endD.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let readableStatus: ScheduleSlotItem['status'] = 'Registered';
    if (candidate?.status === 'scheduled') readableStatus = 'Scheduled';
    else if (candidate?.status === 'interviewed') readableStatus = 'Evaluated';
    else if (candidate?.status === 'applied') readableStatus = 'Registered';
    else readableStatus = 'Evaluation Pending';

    return {
      id: s.id,
      driveId: s.drive_id,
      panelId: s.panel_id,
      panelName: s.interview_panels?.name || 'Panel',
      meetLink: s.interview_panels?.meet_link || null,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      dateFormatted,
      timeFormatted: `${startTimeStr} – ${endTimeStr}`,
      startsAtFormatted: formatToIST(s.starts_at),
      endsAtFormatted: formatToIST(s.ends_at),
      candidateId: candidate?.id || null,
      candidateName: candidate?.full_name || null,
      candidateEmail: candidate?.email || null,
      candidatePhone: candidate?.phone || null,
      candidateEnrollment: candidate?.enrollment_no || null,
      candidateBranch: candidate?.branch || null,
      candidateYear: candidate?.year_of_study || null,
      status: readableStatus,
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
