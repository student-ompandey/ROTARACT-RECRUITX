import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-slate-800/80 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-800/60 bg-slate-900/40">
            <CardContent className="p-0 space-y-3">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-8 w-16 bg-slate-800 rounded" />
              <div className="h-3 w-32 bg-slate-800/60 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-64 w-full bg-slate-900/40 rounded-xl border border-slate-800/60" />
    </div>
  );
}
