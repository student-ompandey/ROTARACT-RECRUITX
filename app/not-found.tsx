import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-blue-400 mb-2">
            <Compass className="w-6 h-6" />
          </div>
          <CardTitle className="text-slate-100">Resource Not Found</CardTitle>
          <CardDescription>
            The recruitment record, pass, or dashboard page you requested does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex justify-center">
          <Link href="/">
            <Button variant="primary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
