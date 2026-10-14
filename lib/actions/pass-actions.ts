'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { logAuditEvent } from '@/lib/services/audit-service';
import { generateCandidatePassToken } from '@/lib/crypto/tokens';
import { revalidatePath } from 'next/cache';

export interface PassManagementResult {
  success: boolean;
  rawToken?: string; // Only returned once upon creation/regeneration to the admin
  error?: string;
}

/**
 * Issues or regenerates a cryptographic pass token for a candidate.
 * The raw token is returned once for immediate transmission and never saved in DB.
 */
export async function issueCandidatePassTokenAction(
  candidateId: string,
  driveId: string,
  expiryHours = 72
): Promise<PassManagementResult> {
  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { rawToken, tokenHash } = generateCandidatePassToken();
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

  // Upsert token hash on candidate_id
  const { error } = await supabase.from('pass_tokens').upsert(
    {
      candidate_id: candidateId,
      drive_id: driveId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked: false,
      revoked_at: null,
      access_count: 0,
      last_accessed_at: null,
    },
    { onConflict: 'candidate_id' }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit event (raw token excluded)
  await logAuditEvent(admin, {
    action: 'PASS_TOKEN_GENERATED',
    driveId,
    targetEntity: 'pass_tokens',
    targetId: candidateId,
    details: { expiresAt, expiryHours },
  });

  revalidatePath('/candidates');
  return { success: true, rawToken };
}

/**
 * Revokes a candidate's pass link immediately.
 */
export async function revokeCandidatePassTokenAction(
  candidateId: string,
  driveId: string
): Promise<PassManagementResult> {
  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('pass_tokens')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
    })
    .eq('candidate_id', candidateId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent(admin, {
    action: 'PASS_TOKEN_REVOKED',
    driveId,
    targetEntity: 'pass_tokens',
    targetId: candidateId,
    details: { revokedAt: new Date().toISOString() },
  });

  revalidatePath('/candidates');
  return { success: true };
}

/**
 * Batch generates pass tokens for all scheduled candidates in a drive.
 */
export async function batchGeneratePassTokensAction(
  driveId: string,
  expiryHours = 72
): Promise<{ success: boolean; generatedCount: number; error?: string }> {
  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // Fetch candidates who have an assignment but no active token
  const { data: candidates, error: candErr } = await supabase
    .from('candidates')
    .select('id')
    .eq('drive_id', driveId);

  if (candErr || !candidates) {
    return { success: false, generatedCount: 0, error: 'Failed to fetch candidates.' };
  }

  let generatedCount = 0;
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

  for (const c of candidates) {
    const { tokenHash } = generateCandidatePassToken();
    const { error: upsertErr } = await supabase.from('pass_tokens').upsert(
      {
        candidate_id: c.id,
        drive_id: driveId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        revoked: false,
      },
      { onConflict: 'candidate_id' }
    );

    if (!upsertErr) {
      generatedCount++;
    }
  }

  await logAuditEvent(admin, {
    action: 'PASS_TOKEN_GENERATED',
    driveId,
    targetEntity: 'pass_tokens',
    targetId: driveId,
    details: { batchCount: generatedCount },
  });

  revalidatePath('/candidates');
  return { success: true, generatedCount };
}
