import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Star, CheckCircle, Video, MessageSquare } from 'lucide-react';

export default function InterviewerPage() {
  const criteria = [
    { name: 'Communication & Confidence', weight: '20%' },
    { name: 'Rotaract Spirit & Motivation', weight: '20%' },
    { name: 'Domain / Technical Aptitude', weight: '25%' },
    { name: 'Teamwork & Situational Judgment', weight: '20%' },
    { name: 'Overall Recommendation', weight: '15%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Interviewer Workspace</h2>
          <p className="text-xs text-slate-400 mt-1">
            Standardized evaluation interface for 8 panel evaluators.
          </p>
        </div>
        <Badge variant="purple">Panel 1 (Tech) · Active</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Context Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Current Candidate</span>
              <CardTitle className="text-lg">Aarav Sharma</CardTitle>
              <CardDescription>Enrollment: 24TIT001 · Computer Science</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Slot Time:</span>
                  <span className="font-semibold text-slate-200">10:00 AM – 10:15 AM</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Applied Wing:</span>
                  <span className="font-semibold text-slate-200">Technical / Web Lead</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Video className="w-3.5 h-3.5" />
                Join Panel Meet
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Evaluation Rubric Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Standardized Scorecard Rubric</CardTitle>
              <CardDescription>
                5 evaluation criteria with 1–5 scoring scale and audit logging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y divide-slate-800/80">
                {criteria.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{item.name}</h4>
                      <span className="text-[11px] text-slate-500">Weightage: {item.weight}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          disabled
                          className="w-7 h-7 rounded border border-slate-700 bg-slate-800/60 text-xs font-medium text-slate-300 hover:border-blue-500 transition-colors"
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Interviewer Qualitative Notes
                </label>
                <textarea
                  readOnly
                  placeholder="Record strengths, team compatibility observations, and specific responses..."
                  className="w-full h-20 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder:text-slate-500 resize-none focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" disabled>
                  Save Draft
                </Button>
                <Button variant="primary" size="sm" disabled>
                  Submit Final Scorecard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
