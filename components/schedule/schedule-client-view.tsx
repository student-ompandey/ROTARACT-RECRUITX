'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DriveScheduleOverview, ScheduleSlotItem } from '@/lib/services/schedule-query-service';
import { ScheduleGeneratorModal } from '@/components/schedule/schedule-generator-modal';
import { updatePanelMeetLinkAction } from '@/lib/actions/scheduling-actions';
import {
  Calendar,
  Clock,
  Video,
  Shuffle,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  ExternalLink,
  Edit2,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface ScheduleClientViewProps {
  overview: DriveScheduleOverview | null;
  drives: Array<{ id: string; name: string }>;
}

export function ScheduleClientView({ overview, drives }: ScheduleClientViewProps) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedPanelFilter, setSelectedPanelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [meetLinkInput, setMeetLinkInput] = useState('');
  const [meetLinkStatus, setMeetLinkStatus] = useState<string | null>(null);

  if (!overview) {
    return (
      <Card className="p-12 text-center border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No recruitment drive active</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Create a recruitment drive in the Settings section before scheduling interviews.
        </p>
      </Card>
    );
  }

  // Detect Scheduling Conflicts: Same panel or same candidate with overlapping slots
  const conflicts: Array<{ reason: string; slotId: string }> = [];
  const panelSlotTimes: Record<string, Array<{ start: number; end: number; id: string }>> = {};
  const candidateSlotTimes: Record<string, Array<{ start: number; end: number; id: string }>> = {};

  overview.slots.forEach((s) => {
    const start = new Date(s.startsAt).getTime();
    const end = new Date(s.endsAt).getTime();

    // Check same panel overlap
    if (!panelSlotTimes[s.panelId]) panelSlotTimes[s.panelId] = [];
    const hasPanelOverlap = panelSlotTimes[s.panelId].some(
      (item) => (start >= item.start && start < item.end) || (end > item.start && end <= item.end)
    );
    if (hasPanelOverlap) {
      conflicts.push({
        reason: `Panel "${s.panelName}" has overlapping time slots.`,
        slotId: s.id,
      });
    }
    panelSlotTimes[s.panelId].push({ start, end, id: s.id });

    // Check same candidate overlap
    if (s.candidateId) {
      if (!candidateSlotTimes[s.candidateId]) candidateSlotTimes[s.candidateId] = [];
      const hasCandidateOverlap = candidateSlotTimes[s.candidateId].some(
        (item) => (start >= item.start && start < item.end) || (end > item.start && end <= item.end)
      );
      if (hasCandidateOverlap) {
        conflicts.push({
          reason: `Student "${s.candidateName}" is booked for multiple simultaneous panels.`,
          slotId: s.id,
        });
      }
      candidateSlotTimes[s.candidateId].push({ start, end, id: s.id });
    }
  });

  const filteredSlots = overview.slots.filter((s) => {
    const matchesPanel =
      selectedPanelFilter === 'all' || s.panelId === selectedPanelFilter;
    const matchesSearch =
      !searchQuery ||
      (s.candidateName && s.candidateName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.candidateEnrollment &&
        s.candidateEnrollment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.candidateEmail && s.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.panelName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPanel && matchesSearch;
  });

  async function handleSaveMeetLink(panelId: string) {
    setMeetLinkStatus(null);
    const res = await updatePanelMeetLinkAction(panelId, meetLinkInput);
    if (!res.success) {
      setMeetLinkStatus(res.error || 'Failed to update Meet link');
    } else {
      setEditingPanelId(null);
      setMeetLinkInput('');
    }
  }

  return (
    <div className="space-y-6">
      <ScheduleGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        driveId={overview.driveId}
        driveName={overview.driveName}
        totalCandidates={overview.totalCandidates}
        panels={overview.panels.map((p) => ({ id: p.id, name: p.name }))}
      />

      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Interview Schedule</h2>
            <Badge
              variant={
                overview.driveStatus === 'scheduled'
                  ? 'success'
                  : overview.driveStatus === 'draft'
                  ? 'warning'
                  : 'outline'
              }
            >
              {overview.driveStatus}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {overview.driveName} · {overview.panels.length} Parallel Panels ·{' '}
            {overview.assignedSlotsCount} of {overview.totalCandidates} Students Scheduled
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsGeneratorOpen(true)}>
            <Shuffle className="w-3.5 h-3.5" />
            Generate / Re-allocate Slots
          </Button>
        </div>
      </div>

      {/* Conflict Detection Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-xl space-y-1 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Scheduling Conflicts Detected ({conflicts.length})</span>
          </div>
          <p className="text-[11px] text-amber-200/90 pl-6">
            Different panels can conduct interviews simultaneously, but the same panel or student cannot overlap. Review the conflicts below or re-run the generator.
          </p>
        </div>
      )}

      {/* Panels Summary Grid with Google Meet Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.panels.map((p) => {
          const isEditing = editingPanelId === p.id;
          return (
            <Card key={p.id} className="border-slate-800 bg-[#0f172a]/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs truncate">{p.name}</CardTitle>
                  <Badge variant="purple">{p.assignedCount} Slots</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={meetLinkInput}
                      onChange={(e) => setMeetLinkInput(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full h-7 px-2 text-[11px] bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPanelId(null)}
                        className="h-6 text-[10px] px-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveMeetLink(p.id)}
                        className="h-6 text-[10px] px-2"
                      >
                        <Check className="w-3 h-3 mr-0.5" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate mr-2">
                      <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-[11px] truncate">
                        {p.meetLink ? 'Meet Configured' : 'No Meet Link'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPanelId(p.id);
                        setMeetLinkInput(p.meetLink || '');
                      }}
                      className="text-slate-500 hover:text-slate-300 text-[10px] flex items-center gap-0.5 shrink-0"
                    >
                      <Edit2 className="w-2.5 h-2.5" /> Edit
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, enrollment, email, or panel..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPanelFilter}
            onChange={(e) => setSelectedPanelFilter(e.target.value)}
            className="h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Panels ({overview.panels.length})</option>
            {overview.panels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Table: 8 Clean Responsive Columns matching prompt specifications */}
      {filteredSlots.length === 0 ? (
        <Card className="p-12 text-center border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No interview slots generated</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {overview.totalSlotsCount > 0
              ? 'No slots match your search or panel filter.'
              : 'Launch the Automated Schedule Generator to distribute students across panels within your interview window.'}
          </p>
          {overview.totalSlotsCount === 0 && (
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={() => setIsGeneratorOpen(true)}>
                <Shuffle className="w-3.5 h-3.5" /> Generate Slots
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 border-slate-800">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="px-4 py-3 min-w-[170px]">Student</th>
                  <th className="px-4 py-3 min-w-[120px]">Enrollment Number</th>
                  <th className="px-4 py-3 min-w-[130px]">Branch</th>
                  <th className="px-4 py-3 min-w-[100px]">Academic Year</th>
                  <th className="px-4 py-3 min-w-[160px]">Interview Slot</th>
                  <th className="px-4 py-3 min-w-[130px]">Panel</th>
                  <th className="px-4 py-3 min-w-[130px]">Status</th>
                  <th className="px-4 py-3 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSlots.map((slot) => {
                  const hasConflict = conflicts.some((c) => c.slotId === slot.id);

                  return (
                    <tr
                      key={slot.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        hasConflict ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Column 1: Student (Name + Email below) */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-100">
                          {slot.candidateName || <span className="text-slate-500 italic">Unassigned Slot</span>}
                        </div>
                        {slot.candidateEmail && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{slot.candidateEmail}</div>
                        )}
                      </td>

                      {/* Column 2: Enrollment Number */}
                      <td className="px-4 py-3.5 font-mono text-slate-300 font-medium">
                        {slot.candidateEnrollment || '—'}
                      </td>

                      {/* Column 3: Branch */}
                      <td className="px-4 py-3.5 text-slate-300">
                        {slot.candidateBranch || '—'}
                      </td>

                      {/* Column 4: Academic Year */}
                      <td className="px-4 py-3.5 text-slate-400">
                        {slot.candidateYear || '1st Year'}
                      </td>

                      {/* Column 5: Interview Slot (Date on top, Start - End below) */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200 font-medium">{slot.dateFormatted}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {slot.timeFormatted}
                        </div>
                      </td>

                      {/* Column 6: Panel */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-blue-400">{slot.panelName}</span>
                      </td>

                      {/* Column 7: Status (Clean, unclipped badge) */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            slot.status === 'Evaluated'
                              ? 'success'
                              : slot.status === 'Scheduled'
                              ? 'info'
                              : slot.status === 'Evaluation Pending'
                              ? 'warning'
                              : 'outline'
                          }
                          className="text-[10px] whitespace-nowrap"
                        >
                          {slot.status}
                        </Badge>
                      </td>

                      {/* Column 8: Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {slot.meetLink ? (
                          <a
                            href={slot.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Room
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No link</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
