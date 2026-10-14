'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Video,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { InterviewerDashboardData } from '@/lib/services/interviewer-query-service';

export function InterviewerClientView({ data }: { data: InterviewerDashboardData }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssignments = data.assignments.filter((item) => {
    const matchesFilter =
      filter === 'all' ? true : item.scorecardStatus === filter;
    const matchesSearch =
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.branch.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Evaluator Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Interviewer Workspace
            </h2>
            <Badge variant="info" className="text-[10px]">
              Evaluator Access
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-slate-200 font-medium">{data.interviewerName}</span> ({data.interviewerEmail})
          </p>
        </div>

        {/* Assigned Panels Quick Links */}
        <div className="flex flex-wrap items-center gap-2">
          {data.assignedPanels.map((panel) => (
            <div
              key={panel.id}
              className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-slate-200">{panel.name}</span>
              {panel.meetLink ? (
                <a
                  href={panel.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium ml-1 transition-colors"
                >
                  <Video className="w-3 h-3" />
                  Join Room
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-[10px] text-slate-500 italic">No Meet link</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/80">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Assigned Candidates</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{data.stats.totalAssigned}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Completed Evaluations</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{data.stats.completedScorecards}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending Scorecards</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{data.stats.pendingScorecards}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roster & Evaluation Queue */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Evaluation Roster</CardTitle>
              <CardDescription className="text-xs">
                Candidates scheduled for your assigned interview panels. Independent scoring is enforced.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate, enrollment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-60"
                />
              </div>

              <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filter === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({data.assignments.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filter === 'pending' ? 'bg-slate-800 text-amber-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pending ({data.stats.pendingScorecards})
                </button>
                <button
                  onClick={() => setFilter('submitted')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filter === 'submitted' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Submitted ({data.stats.completedScorecards})
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">No candidate interviews match your filter.</p>
              <p className="text-xs text-slate-500 mt-1">Check back when the recruitment drive is scheduled or assignments are published.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="pb-2.5 pl-2">Candidate Details</th>
                    <th className="pb-2.5">Branch / Year</th>
                    <th className="pb-2.5">Panel</th>
                    <th className="pb-2.5">Interview Slot (IST)</th>
                    <th className="pb-2.5">Evaluation Status</th>
                    <th className="pb-2.5 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAssignments.map((item) => (
                    <tr key={item.assignmentId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pl-2">
                        <div className="font-semibold text-slate-200">{item.candidateName}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.enrollmentNo}</div>
                      </td>
                      <td className="py-3 text-slate-300">
                        <div>{item.branch}</div>
                        <div className="text-[11px] text-slate-500">{item.yearOfStudy}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-300">{item.panelName}</div>
                        {item.meetLink && (
                          <a
                            href={item.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors mt-0.5"
                          >
                            <Video className="w-2.5 h-2.5" />
                            Google Meet
                          </a>
                        )}
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{item.slotFormatted}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {item.scorecardStatus === 'submitted' ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="success" className="text-[10px]">
                              Submitted
                            </Badge>
                            {item.overallScore && (
                              <span className="text-[11px] font-mono font-semibold text-slate-300">
                                {item.overallScore}/5
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">
                            Pending Scorecard
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <Link href={`/interviewer/scorecard/${item.assignmentId}`}>
                          <Button
                            variant={item.scorecardStatus === 'submitted' ? 'outline' : 'primary'}
                            size="sm"
                            className="h-7 text-xs gap-1"
                          >
                            {item.scorecardStatus === 'submitted' ? 'Review Scorecard' : 'Evaluate'}
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security and Integrity notice */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex items-start gap-3">
        <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">Evaluator Confidentiality & Integrity</p>
          <p>
            Scorecards are blind to other panel evaluators. All submitted scores are cryptographically tracked in the audit trail. Once submitted, scorecards can only be reopened by a designated Drive Admin.
          </p>
        </div>
      </div>
    </div>
  );
}
