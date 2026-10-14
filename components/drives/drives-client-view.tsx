'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateDriveModal } from '@/components/drives/create-drive-modal';
import { DriveListItem } from '@/lib/services/drive-query-service';
import { Plus, Layers, Users, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export function DrivesClientView({ initialDrives }: { initialDrives: DriveListItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDrives = initialDrives.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.academicYear.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <CreateDriveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Recruitment Drives</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage recruitment sessions, interview panels, and candidate allocations.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Create New Drive
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0f172a]/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter drives by name or academic year..."
          className="w-full sm:w-72 h-8 px-3 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />

        <div className="flex items-center gap-1.5">
          {['all', 'draft', 'ready', 'scheduled', 'completed', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`h-7 px-2.5 rounded-lg text-xs capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-900/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Drives Grid / List */}
      {filteredDrives.length === 0 ? (
        <Card className="p-12 text-center border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No recruitment drives found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or status filters.'
              : 'Create your first recruitment drive to start assigning panels and candidate interviews.'}
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Initialize Drive
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDrives.map((drive) => (
            <Card key={drive.id} className="hover:border-slate-700/80 transition-all">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{drive.name}</CardTitle>
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
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {drive.academicYear}
                      </span>
                    </div>
                    <CardDescription className="mt-0.5">
                      {drive.startsAtFormatted} → {drive.endsAtFormatted}
                    </CardDescription>
                  </div>
                </div>

                <Link href={`/drives/${drive.id}`}>
                  <Button variant="secondary" size="sm">
                    Manage Drive & Panels
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>

              <CardContent>
                {drive.description && (
                  <p className="text-xs text-slate-300 mb-3">{drive.description}</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Candidates</span>
                    <span className="font-semibold text-slate-200 text-sm">
                      {drive.candidatesCount} / {drive.targetCandidates}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Interview Panels</span>
                    <span className="font-semibold text-slate-200 text-sm">
                      {drive.panelsCount} Active
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Assignments</span>
                    <span className="font-semibold text-blue-400 text-sm">
                      {drive.assignmentsCount} Scheduled
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Security Scope</span>
                    <span className="font-semibold text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> RLS Isolated
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
