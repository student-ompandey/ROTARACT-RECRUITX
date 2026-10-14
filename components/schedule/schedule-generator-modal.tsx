'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GeneratedSlotPreview } from '@/lib/validations/scheduling';
import {
  previewSchedulePlanAction,
  commitSchedulePlanAction,
} from '@/lib/actions/scheduling-actions';
import {
  Calendar,
  Clock,
  Shuffle,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ScheduleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveId: string;
  driveName: string;
  totalCandidates: number;
  panels: Array<{ id: string; name: string }>;
}

export function ScheduleGeneratorModal({
  isOpen,
  onClose,
  driveId,
  driveName,
  totalCandidates,
  panels,
}: ScheduleGeneratorModalProps) {
  const [interviewDate, setInterviewDate] = useState('2026-10-16');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [slotDuration, setSlotDuration] = useState(5);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>(
    panels.map((p) => p.id)
  );

  const [previewPlan, setPreviewPlan] = useState<{
    slots: GeneratedSlotPreview[];
    unassignedCandidates: any[];
    capacity: any;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  if (!isOpen) return null;

  function togglePanel(id: string) {
    if (selectedPanelIds.includes(id)) {
      if (selectedPanelIds.length > 1) {
        setSelectedPanelIds(selectedPanelIds.filter((p) => p !== id));
      }
    } else {
      setSelectedPanelIds([...selectedPanelIds, id]);
    }
  }

  async function handlePreview() {
    setIsLoading(true);
    setErrorMessage(null);

    const res = await previewSchedulePlanAction({
      driveId,
      interviewDate,
      startTime,
      endTime,
      slotDurationMinutes: slotDuration,
      bufferMinutes,
      panelIds: selectedPanelIds,
    });

    setIsLoading(false);
    if (!res.success || !res.data) {
      setErrorMessage(res.error || 'Failed to generate preview.');
    } else {
      setPreviewPlan(res.data);
    }
  }

  async function handleCommit(publishNow: boolean) {
    if (!previewPlan) return;

    setIsCommitting(true);
    setErrorMessage(null);

    const res = await commitSchedulePlanAction({
      driveId,
      slots: previewPlan.slots,
      publishNow,
    });

    setIsCommitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to commit schedule plan.');
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col border-slate-700 bg-[#0f172a] shadow-2xl shadow-black relative overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Automated Interview Schedule Generator
              </h3>
              <p className="text-[11px] text-slate-400">
                {driveName} · {totalCandidates} Candidates · Asia/Kolkata (IST)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Configuration Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Interview Date
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Window Starts (IST)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Window Ends (IST)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Slot Duration (Minutes)
              </label>
              <input
                type="number"
                min={3}
                max={60}
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Standard RecruitX default: 5 mins / interview
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Buffer Between Slots (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Optional transition gap between candidates
              </span>
            </div>
          </div>

          {/* Active Panels Selection */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Participating Interview Panels ({selectedPanelIds.length} of {panels.length} Active)
            </label>
            <div className="flex flex-wrap gap-2">
              {panels.map((p) => {
                const isSelected = selectedPanelIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePanel(p.id)}
                    className={`h-7 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePreview}
              disabled={isLoading}
            >
              {isLoading ? 'Calculating Slots...' : 'Generate Schedule Preview'}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {/* PREVIEW SECTION */}
          {previewPlan && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              {/* Capacity Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  previewPlan.capacity.fitsInWindow
                    ? 'bg-emerald-950/25 border-emerald-900/50 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-900/50 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {previewPlan.capacity.fitsInWindow ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    <strong>
                      {previewPlan.capacity.fitsInWindow
                        ? 'Capacity Verified:'
                        : 'Window Insufficient:'}
                    </strong>{' '}
                    {previewPlan.capacity.totalSlotsCapacity} total slots generated (
                    {previewPlan.capacity.slotsPerPanel} per panel across{' '}
                    {previewPlan.capacity.selectedPanelsCount} simultaneous panels).
                  </span>
                </div>
                <Badge variant={previewPlan.capacity.fitsInWindow ? 'success' : 'warning'}>
                  {previewPlan.capacity.fitsInWindow
                    ? `+${previewPlan.capacity.surplusOrDeficit} Buffer`
                    : `${previewPlan.capacity.surplusOrDeficit} Needed`}
                </Badge>
              </div>

              {/* Preview Slot Grid */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Time (IST)</th>
                      <th className="p-2">Panel</th>
                      <th className="p-2">Candidate</th>
                      <th className="p-2">Enrollment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {previewPlan.slots.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="p-2 font-mono text-slate-400 text-[11px]">
                          {s.startsAtFormatted.split(',')[1]}
                        </td>
                        <td className="p-2 font-semibold text-blue-400">{s.panelName}</td>
                        <td className="p-2 text-slate-200">
                          {s.assignedCandidateName || (
                            <span className="text-slate-500 italic">Empty Slot</span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-slate-400">
                          {s.assignedCandidateEnrollment || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isCommitting}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {previewPlan && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCommit(false)}
                  disabled={isCommitting}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCommit(true)}
                  disabled={isCommitting}
                >
                  {isCommitting ? 'Committing...' : 'Publish Schedule'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
