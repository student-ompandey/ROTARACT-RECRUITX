import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function EmailCampaignsPage() {
  const campaigns = [
    {
      id: 'cmp-01',
      title: 'Interview Pass & Meet Link Distribution',
      target: '92 Candidates',
      mode: 'Draft Mode (Safe)',
      status: 'Ready to preview',
      sent: 0,
      total: 92,
    },
    {
      id: 'cmp-02',
      title: 'Drive Reminder & Preparation Guidelines',
      target: '48 Candidates (Day 1)',
      mode: 'Draft Mode (Safe)',
      status: 'Queued',
      sent: 0,
      total: 48,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Safe Mode Banner */}
      <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h3 className="text-xs font-semibold text-amber-300">Email Safety Guard Active (Draft Mode)</h3>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              Production email dispatch is disabled in Phase 1. No outbound emails will be sent without explicit authorization.
            </p>
          </div>
        </div>
        <Badge variant="warning">Draft Mode</Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Email Campaigns & Delivery</h2>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch personalized interview passes with unguessable tokens and Google Meet access.
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Mail className="w-3.5 h-3.5" />
          Compose Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription className="mt-0.5">Target: {c.target}</CardDescription>
              </div>
              <Badge variant="outline">{c.mode}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-slate-400 p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span>Delivery Queue Status: <strong className="text-slate-200">{c.status}</strong></span>
                <span className="font-mono text-slate-300">{c.sent} / {c.total} sent</span>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm">
                  Preview Template
                </Button>
                <Button variant="secondary" size="sm">
                  Send Test to Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
