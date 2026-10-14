import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const params = await searchParams;
  const requiredRole = params.required || 'admin';

  return (
    <div className="min-h-screen bg-[#070d19] flex flex-col justify-center items-center p-6 relative">
      <div className="w-full max-w-md relative z-10">
        <Card className="border-red-900/40 bg-[#0f172a]/95 text-center shadow-2xl shadow-red-950/20">
          <CardHeader className="pb-3">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center mx-auto text-red-400 mb-3">
              <ShieldX className="w-7 h-7" />
            </div>
            <CardTitle className="text-lg text-slate-100">Access Restricted</CardTitle>
            <CardDescription className="text-slate-400">
              Your account lacks the required privileges to view this section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500 block text-[11px] mb-0.5">Required Permission Level</span>
              <span className="font-mono font-semibold uppercase text-red-300 tracking-wider">
                {requiredRole} Role Required
              </span>
            </div>

            <p className="text-xs text-slate-400 text-center">
              If you are an interview panelist trying to access administrative settings or candidate import records, contact the Drive Lead.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Link href="/">
                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Safety
                </Button>
              </Link>
              <form action={signOutAction} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" type="submit" className="w-full sm:w-auto text-red-400 hover:text-red-300">
                  <LogOut className="w-3.5 h-3.5 mr-1" /> Switch Account
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
