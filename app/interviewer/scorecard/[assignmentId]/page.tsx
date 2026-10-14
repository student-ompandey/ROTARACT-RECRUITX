import React from 'react';
import { notFound } from 'next/navigation';
import { getAssignmentForEvaluation } from '@/lib/services/interviewer-query-service';
import { ScorecardForm } from '@/components/interviewer/scorecard-form';

interface PageProps {
  params: Promise<{
    assignmentId: string;
  }>;
}

export const metadata = {
  title: 'Candidate Evaluation Scorecard | Rotaract RecruitX',
  description: 'Evaluate candidate performance against standardized rubric criteria.',
};

export default async function ScorecardPage({ params }: PageProps) {
  const { assignmentId } = await params;
  const assignment = await getAssignmentForEvaluation(assignmentId);

  if (!assignment) {
    notFound();
  }

  return <ScorecardForm assignment={assignment} />;
}
