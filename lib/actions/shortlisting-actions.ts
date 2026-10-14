'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin, isSupabaseConfigured } from '@/lib/auth/guards';
import { logAuditEvent } from '@/lib/services/audit-service';
import { revalidatePath } from 'next/cache';

export async function updateCandidateDecisionAction(
  candidateId: string,
  newStatus: 'selected' | 'waitlisted' | 'rejected' | 'interviewed'
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('candidates')
    .update({ status: newStatus })
    .eq('id', candidateId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent(admin, {
    action: 'CANDIDATE_STATUS_CHANGED',
    targetEntity: 'candidates',
    targetId: candidateId,
    details: { newStatus },
  });

  revalidatePath('/shortlisting');
  return { success: true };
}

export async function bulkUpdateDecisionsAction(
  candidateIds: string[],
  newStatus: 'selected' | 'waitlisted' | 'rejected'
): Promise<{ success: boolean; count: number; error?: string }> {
  const admin = await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { success: true, count: candidateIds.length };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('candidates')
    .update({ status: newStatus })
    .in('id', candidateIds);

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  await logAuditEvent(admin, {
    action: 'CANDIDATE_STATUS_CHANGED',
    targetEntity: 'candidates',
    targetId: candidateIds[0] || 'bulk',
    details: { bulkCount: candidateIds.length, newStatus },
  });

  revalidatePath('/shortlisting');
  return { success: true, count: candidateIds.length };
}
