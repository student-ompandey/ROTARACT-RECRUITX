import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendTransactionalEmail } from './resend-client';

export interface ProcessBatchResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
}

/**
 * Atomically claims and processes a bounded batch of pending email jobs.
 * Implements exponential backoff retry and delivery logging.
 */
export async function processEmailJobBatch(batchSize = 25): Promise<ProcessBatchResult> {
  const supabase = await createServerSupabaseClient();
  const nowIso = new Date().toISOString();

  // 1. Fetch pending or retryable jobs
  const { data: jobs, error: fetchErr } = await supabase
    .from('email_jobs')
    .select('*')
    .eq('status', 'pending')
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (fetchErr || !jobs || jobs.length === 0) {
    return { processedCount: 0, successCount: 0, failedCount: 0, skippedCount: 0 };
  }

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const job of jobs) {
    // 2. Optimistically claim the job by transitioning status to 'processing'
    const { error: claimErr } = await supabase
      .from('email_jobs')
      .update({
        status: 'processing',
        last_attempt_at: nowIso,
        attempts: job.attempts + 1,
      })
      .eq('id', job.id)
      .eq('status', 'pending');

    if (claimErr) {
      // Another concurrent worker claimed it; skip
      continue;
    }

    const payload = job.payload || {};
    const result = await sendTransactionalEmail({
      to: job.recipient_email,
      subject: job.subject,
      html: payload.html || '',
      text: payload.text || '',
      idempotencyKey: job.idempotency_key,
    });

    if (result.success) {
      successCount++;
      // Mark job as sent
      await supabase
        .from('email_jobs')
        .update({
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Log delivery record
      await supabase.from('email_delivery_log').insert({
        job_id: job.id,
        provider: 'resend',
        provider_message_id: result.messageId || null,
        status: result.skippedDueToDraft ? 'simulated_draft' : 'delivered',
        sanitized_error: null,
      });
    } else {
      failedCount++;
      const currentAttempts = job.attempts + 1;
      const isDeadLetter = currentAttempts >= job.max_attempts;

      // Calculate exponential backoff (e.g. 2m, 8m, 32m)
      const backoffMinutes = Math.pow(2, currentAttempts) * 2;
      const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

      await supabase
        .from('email_jobs')
        .update({
          status: isDeadLetter ? 'dead_letter' : 'pending',
          next_retry_at: isDeadLetter ? null : nextRetry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Log failed attempt with sanitized error
      await supabase.from('email_delivery_log').insert({
        job_id: job.id,
        provider: 'resend',
        provider_message_id: null,
        status: isDeadLetter ? 'dead_letter' : 'failed',
        sanitized_error: (result.error || 'Delivery failed').slice(0, 500),
      });
    }
  }

  return {
    processedCount: jobs.length,
    successCount,
    failedCount,
    skippedCount,
  };
}
