import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { formatToIST } from '@/lib/crypto/tokens';

export interface CandidateRosterItem {
  id: string;
  driveId: string;
  driveName: string;
  enrollmentNo: string;
  fullName: string;
  email: string;
  phone: string | null;
  branch: string;
  yearOfStudy: string;
  status: string;
  createdAtFormatted: string;
  panelName: string;
  slotFormatted: string;
}

export interface CandidateFilters {
  driveId?: string;
  search?: string;
  status?: string;
  branch?: string;
}

/**
 * Fetches real candidate records from Supabase with search, branch, and status filtering.
 */
export async function getCandidatesRoster(
  filters: CandidateFilters = {}
): Promise<{
  candidates: CandidateRosterItem[];
  availableBranches: string[];
  totalCount: number;
}> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('candidates')
    .select(`
      id,
      drive_id,
      enrollment_no,
      full_name,
      email,
      phone,
      branch,
      year_of_study,
      status,
      created_at,
      recruitment_drives (
        name
      ),
      interview_assignments (
        interview_slots (
          starts_at,
          interview_panels (
            name
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.driveId) {
    query = query.eq('drive_id', filters.driveId);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.branch && filters.branch !== 'all') {
    query = query.eq('branch', filters.branch);
  }

  if (filters.search) {
    const s = filters.search.trim();
    query = query.or(
      `full_name.ilike.%${s}%,enrollment_no.ilike.%${s}%,email.ilike.%${s}%`
    );
  }

  const { data: records, error } = await query;

  if (error || !records) {
    return { candidates: [], availableBranches: [], totalCount: 0 };
  }

  const branchesSet = new Set<string>();

  const candidates: CandidateRosterItem[] = records.map((r: any) => {
    if (r.branch) branchesSet.add(r.branch);

    const assignment = r.interview_assignments?.[0];
    const slot = assignment?.interview_slots;
    const panelName = slot?.interview_panels?.name || 'Unassigned';
    const slotFormatted = slot?.starts_at ? formatToIST(slot.starts_at) : 'Not scheduled';

    return {
      id: r.id,
      driveId: r.drive_id,
      driveName: r.recruitment_drives?.name || 'General Drive',
      enrollmentNo: r.enrollment_no,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      branch: r.branch,
      yearOfStudy: r.year_of_study,
      status: r.status,
      createdAtFormatted: formatToIST(r.created_at),
      panelName,
      slotFormatted,
    };
  });

  return {
    candidates,
    availableBranches: Array.from(branchesSet),
    totalCount: candidates.length,
  };
}
