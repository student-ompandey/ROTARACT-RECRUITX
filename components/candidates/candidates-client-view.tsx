'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CandidateRosterItem } from '@/lib/services/candidate-query-service';
import { ImportWizardModal } from '@/components/candidates/import-wizard-modal';
import {
  issueCandidatePassTokenAction,
  revokeCandidatePassTokenAction,
} from '@/lib/actions/pass-actions';
import {
  Upload,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Key,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
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
  const [generatedPassUrl, setGeneratedPassUrl] = useState<{
    candidateName: string;
    url: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filtered = initialCandidates.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranch === 'all' || c.branch === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  async function handleIssuePass(candidateId: string, driveId: string, name: string) {
    setActionMessage(null);
    const res = await issueCandidatePassTokenAction(candidateId, driveId);
    if (res.success && res.rawToken) {
      const url = `${window.location.origin}/pass/${res.rawToken}`;
      setGeneratedPassUrl({ candidateName: name, url });
    } else {
      setActionMessage(res.error || 'Failed to issue pass token');
    }
  }

  async function handleRevokePass(candidateId: string, driveId: string) {
    setActionMessage(null);
    const res = await revokeCandidatePassTokenAction(candidateId, driveId);
    if (res.success) {
      setActionMessage('Pass token revoked successfully.');
    } else {
      setActionMessage(res.error || 'Failed to revoke token');
    }
  }

  function handleCopyUrl() {
    if (generatedPassUrl?.url) {
      navigator.clipboard.writeText(generatedPassUrl.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <ImportWizardModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        drives={drives}
      />

      {/* Generated Token Modal Preview */}
      {generatedPassUrl && (
        <div className="p-4 bg-blue-950/40 border border-blue-800/80 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-200">
              New Interview Pass Token Generated for {generatedPassUrl.candidateName}
            </span>
            <button
              onClick={() => setGeneratedPassUrl(null)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Copy this private link now. The raw token is not stored in plaintext in the database:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedPassUrl.url}
              className="flex-1 h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px] select-all"
            />
            <Button size="sm" variant="secondary" onClick={handleCopyUrl} className="h-8">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
            <a
              href={generatedPassUrl.url}
              target="_blank"
              rel="noreferrer"
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center text-xs"
            >
              Open <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      )}

      {actionMessage && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-2 text-xs text-slate-300">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Registered Students</h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {filtered.length} of {initialCandidates.length} enrolled students.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-3.5 h-3.5" />
            Import Students (CSV)
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
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment Number</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Academic Year</th>
                  <th className="px-4 py-3">Interview Slot</th>
                  <th className="px-4 py-3">Recruitment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-100">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-200 font-medium">
                      {c.enrollmentNo}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {c.branch}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {c.yearOfStudy}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <div className="text-slate-200 font-medium">{c.slotFormatted}</div>
                      <div className="text-[11px] text-slate-500">{c.panelName}</div>
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
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleIssuePass(c.id, c.driveId, c.fullName)}
                        title="Issue / Regenerate Pass Link"
                        className="h-7 px-2 text-blue-400 hover:text-blue-300"
                      >
                        <Key className="w-3.5 h-3.5 mr-1" /> Issue Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokePass(c.id, c.driveId)}
                        title="Revoke Pass Link"
                        className="h-7 px-2 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
