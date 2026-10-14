import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Mail, Database, Check } from 'lucide-react';

export default function SettingsPage() {
  const configs = [
    {
      title: 'Supabase PostgreSQL Connection',
      desc: 'Database and Row-Level Security provider.',
      status: 'Ready for Phase 2 Configuration',
      badge: 'Pending Setup',
      icon: Database,
    },
    {
      title: 'Resend Transactional Email Engine',
      desc: 'Email delivery provider configured for safe draft & rate-limited dispatches.',
      status: 'Draft Mode Active',
      badge: 'Protected',
      icon: Mail,
    },
    {
      title: 'Authentication & Access Controls',
      desc: 'Least-privilege role guards (Admin, Panel Evaluator).',
      status: 'Role Guards Initialized',
      badge: 'Strict Server-Side',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">System & Security Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Review integrations, external services, and platform policies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {configs.map((cfg, idx) => {
          const Icon = cfg.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{cfg.title}</CardTitle>
                    <CardDescription>{cfg.desc}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{cfg.badge}</Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80">
                  <span>Current State: <strong className="text-slate-200">{cfg.status}</strong></span>
                  <span className="text-[11px] text-slate-500">Zero secrets exposed</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
