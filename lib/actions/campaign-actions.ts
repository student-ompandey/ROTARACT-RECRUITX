'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { logAuditEvent } from '@/lib/services/audit-service';
import { generateCandidatePassToken, formatToIST } from '@/lib/crypto/tokens';
import {
  renderInterviewPassEmailHtml,
  renderInterviewPassEmailText,
} from '@/lib/email/templates';
import { getEmailMode } from '@/lib/email/resend-client';
import { processEmailJobBatch } from '@/lib/email/queue-processor';
import { revalidatePath } from 'next/cache';

export interface CampaignRecipientPreview {
  candidateId: string;
  fullName: string;
  email: string;
  panelName: string;
  slotFormatted: string;
  passUrlPreview: string;
  isValidEmail: boolean;
}

export interface QueueCampaignPayload {
  driveId: string;
  campaignTitle: string;
  candidateIds: string[];
  confirmedProduction: boolean;
}

/**
 * Previews eligible candidates and rendered passes for a campaign.
 */
export async function previewCampaignRecipientsAction(
  driveId: string
): Promise<{
  success: boolean;
  recipients?: CampaignRecipientPreview[];
  mode?: string;
  error?: string;
}> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const mode = getEmailMode();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Fetch drive details & candidates with assignments
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select(`
      id,
      full_name,
      email,
      interview_assignments (
        interview_slots (
          starts_at,
          interview_panels (
            name,
            meet_link
          )
        )
      )
    `)
    .eq('drive_id', driveId)
    .order('full_name', { ascending: true });

  if (error || !candidates) {
    return { success: false, error: 'Failed to retrieve eligible candidates.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const recipients: CampaignRecipientPreview[] = candidates.map((c: any) => {
    const slot = c.interview_assignments?.[0]?.interview_slots;
    const panelName = slot?.interview_panels?.name || 'Panel 1 — General';
    const slotFormatted = slot?.starts_at ? formatToIST(slot.starts_at) : 'Slot Pending';
    const isValidEmail = emailRegex.test(c.email || '');

    return {
      candidateId: c.id,
      fullName: c.full_name,
      email: c.email,
      panelName,
      slotFormatted,
      passUrlPreview: `${baseUrl}/pass/preview_sample_token`,
      isValidEmail,
    };
  });

  return {
    success: true,
    recipients,
    mode,
  };
}

/**
 * Queues pass distribution campaign into public.email_jobs with idempotency keys.
 */
export async function queuePassCampaignAction(
  payload: QueueCampaignPayload
): Promise<{ success: boolean; queuedCount: number; error?: string }> {
  const admin = await requireAdmin();
  const mode = getEmailMode();

  // Production safety guard: Explicit confirmation required
  if (mode === 'production' && !payload.confirmedProduction) {
    return {
      success: false,
      queuedCount: 0,
      error: 'Production dispatch requires explicit authorized admin confirmation.',
    };
  }

  const supabase = await createServerSupabaseClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 1. Fetch drive info
  const { data: drive } = await supabase
    .from('recruitment_drives')
    .select('name')
    .eq('id', payload.driveId)
    .single();

  const driveName = drive?.name || 'Rotaract Induction Drive 2026-27';

  // 2. Fetch candidate slot assignments
  const { data: candidates } = await supabase
    .from('candidates')
    .select(`
      id,
      full_name,
      email,
      interview_assignments (
        interview_slots (
          starts_at,
          interview_panels (
            name,
            meet_link
          )
        )
      )
    `)
    .eq('drive_id', payload.driveId)
    .in('id', payload.candidateIds);

  if (!candidates || candidates.length === 0) {
    return { success: false, queuedCount: 0, error: 'No candidates matched the selection.' };
  }

  let queuedCount = 0;

  for (const c of candidates as any[]) {
    // Generate fresh cryptographic pass token for candidate
    const { rawToken, tokenHash } = generateCandidatePassToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    await supabase.from('pass_tokens').upsert(
      {
        candidate_id: c.id,
        drive_id: payload.driveId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        revoked: false,
      },
      { onConflict: 'candidate_id' }
    );

    const slot = c.interview_assignments?.[0]?.interview_slots;
    const panelName = slot?.interview_panels?.name || 'Panel Unassigned';
    const slotTimeIST = slot?.starts_at ? formatToIST(slot.starts_at) : 'TBD';
    const passUrl = `${baseUrl}/pass/${rawToken}`;

    const emailParams = {
      candidateName: c.full_name,
      driveName,
      slotTimeIST,
      panelName,
      passUrl,
      meetLink: slot?.interview_panels?.meet_link,
      isTestMode: mode === 'test',
    };

    const html = renderInterviewPassEmailHtml(emailParams);
    const text = renderInterviewPassEmailText(emailParams);
    const idempotencyKey = `pass_${payload.driveId}_${c.id}`;

    // Queue email job
    const { error: queueErr } = await supabase.from('email_jobs').upsert(
      {
        drive_id: payload.driveId,
        candidate_id: c.id,
        campaign_type: 'interview_pass',
        recipient_email: c.email,
        subject: `Your Interview Pass for ${driveName}`,
        payload: { html, text },
        status: 'pending',
        idempotency_key: idempotencyKey,
      },
      { onConflict: 'idempotency_key' }
    );

    if (!queueErr) {
      queuedCount++;
    }
  }

  await logAuditEvent(admin, {
    action: 'EMAIL_CAMPAIGN_DISPATCHED',
    driveId: payload.driveId,
    targetEntity: 'email_jobs',
    targetId: payload.campaignTitle,
    details: {
      queuedCount,
      mode,
      campaignTitle: payload.campaignTitle,
    },
  });

  revalidatePath('/email-campaigns');
  return { success: true, queuedCount };
}

/**
 * Triggers batch processing manually from admin workspace.
 */
export async function triggerManualQueueProcessAction(): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  await requireAdmin();
  try {
    const result = await processEmailJobBatch(25);
    revalidatePath('/email-campaigns');
    return { success: true, result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
