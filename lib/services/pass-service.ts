import { createServerSupabaseClient } from '@/lib/supabase/server';
import { hashToken, formatToIST, checkPassRateLimit } from '@/lib/crypto/tokens';
import { isSupabaseConfigured } from '@/lib/auth/guards';

export interface VerifiedCandidatePass {
  passId: string;
  candidateName: string;
  driveName: string;
  panelName: string;
  meetLink: string | null;
  startsAtFormatted: string;
  endsAtFormatted: string;
  timezone: string;
  isValid: boolean;
  rateLimited?: boolean;
}

/**
 * Validates candidate pass token by computing its SHA-256 hash and verifying active status.
 * Prevents enumeration, enforces rate-limiting, and strips sensitive internal records.
 */
export async function getVerifiedPass(
  rawToken: string,
  clientIp = 'unknown'
): Promise<VerifiedCandidatePass | null> {
  // 1. Basic sanitization
  if (!rawToken || rawToken.trim().length < 8) {
    return null;
  }

  // 2. Server-side Rate Limiting check
  const isAllowed = checkPassRateLimit(clientIp);
  if (!isAllowed) {
    return {
      passId: '',
      candidateName: '',
      driveName: '',
      panelName: '',
      meetLink: null,
      startsAtFormatted: '',
      endsAtFormatted: '',
      timezone: 'Asia/Kolkata',
      isValid: false,
      rateLimited: true,
    };
  }

  // 3. Fallback demo verification if Supabase is unconfigured in development
  if (!isSupabaseConfigured()) {
    if (rawToken === 'demo-token' || rawToken.length >= 16) {
      return {
        passId: 'demo-pass-id',
        candidateName: 'Aarav Sharma',
        driveName: 'Rotaract Induction Drive 2026-27',
        panelName: 'Panel 1 — Technical & Web',
        meetLink: 'https://meet.google.com/rx-tech-demo',
        startsAtFormatted: '20 Oct 2026, 10:00 AM',
        endsAtFormatted: '20 Oct 2026, 10:05 AM',
        timezone: 'Asia/Kolkata (IST)',
        isValid: true,
      };
    }
    return null;
  }

  // 4. SHA-256 Hash Lookup via Supabase RPC
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
    driveName: record.drive_name,
    panelName: record.panel_name || 'Panel Unassigned',
    meetLink: record.meet_link,
    startsAtFormatted: record.starts_at ? formatToIST(record.starts_at) : 'TBD',
    endsAtFormatted: record.ends_at ? formatToIST(record.ends_at) : 'TBD',
    timezone: 'Asia/Kolkata (IST)',
    isValid: Boolean(record.is_valid),
  };
}
