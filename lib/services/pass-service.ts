import { createServerSupabaseClient } from '@/lib/supabase/server';
import { hashToken, formatToIST } from '@/lib/crypto/tokens';

export interface VerifiedCandidatePass {
  passId: string;
  candidateName: string;
  enrollmentNo: string;
  branch: string;
  yearOfStudy: string;
  driveName: string;
  panelName: string;
  meetLink: string | null;
  startsAtFormatted: string;
  endsAtFormatted: string;
  isValid: boolean;
}

/**
 * Validates candidate pass token by computing its SHA-256 hash and querying the RPC function.
 * This runs securely on the server and works for unauthenticated anonymous users.
 */
export async function getVerifiedPass(rawToken: string): Promise<VerifiedCandidatePass | null> {
  if (!rawToken || rawToken.trim().length === 0) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc('get_candidate_pass_by_hash', {
    p_token_hash: tokenHash,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const record = data[0];

  return {
    passId: record.pass_id,
    candidateName: record.candidate_name,
    enrollmentNo: record.enrollment_no,
    branch: record.branch,
    yearOfStudy: record.year_of_study,
    driveName: record.drive_name,
    panelName: record.panel_name || 'Panel Unassigned',
    meetLink: record.meet_link,
    startsAtFormatted: record.starts_at ? formatToIST(record.starts_at) : 'TBD',
    endsAtFormatted: record.ends_at ? formatToIST(record.ends_at) : 'TBD',
    isValid: Boolean(record.is_valid),
  };
}
