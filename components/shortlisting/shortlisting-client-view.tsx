'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Award,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ShortlistingDashboardData, ShortlistedCandidateItem } from '@/lib/services/shortlisting-service';
import { updateCandidateDecisionAction, bulkUpdateDecisionsAction } from '@/lib/actions/shortlisting-actions';

export function ShortlistingClientView({ initialData }: { initialData: ShortlistingDashboardData }) {
  const [candidates, setCandidates] = useState<ShortlistedCandidateItem[]>(initialData.candidates);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Extract unique branches
  const branches = Array.from(new Set(initialData.candidates.map((c) => c.branch))).filter(Boolean);

  const filteredCandidates = candidates.filter((cand) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'unreviewed'
        ? cand.status === 'applied' || cand.status === 'scheduled' || cand.status === 'interviewed'
        : cand.status === statusFilter;

    const matchesBranch = branchFilter === 'all' || cand.branch === branchFilter;
    const matchesScore = cand.averageScore >= minScoreFilter;
    const matchesSearch =
      cand.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesBranch && matchesScore && matchesSearch;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCandidates.map((c) => c.candidateId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleDecision = async (
    candidateId: string,
    decision: 'selected' | 'waitlisted' | 'rejected'
  ) => {
    setIsUpdating(true);
    await updateCandidateDecisionAction(candidateId, decision);
    setCandidates((prev) =>
      prev.map((c) => (c.candidateId === candidateId ? { ...c, status: decision } : c))
    );
    setIsUpdating(false);
  };

  const handleBulkDecision = async (decision: 'selected' | 'waitlisted' | 'rejected') => {
    if (selectedIds.length === 0) return;
    setIsUpdating(true);
    await bulkUpdateDecisionsAction(selectedIds, decision);
    setCandidates((prev) =>
      prev.map((c) => (selectedIds.includes(c.candidateId) ? { ...c, status: decision } : c))
    );
    setSelectedIds([]);
    setIsUpdating(false);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = [
      'Enrollment Number',
      'Full Name',
      'Email',
      'Phone',
      'Branch',
      'Year of Study',
      'Interview Panel',
      'Evaluator Scorecards',
      'Composite Score (out of 5)',
      'Communication Avg',
      'Motivation Avg',
      'Domain Knowledge Avg',
      'Teamwork Avg',
      'Final Status',
    ];

    const rows = filteredCandidates.map((c) => [
      `"${c.enrollmentNo}"`,
      `"${c.fullName}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.branch}"`,
      `"${c.yearOfStudy}"`,
      `"${c.panelName}"`,
      c.scorecardCount,
      c.averageScore.toFixed(2),
      c.communicationAvg.toFixed(1),
      c.motivationAvg.toFixed(1),
      c.domainKnowledgeAvg.toFixed(1),
      c.teamworkAvg.toFixed(1),
      `"${c.status.toUpperCase()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rotaract_Induction_Shortlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Shortlisting & Final Results
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate multi-evaluator scorecards, calibrate cutoffs, and export official club induction lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export Filtered CSV ({filteredCandidates.length})
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-400">Total Evaluated</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {initialData.stats.totalInterviewed}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-emerald-400 font-medium">Selected Inductees</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {candidates.filter((c) => c.status === 'selected').length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-amber-400 font-medium">Waitlisted</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {candidates.filter((c) => c.status === 'waitlisted').length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-400 font-medium">Drive Avg Score</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {initialData.stats.averageDriveScore}
              <span className="text-xs text-slate-500 font-normal"> / 5.0</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Bulk Action Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate or enrollment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-52"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="selected">Selected</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="rejected">Rejected</option>
                <option value="unreviewed">Unreviewed / Interviewed</option>
              </select>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Min Cutoff Score */}
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value={0}>Min Score: None</option>
                <option value={3.0}>Min Score: 3.0+</option>
                <option value={4.0}>Min Score: 4.0+</option>
                <option value={4.5}>Min Score: 4.5+</option>
              </select>
            </div>

            {/* Bulk Selection Bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 animate-in fade-in duration-200">
                <span className="text-xs text-slate-300 font-medium">
                  {selectedIds.length} Selected
                </span>
                <div className="h-3.5 w-px bg-slate-700" />
                <button
                  disabled={isUpdating}
                  onClick={() => handleBulkDecision('selected')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Select
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleBulkDecision('waitlisted')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium ml-1.5"
                >
                  Waitlist
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleBulkDecision('rejected')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium ml-1.5"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 pl-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        filteredCandidates.length > 0 &&
                        selectedIds.length === filteredCandidates.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 bg-slate-900"
                    />
                  </th>
                  <th className="py-2.5 pl-2">Candidate</th>
                  <th className="py-2.5">Dept / Year</th>
                  <th className="py-2.5">Panel</th>
                  <th className="py-2.5 text-center">Scorecards</th>
                  <th className="py-2.5">Score (Composite)</th>
                  <th className="py-2.5">Decision Status</th>
                  <th className="py-2.5 text-right pr-3">Mark Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No candidates match your current filter settings.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((cand) => (
                    <tr
                      key={cand.candidateId}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        selectedIds.includes(cand.candidateId) ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 pl-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(cand.candidateId)}
                          onChange={() => handleToggleSelect(cand.candidateId)}
                          className="rounded border-slate-700 bg-slate-900"
                        />
                      </td>
                      <td className="py-3 pl-2">
                        <div className="font-semibold text-slate-200">{cand.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {cand.enrollmentNo}
                        </div>
                      </td>
                      <td className="py-3 text-slate-300">
                        <div>{cand.branch}</div>
                        <div className="text-[11px] text-slate-500">{cand.yearOfStudy}</div>
                      </td>
                      <td className="py-3 text-slate-300">{cand.panelName}</td>
                      <td className="py-3 text-center">
                        <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {cand.scorecardCount}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-sm ${
                              cand.averageScore >= 4.5
                                ? 'text-emerald-400'
                                : cand.averageScore >= 3.5
                                ? 'text-blue-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {cand.averageScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500">/ 5.0</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            cand.status === 'selected'
                              ? 'success'
                              : cand.status === 'waitlisted'
                              ? 'warning'
                              : cand.status === 'rejected'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {cand.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right pr-3">
                        <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleSingleDecision(cand.candidateId, 'selected')}
                            title="Mark Selected"
                            className={`px-2 py-0.5 rounded transition-colors ${
                              cand.status === 'selected'
                                ? 'bg-emerald-600 text-white font-medium'
                                : 'text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            Select
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleSingleDecision(cand.candidateId, 'waitlisted')}
                            title="Mark Waitlisted"
                            className={`px-2 py-0.5 rounded transition-colors ${
                              cand.status === 'waitlisted'
                                ? 'bg-amber-600 text-white font-medium'
                                : 'text-slate-400 hover:text-amber-400'
                            }`}
                          >
                            Waitlist
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleSingleDecision(cand.candidateId, 'rejected')}
                            title="Mark Rejected"
                            className={`px-2 py-0.5 rounded transition-colors ${
                              cand.status === 'rejected'
                                ? 'bg-rose-600 text-white font-medium'
                                : 'text-slate-400 hover:text-rose-400'
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
