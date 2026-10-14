'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  previewCampaignRecipientsAction,
  queuePassCampaignAction,
  CampaignRecipientPreview,
} from '@/lib/actions/campaign-actions';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  Eye,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ComposeCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  drives: Array<{ id: string; name: string }>;
  emailMode: string;
}

export function ComposeCampaignModal({
  isOpen,
  onClose,
  drives,
  emailMode,
}: ComposeCampaignModalProps) {
  const [selectedDriveId, setSelectedDriveId] = useState(drives[0]?.id || '');
  const [campaignTitle, setCampaignTitle] = useState('Induction Interview Pass Distribution');
  const [recipients, setRecipients] = useState<CampaignRecipientPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [confirmedProduction, setConfirmedProduction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  if (!isOpen) return null;

  async function handleLoadRecipients() {
    setIsLoading(true);
    setStatusMessage(null);

    const res = await previewCampaignRecipientsAction(selectedDriveId);
    setIsLoading(false);

    if (!res.success || !res.recipients) {
      setStatusMessage({ text: res.error || 'Failed to preview recipients.', type: 'error' });
    } else {
      setRecipients(res.recipients);
    }
  }

  async function handleQueueCampaign() {
    setIsQueueing(true);
    setStatusMessage(null);

    const validCandidateIds = recipients.filter((r) => r.isValidEmail).map((r) => r.candidateId);

    const res = await queuePassCampaignAction({
      driveId: selectedDriveId,
      campaignTitle,
      candidateIds: validCandidateIds,
      confirmedProduction,
    });

    setIsQueueing(false);
    if (!res.success) {
      setStatusMessage({ text: res.error || 'Failed to queue campaign.', type: 'error' });
    } else {
      setStatusMessage({
        text: `Successfully queued ${res.queuedCount} email messages in [${emailMode.toUpperCase()}] mode.`,
        type: 'success',
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col border-slate-700 bg-[#0f172a] shadow-2xl shadow-black relative overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Compose Email Campaign</h3>
              <p className="text-[11px] text-slate-400">
                Deploy personalized candidate passes via background queue
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-red-950/40 border-red-800/60 text-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Mode Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              emailMode === 'production'
                ? 'bg-blue-950/40 border-blue-800 text-blue-200'
                : emailMode === 'test'
                ? 'bg-purple-950/40 border-purple-800 text-purple-200'
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}
          >
            <div>
              <span className="font-semibold block uppercase">
                Active Mode: {emailMode}
              </span>
              <span className="text-[11px] opacity-80">
                {emailMode === 'production'
                  ? 'Messages will be dispatched to real candidate addresses.'
                  : emailMode === 'test'
                  ? 'All messages will be redirected to the configured admin test address.'
                  : 'Provider dispatch disabled. Messages will be simulated safely in database.'}
              </span>
            </div>
            <Badge variant={emailMode === 'production' ? 'info' : 'warning'}>
              {emailMode.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Campaign Title
              </label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Target Recruitment Drive
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  className="flex-1 h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleLoadRecipients}
                  disabled={isLoading}
                  className="h-8 text-xs shrink-0"
                >
                  {isLoading ? 'Loading...' : 'Preview Recipients'}
                </Button>
              </div>
            </div>
          </div>

          {/* Recipients Preview */}
          {recipients.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Eligible Recipients ({recipients.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  {recipients.filter((r) => r.isValidEmail).length} Valid Addresses
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Candidate</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Slot</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {recipients.map((r) => (
                      <tr key={r.candidateId} className="hover:bg-slate-800/20">
                        <td className="p-2 font-medium text-slate-200">{r.fullName}</td>
                        <td className="p-2 font-mono text-slate-400">{r.email}</td>
                        <td className="p-2 text-slate-400 text-[11px]">{r.slotFormatted}</td>
                        <td className="p-2">
                          <Badge variant={r.isValidEmail ? 'success' : 'destructive'}>
                            {r.isValidEmail ? 'Valid' : 'Invalid Email'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Production Confirmation Checkbox */}
              {emailMode === 'production' && (
                <div className="p-3 bg-red-950/20 border border-red-800/50 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="confirm-prod"
                      checked={confirmedProduction}
                      onChange={(e) => setConfirmedProduction(e.target.checked)}
                      className="mt-0.5 rounded border-red-700 bg-slate-900"
                    />
                    <label htmlFor="confirm-prod" className="text-xs text-red-200 cursor-pointer">
                      I understand that <strong>PRODUCTION MODE</strong> will dispatch real emails to{' '}
                      <strong>{recipients.length} candidates</strong>.
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isQueueing}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleQueueCampaign}
            disabled={
              isQueueing ||
              recipients.length === 0 ||
              (emailMode === 'production' && !confirmedProduction)
            }
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            {isQueueing ? 'Queueing Messages...' : `Queue Campaign (${recipients.length})`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
