import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { getCurrentUserRole } from '@/lib/auth/guards';

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserRole();

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 antialiased flex">
      {/* Persistent Shell Sidebar */}
      <Sidebar />

      {/* Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
