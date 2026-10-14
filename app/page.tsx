import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/dashboard/metric-card';
import { AppShellLayoutWrapper } from '@/components/layout/app-shell-wrapper';
import {
  Users,
  Layers,
  Calendar,
  ClipboardList,
  UserPlus,
  PlusCircle,
  Eye,
  Clock,
  ArrowRight,
  Video,
  Info,
} from 'lucide-react';

export default function DashboardPage() {
  // Demo dataset clearly identified
  const recentActivities = [
    {
      id: '1',
      title: 'Import batch validated: 92 candidates',
      time: '12 mins ago',
      type: 'import',
      badge: 'CSV',
    },
    {
      id: '2',
      title: 'Panel 3 assigned 23 candidates (Room B)',
      time: '35 mins ago',
      type: 'schedule',
      badge: 'Panel 3',
    },
    {
      id: '3',
      title: 'Personalized pass tokens drafted for preview',
      time: '1 hour ago',
      type: 'email',
      badge: 'Draft Mode',
    },
    {
      id: '4',
      title: 'Interviewer rubric finalized (5 metrics)',
      time: '2 hours ago',
      type: 'system',
      badge: 'Scorecard',
    },
  ];

  const upcomingSlots = [
    {
      time: '10:00 AM – 10:15 AM',
      candidate: 'Aarav Sharma',
      enrollment: '24TIT014',
      panel: 'Panel 1 (Tech)',
      room: 'Meet Link Configured',
      status: 'Ready',
    },
    {
      time: '10:15 AM – 10:30 AM',
      candidate: 'Priya Verma',
      enrollment: '24TIT052',
      panel: 'Panel 2 (Editorial)',
      room: 'Meet Link Configured',
      status: 'Ready',
    },
    {
      time: '10:30 AM – 10:45 AM',
      candidate: 'Rohan Gupta',
      enrollment: '24TIT088',
      panel: 'Panel 3 (Creative)',
      room: 'Meet Link Configured',
      status: 'Pending',
    },
  ];

  return (
    <AppShellLayoutWrapper>
      <div className="space-y-8">
        {/* Notice Banner */}
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-200">
              <strong className="text-white">Foundation Mode (Phase 1 & 2):</strong> Metrics and schedules shown below reflect targeted recruitment drive projections for Rotaract Club of TIT & S (92 Candidates · 8 Interviewers · 4 Panels).
            </p>
          </div>
          <Badge variant="info">Demo Data</Badge>
        </div>

        {/* Primary KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Candidates"
            value="92"
            description="Registered for Drive 2026-27"
            change="+100% target"
            isPositive={true}
            icon={Users}
          />
          <MetricCard
            title="Active Drives"
            value="1"
            description="Annual Core Team Induction"
            change="In planning"
            isPositive={true}
            icon={Layers}
          />
          <MetricCard
            title="Scheduled Interviews"
            value="48"
            description="Assigned across 4 panels"
            change="52% capacity"
            isPositive={true}
            icon={Calendar}
          />
          <MetricCard
            title="Pending Evaluations"
            value="92"
            description="Scorecards awaiting submission"
            change="Round 1"
            isPositive={false}
            icon={ClipboardList}
          />
        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-[#0f172a]/40">
          <div className="flex flex-col">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Quick Actions</h2>
            <span className="text-xs text-slate-400">Common administrative workflows</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/drives">
              <Button variant="secondary" size="sm">
                <PlusCircle className="w-3.5 h-3.5" />
                New Recruitment Drive
              </Button>
            </Link>
            <Link href="/candidates">
              <Button variant="secondary" size="sm">
                <UserPlus className="w-3.5 h-3.5" />
                Import Candidates (CSV)
              </Button>
            </Link>
            <Link href="/schedule">
              <Button variant="primary" size="sm">
                <Eye className="w-3.5 h-3.5" />
                View Schedule
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upcoming Interview Schedule */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Upcoming Interview Slots</CardTitle>
                  <CardDescription>Scheduled slots across 4 active interview panels</CardDescription>
                </div>
                <Link href="/schedule">
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                    Full Schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-800/80">
                  {upcomingSlots.map((slot, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/60 flex flex-col items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-slate-100">{slot.candidate}</h4>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/40">
                              {slot.enrollment}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-400">{slot.time}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[11px] text-blue-400 font-medium">{slot.panel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                          <Video className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px]">Meet</span>
                        </div>
                        <Badge variant={slot.status === 'Ready' ? 'success' : 'warning'}>
                          {slot.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Recent Activity Feed */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>System events and recruitment updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-200 leading-snug">{act.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">{act.time}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-[10px] text-slate-400 font-mono">{act.badge}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Drive Snapshot Box */}
            <Card className="border-blue-900/30 bg-gradient-to-b from-blue-950/20 to-transparent">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Drive Configuration</span>
                  <Badge variant="purple">Active Setup</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Rotaract Club of TIT & S Induction Drive 2026-27 is configured for 4 parallel panels, 8 evaluators, and automated pass distribution.
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Panels configured</span>
                  <span className="font-semibold text-slate-200">4 / 4</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShellLayoutWrapper>
  );
}
