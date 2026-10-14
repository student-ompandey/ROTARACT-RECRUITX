'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CandidateRosterItem } from '@/lib/services/candidate-query-service';
import { ImportWizardModal } from '@/components/candidates/import-wizard-modal';
import {
  Upload,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';

interface CandidatesClientViewProps {
  initialCandidates: CandidateRosterItem[];
  availableBranches: string[];
  drives: Array<{ id: string; name: string }>;
}

export function CandidatesClientView({
  initialCandidates,
  availableBranches,
  drives,
}: CandidatesClientViewProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filtered = initialCandidates.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranch === 'all' || c.branch === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <ImportWizardModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        drives={drives}
      />

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Candidate Records</h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {filtered.length} of {initialCandidates.length} enrolled candidates across all recruitment drives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-3.5 h-3.5" />
            Import CSV Batch
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, enrollment no, or email..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-8 px-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Departments ({availableBranches.length})</option>
            {availableBranches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="interviewed">Interviewed</option>
            <option value="selected">Selected</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No candidates found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedBranch !== 'all' || selectedStatus !== 'all'
              ? 'No candidates match your current filter criteria.'
              : 'Start by importing candidate CSV records for your active recruitment drive.'}
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-3.5 h-3.5" /> Launch Import Wizard
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="px-4 py-3">Enrollment</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Department & Year</th>
                  <th className="px-4 py-3">Drive Context</th>
                  <th className="px-4 py-3">Assigned Panel</th>
                  <th className="px-4 py-3">Interview Slot</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-200 font-medium">
                      {c.enrollmentNo}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-100">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <div>{c.branch}</div>
                      <div className="text-[11px] text-slate-500">{c.yearOfStudy}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {c.driveName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <span
                        className={
                          c.panelName === 'Unassigned'
                            ? 'text-amber-400'
                            : 'text-blue-400 font-medium'
                        }
                      >
                        {c.panelName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {c.slotFormatted}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          c.status === 'scheduled'
                            ? 'info'
                            : c.status === 'interviewed'
                            ? 'success'
                            : c.status === 'selected'
                            ? 'purple'
                            : 'warning'
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
