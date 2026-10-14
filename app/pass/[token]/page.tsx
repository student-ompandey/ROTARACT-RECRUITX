import React from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVerifiedPass } from '@/lib/services/pass-service';
import {
  Calendar,
  Video,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interview Pass | Rotaract RecruitX',
  description: 'Confidential recruitment interview pass for Rotaract Club of TIT & S',
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 0; // Disable public edge caching for personalized token passes

export default async function CandidatePassPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for') || '127.0.0.1';
  const clientIp = forwardedFor.split(',')[0].trim();

  const pass = await getVerifiedPass(token, clientIp);

  // Rate-limited response
  if (pass?.rateLimited) {
    return (
      <div className="min-h-screen bg-[#070d19] flex items-center justify-center p-6 text-slate-100">
        <Card className="max-w-md w-full border-amber-900/50 bg-[#0f172a] text-center shadow-2xl shadow-amber-950/20">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center mx-auto text-amber-400 mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-base text-slate-100">Too Many Verification Attempts</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Rate limit exceeded. Please wait a minute before re-opening your interview pass link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Invalid, expired, revoked, or tampered token
  if (!pass || !pass.isValid) {
    return (
      <div className="min-h-screen bg-[#070d19] flex items-center justify-center p-6 text-slate-100">
        <Card className="max-w-md w-full border-red-900/50 bg-[#0f172a] text-center shadow-2xl shadow-red-950/20">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center mx-auto text-red-400 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <CardTitle className="text-base text-slate-100">Invalid or Expired Pass</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              This interview link is invalid, has expired, or was revoked by the recruitment committee.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-[11px] text-slate-400">
              For assistance, contact the Rotaract Club of TIT & S Recruitment Desk at{' '}
              <span className="font-mono text-slate-300">recruitment@rotaract-tits.org</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative">
      <div className="w-full max-w-lg space-y-4">
        {/* Pass Card Container */}
        <div className="rounded-2xl border border-blue-500/30 bg-[#0f172a] shadow-2xl shadow-blue-950/40 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-blue-200 block">
                Rotaract Club of TIT & S
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {pass.driveName}
              </h2>
            </div>
            <Badge variant="purple" className="bg-white/10 text-white border-white/20">
              Verified
            </Badge>
          </div>

          <div className="p-6 space-y-6">
            {/* Candidate Identity (Minimal & Privacy-Conscious) */}
            <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Candidate</span>
                <h3 className="text-lg font-bold text-white">{pass.candidateName}</h3>
              </div>
              <Badge variant="info">Applicant</Badge>
            </div>

            {/* Schedule Details (Formatted in Asia/Kolkata IST) */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Start Time (IST)
                </span>
                <span className="font-semibold text-slate-200 block">{pass.startsAtFormatted}</span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> End Time (IST)
                </span>
                <span className="font-semibold text-slate-200 block">{pass.endsAtFormatted}</span>
              </div>
            </div>

            {/* Panel & Meet Link */}
            <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">
                    Interview Allocation
                  </span>
                  <h4 className="text-sm font-semibold text-white">{pass.panelName}</h4>
                </div>
                <Badge variant="info">Room Link</Badge>
              </div>

              {pass.meetLink ? (
                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Google Meet Link</span>
                  <a
                    href={pass.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                  >
                    <Video className="w-3.5 h-3.5" /> Join Interview Room
                  </a>
                </div>
              ) : (
                <div className="pt-2 border-t border-blue-900/30 text-xs text-slate-500">
                  Meeting room link will activate prior to your slot.
                </div>
              )}
            </div>

            {/* Candidate Instructions */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">
                Interview Guidelines:
              </span>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li>• Please join 5 minutes before your scheduled slot.</li>
                <li>• Ensure a stable internet connection and functioning webcam/microphone.</li>
                <li>• Keep your student ID card ready for identity verification.</li>
                <li>• Do not share this private pass link with anyone else.</li>
              </ul>
            </div>

            {/* Security Notice & Support */}
            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cryptographically verified pass</span>
              </div>
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span>support@rotaract-tits.org</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
