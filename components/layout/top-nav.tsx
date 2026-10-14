'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, ShieldCheck, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { signOutAction } from '@/lib/auth/actions';

const routeTitleMap: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of candidate recruitment drives and schedules' },
  '/drives': { title: 'Recruitment Drives', subtitle: 'Manage recruitment cycles and batches' },
  '/candidates': { title: 'Candidates', subtitle: '92 registered candidates across 4 branches' },
  '/schedule': { title: 'Interview Schedule', subtitle: 'Panels, slots and interview allocations' },
  '/email-campaigns': { title: 'Email Campaigns', subtitle: 'Pass links, invites, and delivery monitoring' },
  '/interviewer': { title: 'Interviewer Workspace', subtitle: 'Active scorecard and candidate evaluation workspace' },
  '/shortlisting': { title: 'Shortlisting & Results', subtitle: 'Evaluation aggregates and selection records' },
  '/settings': { title: 'System Settings', subtitle: 'Platform configurations, templates, and integration options' },
};

export function TopNav() {
  const pathname = usePathname();
  const current = routeTitleMap[pathname] || {
    title: 'RecruitX Operations',
    subtitle: 'Rotaract Club of TIT & S',
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0b1329]/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-100 tracking-tight">{current.title}</h1>
          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-slate-400">
            Drive 2026-27
          </Badge>
        </div>
        <p className="text-xs text-slate-400 hidden md:block">{current.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search quick button */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            readOnly
            placeholder="Search enrollment, candidate... (Ctrl+K)"
            className="w-64 h-8 pl-8 pr-3 text-xs bg-slate-900/80 border border-slate-800 rounded-lg text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-slate-700 cursor-pointer"
          />
        </div>

        {/* System Mode Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-300">Auth & RLS Active</span>
        </div>

        {/* Notifications Placeholder */}
        <button
          aria-label="Notifications"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Identity Preview & Sign Out */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-blue-400">
            AD
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium text-slate-200">Admin User</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" /> Lead Panel
            </span>
          </div>

          <form action={signOutAction} className="ml-1">
            <button
              type="submit"
              title="Sign Out"
              aria-label="Sign Out"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
