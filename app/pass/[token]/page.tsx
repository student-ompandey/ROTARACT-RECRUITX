import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVerifiedPass } from '@/lib/services/pass-service';
import { Calendar, Video, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export default async function CandidatePassPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const pass = await getVerifiedPass(token);

  if (!pass || !pass.isValid) {
    return (
      <div className="min-h-screen bg-[#070d19] flex items-center justify-center p-6 text-slate-100">
        <Card className="max-w-md w-full border-red-900/50 bg-[#0f172a] text-center shadow-2xl shadow-red-950/20">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center mx-auto text-red-400 mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-base text-slate-100">Invalid or Expired Pass</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              This interview pass link could not be verified, has expired, or was revoked by the administration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">
              If you believe this is an error, please reach out to the Rotaract Club of TIT & S recruitment coordinators.
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
              <span className="text-[10px] uppercase tracking-widest font-bold text-blue-200">
                Rotaract Club of TIT & S
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {pass.driveName}
              </h2>
            </div>
            <Badge variant="purple" className="bg-white/10 text-white border-white/20">
              Verified Pass
            </Badge>
          </div>

          <div className="p-6 space-y-6">
            {/* Candidate Identity */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">Candidate Name</span>
                <h3 className="text-lg font-bold text-white">{pass.candidateName}</h3>
                <span className="text-xs text-blue-400 font-medium">
                  {pass.branch} · {pass.yearOfStudy}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Enrollment No.</span>
                <span className="font-mono text-sm font-semibold text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  {pass.enrollmentNo}
                </span>
              </div>
            </div>

            {/* Schedule Details (Formatted in Asia/Kolkata IST) */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Start Time (IST)
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
                <Badge variant="info">Scheduled</Badge>
              </div>

              {pass.meetLink ? (
                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Google Meet Room</span>
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
                  Meeting link will activate prior to your slot.
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Verified via SHA-256 token hash validation. Times are displayed in Indian Standard Time (IST). Please join 5 minutes early with your student ID card ready.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
