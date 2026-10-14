import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Download, Filter, Eye } from 'lucide-react';

export default function ShortlistingPage() {
  const shortlists = [
    {
      enrollment: '24TIT001',
      name: 'Aarav Sharma',
      branch: 'Computer Science',
      avgScore: '4.8 / 5.0',
      panel: 'Panel 1 (Tech)',
      recommendation: 'Selected',
    },
    {
      enrollment: '24TIT015',
      name: 'Priya Verma',
      branch: 'Textile Tech',
      avgScore: '4.5 / 5.0',
      panel: 'Panel 2 (Editorial)',
      recommendation: 'Selected',
    },
    {
      enrollment: '24TIT067',
      name: 'Ananya Deshmukh',
      branch: 'Mechanical Eng.',
      avgScore: '4.2 / 5.0',
      panel: 'Panel 3 (Creative)',
      recommendation: 'Waitlisted',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Shortlisting & Final Results</h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate scorecard reviews and export recruitment inductee lists.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-3.5 h-3.5" />
            Export Selected List
          </Button>
          <Button variant="primary" size="sm">
            <CheckSquare className="w-3.5 h-3.5" />
            Publish Results (Draft)
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0 border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-medium">
            <tr>
              <th className="px-4 py-3">Enrollment</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Evaluator Score</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3 text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {shortlists.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3.5 font-mono text-slate-300 font-medium">{s.enrollment}</td>
                <td className="px-4 py-3.5 font-semibold text-slate-200">{s.name}</td>
                <td className="px-4 py-3.5 text-slate-400">{s.branch}</td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-emerald-400">{s.avgScore}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={s.recommendation === 'Selected' ? 'success' : 'warning'}>
                    {s.recommendation}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200">
                    <Eye className="w-3 h-3 mr-1" /> Scorecard
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
