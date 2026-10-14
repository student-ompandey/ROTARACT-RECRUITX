'use client';

import React, { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/layout/logo';
import { Lock, Mail, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const reason = searchParams.get('reason');

  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <div className="min-h-screen bg-[#070d19] flex flex-col justify-center items-center p-6 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo />
          <h1 className="text-xl font-bold tracking-tight text-slate-100 pt-2">
            Rotaract RecruitX Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            Restricted access for authorized Administrators and Interview Panelists.
          </p>
        </div>

        {/* Reason banner if redirected */}
        {reason === 'session_expired' && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Your session has expired. Please sign in again to continue.</span>
          </div>
        )}

        {/* Login Card */}
        <Card className="border-slate-800 bg-[#0f172a]/90 backdrop-blur-md shadow-xl shadow-black/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign In to Workspace</CardTitle>
            <CardDescription>
              Enter your credentials provisioned by the Recruitment Lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />

              {state?.error && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@rotaract-tits.org"
                  className="w-full h-9 px-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Password
                  </label>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full h-9 px-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                disabled={isPending}
              >
                {isPending ? 'Verifying Credentials...' : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center space-y-2">
              <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300">
                <span className="font-semibold block text-slate-200 mb-0.5">🚀 Demo Quick Access</span>
                Any email/password or click below to directly enter the portal:
                <div className="mt-2 flex gap-2 justify-center">
                  <a
                    href="/"
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition-colors"
                  >
                    Enter Admin Dashboard →
                  </a>
                  <a
                    href="/interviewer"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 transition-colors"
                  >
                    Interviewer Portal →
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Self-registration is disabled for security compliance.
              </p>
              <p className="text-[10px] text-slate-600">
                Candidates do not need an account. Candidates access their personalized passes directly via private links sent via email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
