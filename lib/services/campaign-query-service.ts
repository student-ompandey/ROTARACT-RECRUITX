import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { getEmailMode } from '@/lib/email/resend-client';
import { formatToIST } from '@/lib/crypto/tokens';

export interface EmailJobItem {
  id: string;
  recipientEmail: string;
  subject: string;
  status: string;
  campaignType: string;
  attempts: number;
  lastAttemptAt: string | null;
  createdAtFormatted: string;
}

export interface CampaignsOverviewData {
  emailMode: string;
  stats: {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    deadLetter: number;
  };
  recentJobs: EmailJobItem[];
}

export async function getCampaignsOverview(): Promise<CampaignsOverviewData> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const emailMode = getEmailMode();

  // Aggregate job counts by status
  const { data: jobs } = await supabase
    .from('email_jobs')
    .select('id, recipient_email, subject, status, campaign_type, attempts, last_attempt_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const stats = {
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    deadLetter: 0,
  };

  const recentJobs: EmailJobItem[] = (jobs || []).map((j: any) => {
    if (j.status === 'pending') stats.pending++;
    else if (j.status === 'processing') stats.processing++;
    else if (j.status === 'sent') stats.sent++;
    else if (j.status === 'failed') stats.failed++;
    else if (j.status === 'dead_letter') stats.deadLetter++;

    return {
      id: j.id,
      recipientEmail: j.recipient_email,
      subject: j.subject,
      status: j.status,
      campaignType: j.campaign_type,
      attempts: j.attempts,
      lastAttemptAt: j.last_attempt_at ? formatToIST(j.last_attempt_at) : null,
      createdAtFormatted: formatToIST(j.created_at),
    };
  });

  return {
    emailMode,
    stats,
    recentJobs,
  };
}
