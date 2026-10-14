'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('RecruitX Error Captured:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-red-900/40 bg-red-950/10">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center mx-auto text-red-400 mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-slate-100">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred while loading this recruitment resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-xs font-mono text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800 truncate">
            {error?.message || 'Unknown runtime error'}
          </p>
          <div className="flex justify-center">
            <Button variant="secondary" size="sm" onClick={() => reset()}>
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
