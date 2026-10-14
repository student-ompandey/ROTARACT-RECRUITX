'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Award,
  CheckSquare,
  Settings,
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

// Clean 6-item primary navigation strictly following specification
const primaryNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/candidates', icon: Users },
  { name: 'Interview Schedule', href: '/schedule', icon: CalendarDays },
  { name: 'Evaluations', href: '/interviewer', icon: Award },
  { name: 'Results', href: '/shortlisting', icon: CheckSquare },
  { name: 'Settings', href: '/drives', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-slate-800/80 bg-[#0b1329] flex flex-col h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <Logo />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Recruitment
          </span>
        </div>
        {primaryNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/candidates' && pathname.startsWith('/candidates')) ||
            (item.href === '/drives' && pathname.startsWith('/drives')) ||
            (item.href === '/interviewer' && pathname.startsWith('/interviewer'));
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

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-200 block">Rotaract TIT&S</span>
          <span className="text-[10px] text-slate-500">RecruitX Portal · Asia/Kolkata</span>
        </div>
      </div>
    </aside>
  );
}
