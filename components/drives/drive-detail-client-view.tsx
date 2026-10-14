'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DriveDetailData,
} from '@/lib/services/drive-query-service';
import {
  updateDriveStatusAction,
  createPanelAction,
  assignPanelMemberAction,
  removePanelMemberAction,
} from '@/lib/actions/drive-actions';
import { DriveStatus } from '@/lib/validations/drive';
import {
  Layers,
  Users,
  Video,
  UserPlus,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface DriveDetailClientViewProps {
  drive: DriveDetailData;
  availableInterviewers: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
  }>;
}

export function DriveDetailClientView({
  drive,
  availableInterviewers,
}: DriveDetailClientViewProps) {
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(
    drive.panels[0]?.id || null
  );
  const [newPanelName, setNewPanelName] = useState('');
  const [newPanelMeet, setNewPanelMeet] = useState('');
  const [isAddingPanel, setIsAddingPanel] = useState(false);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState('');
  const [memberRole, setMemberRole] = useState<'lead' | 'evaluator'>('evaluator');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const selectedPanel = drive.panels.find((p) => p.id === selectedPanelId);

  // Status transitions
  async function handleStatusChange(newStatus: DriveStatus) {
    setStatusMessage(null);
    const res = await updateDriveStatusAction(drive.id, newStatus);
    if (!res.success) {
      setStatusMessage({ text: res.error || 'Failed to update status', type: 'error' });
    } else {
      setStatusMessage({ text: `Drive marked as ${newStatus}`, type: 'success' });
    }
  }

  // Add panel
  async function handleAddPanel(e: React.FormEvent) {
    e.preventDefault();
    if (!newPanelName) return;

    const fd = new FormData();
    fd.append('name', newPanelName);
    fd.append('meetLink', newPanelMeet);

    const res = await createPanelAction(drive.id, fd);
    if (!res.success) {
      setStatusMessage({ text: res.error || 'Failed to create panel', type: 'error' });
    } else {
      setNewPanelName('');
      setNewPanelMeet('');
      setIsAddingPanel(false);
      setStatusMessage({ text: 'Panel created successfully', type: 'success' });
    }
  }

  // Assign evaluator to panel
  async function handleAssignMember() {
    if (!selectedPanelId || !selectedInterviewerId) return;

    const res = await assignPanelMemberAction(
      drive.id,
      selectedPanelId,
      selectedInterviewerId,
      memberRole
    );

    if (!res.success) {
      setStatusMessage({ text: res.error || 'Assignment error', type: 'error' });
    } else {
      setSelectedInterviewerId('');
      setStatusMessage({ text: 'Interviewer assigned to panel', type: 'success' });
    }
  }

  // Remove member
  async function handleRemoveMember(userId: string) {
    if (!selectedPanelId) return;

    const res = await removePanelMemberAction(drive.id, selectedPanelId, userId);
    if (!res.success) {
      setStatusMessage({ text: res.error || 'Removal failed', type: 'error' });
    } else {
      setStatusMessage({ text: 'Interviewer removed from panel', type: 'success' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/40 border-red-800/60 text-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Drive Context Bar */}
      <Card className="border-slate-800">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/70 flex items-center justify-center text-blue-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-100">{drive.name}</h1>
                <Badge
                  variant={
                    drive.status === 'scheduled' || drive.status === 'active'
                      ? 'success'
                      : drive.status === 'draft'
                      ? 'warning'
                      : 'outline'
                  }
                >
                  {drive.status}
                </Badge>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {drive.academicYear}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {drive.startsAtFormatted} → {drive.endsAtFormatted}
              </p>
            </div>
          </div>

          {/* Status Transition Controller */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Change State:</span>
            {(['draft', 'ready', 'scheduled', 'completed', 'archived'] as DriveStatus[]).map((st) => (
              <Button
                key={st}
                size="sm"
                variant={drive.status === st ? 'primary' : 'outline'}
                onClick={() => handleStatusChange(st)}
                disabled={drive.status === st}
                className="capitalize text-xs h-7 px-2.5"
              >
                {st}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {drive.description && (
            <p className="text-xs text-slate-300 mb-4">{drive.description}</p>
          )}

          {/* Operational KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Candidates</span>
              <span className="font-semibold text-slate-100 text-sm">
                {drive.stats.totalCandidates} / {drive.targetCandidates}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Assigned Interviews</span>
              <span className="font-semibold text-blue-400 text-sm">
                {drive.stats.assignedInterviews}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Pending Scorecards</span>
              <span className="font-semibold text-amber-400 text-sm">
                {drive.stats.pendingScorecards}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Completed Evaluations</span>
              <span className="font-semibold text-emerald-400 text-sm">
                {drive.stats.completedScorecards}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Panels Count</span>
              <span className="font-semibold text-purple-400 text-sm">
                {drive.stats.panelsCount} Panels
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panels and Member Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configurable Panels List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Interview Panels ({drive.panels.length})
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingPanel(!isAddingPanel)}
              className="h-7 px-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Panel
            </Button>
          </div>

          {/* Form to add custom panel */}
          {isAddingPanel && (
            <Card className="border-blue-900/50 bg-blue-950/20 p-3 space-y-2">
              <input
                type="text"
                value={newPanelName}
                onChange={(e) => setNewPanelName(e.target.value)}
                placeholder="Panel Name (e.g. Panel 5 — Sponsorship)"
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="url"
                value={newPanelMeet}
                onChange={(e) => setNewPanelMeet(e.target.value)}
                placeholder="Google Meet Link (Optional)"
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingPanel(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={handleAddPanel} className="h-7 text-xs">
                  Save Panel
                </Button>
              </div>
            </Card>
          )}

          {/* Panels List */}
          <div className="space-y-2">
            {drive.panels.map((p) => {
              const isSelected = p.id === selectedPanelId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPanelId(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-950/30 shadow-md shadow-blue-950/30'
                      : 'border-slate-800 bg-[#0f172a]/60 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{p.name}</h4>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {p.members.length} Evaluator{p.members.length === 1 ? '' : 's'} assigned
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-colors ${
                      isSelected ? 'text-blue-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Panel Details and Evaluators */}
        <div className="lg:col-span-2">
          {selectedPanel ? (
            <Card className="border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{selectedPanel.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {selectedPanel.description || 'Configurable interview panel'}
                    </CardDescription>
                  </div>
                  {selectedPanel.meetLink && (
                    <a
                      href={selectedPanel.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                    >
                      <Video className="w-3.5 h-3.5" /> Google Meet Link
                    </a>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-6">
                {/* Current Assigned Panel Evaluators */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Assigned Evaluators ({selectedPanel.members.length})
                  </h4>

                  {selectedPanel.members.length === 0 ? (
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-dashed border-slate-800 text-center">
                      <p className="text-xs text-slate-400">
                        No evaluators assigned yet. Standard guidelines recommend 2 interviewers per panel.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden">
                      {selectedPanel.members.map((m) => (
                        <div
                          key={m.userId}
                          className="p-3 bg-slate-900/40 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                              {m.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-100">
                                  {m.fullName}
                                </span>
                                <Badge variant={m.roleInPanel === 'lead' ? 'purple' : 'default'}>
                                  {m.roleInPanel}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-slate-500">{m.email}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(m.userId)}
                            className="h-7 px-2 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assign Interviewer Form */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300">
                    Assign Interviewer to {selectedPanel.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={selectedInterviewerId}
                      onChange={(e) => setSelectedInterviewerId(e.target.value)}
                      className="sm:col-span-2 h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Interviewer...</option>
                      {availableInterviewers.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.full_name} ({inv.email})
                        </option>
                      ))}
                    </select>

                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as 'lead' | 'evaluator')}
                      className="h-8 px-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="evaluator">Evaluator</option>
                      <option value="lead">Panel Lead</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAssignMember}
                      disabled={!selectedInterviewerId}
                      className="h-8 text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Add to Panel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center border-slate-800">
              <p className="text-xs text-slate-400">Select a panel to inspect or manage members.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
