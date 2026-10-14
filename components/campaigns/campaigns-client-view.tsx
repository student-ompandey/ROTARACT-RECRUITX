'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CampaignsOverviewData } from '@/lib/services/campaign-query-service';
import { ComposeCampaignModal } from '@/components/campaigns/compose-campaign-modal';
import { triggerManualQueueProcessAction } from '@/lib/actions/campaign-actions';
import {
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Play,
  ShieldCheck,
} from 'lucide-react';

interface CampaignsClientViewProps {
  overview: CampaignsOverviewData;
  drives: Array<{ id: string; name: string }>;
}

export function CampaignsClientView({ overview, drives }: CampaignsClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);

  async function handleTriggerQueue() {
    setIsProcessing(true);
    setProcessStatus(null);

    const res = await triggerManualQueueProcessAction();
    setIsProcessing(false);

    if (!res.success) {
      setProcessStatus(`Queue processing error: ${res.error}`);
    } else {
      setProcessStatus(
        `Batch processed: ${res.result?.successCount || 0} sent, ${
          res.result?.failedCount || 0
        } failed.`
      );
    }
  }

  return (
    <div className="space-y-6">
      <ComposeCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        drives={drives}
        emailMode={overview.emailMode}
      />

      {/* Safety Guard Mode Notice */}
      <div
        className={`rounded-xl border p-4 flex items-center justify-between ${
          overview.emailMode === 'production'
            ? 'border-blue-900/60 bg-blue-950/20'
            : overview.emailMode === 'test'
            ? 'border-purple-900/60 bg-purple-950/20'
            : 'border-amber-900/60 bg-amber-950/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle
            className={`w-5 h-5 shrink-0 ${
              overview.emailMode === 'production'
                ? 'text-blue-400'
                : overview.emailMode === 'test'
                ? 'text-purple-400'
                : 'text-amber-400'
            }`}
          />
          <div>
            <h3 className="text-xs font-semibold text-slate-100">
              EMAIL_MODE Guard: {overview.emailMode.toUpperCase()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {overview.emailMode === 'production'
                ? 'Production mode is active. Real candidate emails will be dispatched via Resend upon queue execution.'
                : overview.emailMode === 'test'
                ? 'Test mode is active. All outbound emails are safely redirected to your configured administrator test address.'
                : 'Draft mode is active. No external network requests are sent to Resend. All deliveries are simulated safely.'}
            </p>
          </div>
        </div>
        <Badge
          variant={
            overview.emailMode === 'production'
              ? 'info'
              : overview.emailMode === 'test'
              ? 'purple'
              : 'warning'
          }
        >
          {overview.emailMode.toUpperCase()}
        </Badge>
      </div>

      {processStatus && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{processStatus}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Email Campaigns & Queue Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch personalized candidate passes with cryptographic tokens via resilient background queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTriggerQueue}
            disabled={isProcessing}
          >
            <Play className="w-3.5 h-3.5" />
            {isProcessing ? 'Processing Queue...' : 'Trigger Queue Worker'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Mail className="w-3.5 h-3.5" />
            Compose Campaign
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800">
          <span className="text-slate-500 block text-[11px]">Pending in Queue</span>
          <span className="font-semibold text-slate-100 text-lg">
            {overview.stats.pending}
          </span>
        </div>
        <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800">
          <span className="text-slate-500 block text-[11px]">Currently Processing</span>
          <span className="font-semibold text-blue-400 text-lg">
            {overview.stats.processing}
          </span>
        </div>
        <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800">
          <span className="text-slate-500 block text-[11px]">Successfully Sent</span>
          <span className="font-semibold text-emerald-400 text-lg">
            {overview.stats.sent}
          </span>
        </div>
        <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800">
          <span className="text-slate-500 block text-[11px]">Retrying Failures</span>
          <span className="font-semibold text-amber-400 text-lg">
            {overview.stats.failed}
          </span>
        </div>
        <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800">
          <span className="text-slate-500 block text-[11px]">Dead-Letter</span>
          <span className="font-semibold text-red-400 text-lg">
            {overview.stats.deadLetter}
          </span>
        </div>
      </div>

      {/* Delivery Queue Table */}
      <Card className="overflow-hidden p-0 border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <CardTitle className="text-sm">Recent Queue Activity & Delivery Logs</CardTitle>
          <span className="text-xs text-slate-500">Last 50 recorded jobs</span>
        </div>

        {overview.recentJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No queued email jobs recorded yet. Click "Compose Campaign" to create a distribution batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Campaign Type</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Delivery Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {overview.recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-slate-200">
                      {job.recipientEmail}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">{job.subject}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">
                      {job.campaignType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{job.attempts} / 3</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          job.status === 'sent'
                            ? 'success'
                            : job.status === 'pending'
                            ? 'warning'
                            : job.status === 'processing'
                            ? 'info'
                            : 'destructive'
                        }
                      >
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {job.createdAtFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
