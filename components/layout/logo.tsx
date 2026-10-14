import React from 'react';
import Link from 'next/link';

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-md shadow-blue-900/40 border border-blue-400/20 group-hover:border-blue-400/40 transition-colors">
        <span className="text-white font-bold text-sm tracking-tight">RX</span>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-semibold text-slate-100 tracking-tight text-sm">RecruitX</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/70 border border-blue-800/50 px-1.5 py-0.5 rounded">TIT&S</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Rotaract Platform</span>
        </div>
      )}
    </Link>
  );
}
