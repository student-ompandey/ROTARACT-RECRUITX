import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppShellLayoutWrapper } from '@/components/layout/app-shell-wrapper';
import { getDashboardOverview } from '@/lib/services/dashboard-service';
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowRight,
  Settings,
  HelpCircle,
} from 'lucide-react';

export default async function DashboardPage() {
  const data = await getDashboardOverview();

  return (
    <AppShellLayoutWrapper>
      <div className="space-y-6">
        {/* Drive Header & Mode Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Recruitment Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {data.activeDriveName} · Interview: <span className="text-slate-200 font-medium">{data.interviewDateFormatted}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {data.isDemoMode && (
              <Badge variant="warning" className="text-[10px]">
                Demo Mode (Local Data)
              </Badge>
            )}
            <Link href="/drives">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                Recruitment Setup
              </Button>
            </Link>
          </div>
        </div>

        {/* 5 Real Metrics from actual application data */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="pt-4 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Registered Students</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">{data.totalRegisteredStudents}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="pt-4 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Scheduled Interviews</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{data.scheduledInterviews}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="pt-4 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Completed Evaluations</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{data.completedEvaluations}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="pt-4 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Pending Evaluations</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{data.pendingEvaluations}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800 col-span-2 sm:col-span-1">
            <CardContent className="pt-4 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-emerald-400">Selected Students</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{data.selectedStudents}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Action Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recruitment Workflow Actions</CardTitle>
            <CardDescription className="text-xs">
              Follow these sequential steps to complete student recruitment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/candidates"
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 1</span>
                    <UserPlus className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200">Import Students</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Upload CSV registration list with automatic column mapping and validation.
                  </p>
                </div>
                <span className="text-[11px] text-blue-400 font-medium inline-flex items-center gap-1 mt-3">
                  Open Student Roster <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                href="/schedule"
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 2</span>
                    <CalendarDays className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200">Schedule Interviews</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Generate conflict-free slots and distribute students across interview panels.
                  </p>
                </div>
                <span className="text-[11px] text-blue-400 font-medium inline-flex items-center gap-1 mt-3">
                  Manage Schedule <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                href="/interviewer"
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 3</span>
                    <ClipboardCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200">Review Evaluations</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Conduct interviews using standardized 1–5 rubrics and confidential notes.
                  </p>
                </div>
                <span className="text-[11px] text-blue-400 font-medium inline-flex items-center gap-1 mt-3">
                  Interviewer Workspace <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                href="/shortlisting"
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 4</span>
                    <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200">View Final Results</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Review composite candidate scores, apply selection decisions, and export CSV.
                  </p>
                </div>
                <span className="text-[11px] text-blue-400 font-medium inline-flex items-center gap-1 mt-3">
                  Final Results & Export <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShellLayoutWrapper>
  );
}
