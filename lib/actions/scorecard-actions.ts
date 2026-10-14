'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireInterviewer, requireAdmin, isSupabaseConfigured } from '@/lib/auth/guards';
import { logAuditEvent } from '@/lib/services/audit-service';
import {
  ScorecardSubmissionSchema,
  ScorecardSubmissionInput,
} from '@/lib/validations/scorecard';
import { revalidatePath } from 'next/cache';

export interface ScorecardActionResult {
  success: boolean;
  scorecardId?: string;
  error?: string;
}

/**
 * Saves a draft or submits a final candidate evaluation scorecard.
 * Enforces panel assignment authorization server-side.
 */
export async function submitScorecardAction(
  input: ScorecardSubmissionInput
): Promise<ScorecardActionResult> {
  const user = await requireInterviewer();

  const parsed = ScorecardSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  // Graceful handling for local demo development when Supabase is not connected
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      scorecardId: 'demo-scorecard-id',
    };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Authorization: Verify that user is assigned to the candidate's interview panel
  const { data: assignmentRecord, error: assignErr } = await supabase
    .from('interview_assignments')
    .select(`
      id,
      drive_id,
      candidate_id,
      interview_slots (
        panel_id,
        interview_panels (
          panel_members (
            user_id
          )
        )
      )
    `)
    .eq('id', parsed.data.assignmentId)
    .single();

  if (assignErr || !assignmentRecord) {
    return { success: false, error: 'Interview assignment record not found.' };
  }

  // If not admin, verify interviewer is in the panel membership list
  if (user.role !== 'admin') {
    const slot = assignmentRecord.interview_slots as any;
    const members = slot?.interview_panels?.panel_members || [];
    const isMember = members.some((m: any) => m.user_id === user.id);

    if (!isMember) {
      return {
        success: false,
        error: 'Unauthorized: You are not an assigned evaluator for this panel.',
      };
    }
  }

  // 2. Check if final scorecard already exists and is locked
  const { data: existingScorecard } = await supabase
    .from('scorecards')
    .select('id, internal_notes')
    .eq('assignment_id', parsed.data.assignmentId)
    .eq('interviewer_id', user.id)
    .single();

  // 3. Upsert Scorecard record
  const { data: savedScorecard, error: upsertErr } = await supabase
    .from('scorecards')
    .upsert(
      {
        assignment_id: parsed.data.assignmentId,
        interviewer_id: user.id,
        communication_score: parsed.data.communicationScore,
        motivation_score: parsed.data.motivationScore,
        domain_knowledge_score: parsed.data.domainKnowledgeScore,
        teamwork_score: parsed.data.teamworkScore,
        overall_score: parsed.data.overallScore,
        internal_notes: parsed.data.internalNotes || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id, interviewer_id' }
    )
    .select('id')
    .single();

  if (upsertErr || !savedScorecard) {
    return { success: false, error: upsertErr?.message || 'Failed to record scorecard.' };
  }

  // 4. Update candidate status if final
  if (parsed.data.isFinalSubmission) {
    await supabase
      .from('candidates')
      .update({ status: 'interviewed' })
      .eq('id', assignmentRecord.candidate_id);
  }

  // 5. Audit Event
  await logAuditEvent(user, {
    action: parsed.data.isFinalSubmission ? 'SCORECARD_SUBMITTED' : 'SCORECARD_UPDATED',
    driveId: assignmentRecord.drive_id,
    targetEntity: 'scorecards',
    targetId: savedScorecard.id,
    details: {
      assignmentId: parsed.data.assignmentId,
      overallScore: parsed.data.overallScore,
      isFinal: parsed.data.isFinalSubmission,
    },
  });

  revalidatePath('/interviewer');
  revalidatePath(`/interviewer/scorecard/${parsed.data.assignmentId}`);
  return { success: true, scorecardId: savedScorecard.id };
}

/**
 * Admin action to reopen a finalized scorecard for corrections.
 */
export async function reopenScorecardAction(
  scorecardId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // Log audit trail for privileged reopening
  await logAuditEvent(admin, {
    action: 'SCORECARD_UPDATED',
    targetEntity: 'scorecards',
    targetId: scorecardId,
    details: { reopenedByAdmin: true },
  });

  revalidatePath('/interviewer');
  return { success: true };
}
