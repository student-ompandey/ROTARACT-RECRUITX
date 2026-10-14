'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { createDriveAction } from '@/lib/actions/drive-actions';
import { Plus, X, Calendar, Clock, Layers, AlertCircle, CheckCircle } from 'lucide-react';

export function CreateDriveModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createDriveAction(formData);

    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Failed to create recruitment drive');
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-lg w-full border-slate-700 bg-[#0f172a] shadow-2xl shadow-black relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">Create Recruitment Drive</CardTitle>
              <CardDescription className="text-xs">
                Initialize recruitment drive parameters, dates, and default panels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Drive Name</label>
              <input
                name="name"
                required
                defaultValue="Rotaract Induction Drive 2026-27"
                placeholder="e.g. Induction Drive 2026-27"
                className="w-full h-8 px-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Session / Year</label>
                <input
                  name="academicYear"
                  required
                  defaultValue="2026-27"
                  placeholder="2026-27"
                  className="w-full h-8 px-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Target Candidates</label>
                <input
                  name="targetCandidates"
                  type="number"
                  required
                  defaultValue={92}
                  className="w-full h-8 px-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Interview Starts (IST)</label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue="2026-10-20T10:00"
                  className="w-full h-8 px-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Interview Ends (IST)</label>
                <input
                  name="endsAt"
                  type="datetime-local"
                  required
                  defaultValue="2026-10-22T18:00"
                  className="w-full h-8 px-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Description</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Induction drive objectives and committee instructions..."
                defaultValue="Annual core induction for technical, editorial, creative, and operational wings."
                className="w-full p-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Drive...' : 'Create Drive & 4 Panels'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
