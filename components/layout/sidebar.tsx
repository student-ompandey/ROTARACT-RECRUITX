'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Mail,
  Award,
  Layers,
  CheckSquare,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Recruitment Drives', href: '/drives', icon: Layers },
  { name: 'Candidates', href: '/candidates', icon: Users, badge: '92' },
  { name: 'Interview Schedule', href: '/schedule', icon: CalendarDays },
  { name: 'Email Campaigns', href: '/email-campaigns', icon: Mail },
  { name: 'Interviewer Workspace', href: '/interviewer', icon: Award },
  { name: 'Shortlisting & Results', href: '/shortlisting', icon: CheckSquare },
];

const secondaryNavItems: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0b1329] flex flex-col h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <Logo />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Operations
          </span>
        </div>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700/60">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-3 mb-2">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            System
          </span>
        </div>
        {secondaryNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Club Context Footnote */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-300">Phase 1 Preview</span>
            <span className="text-[10px] text-slate-500">Demo state · No API calls</span>
          </div>
          <HelpCircle className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
