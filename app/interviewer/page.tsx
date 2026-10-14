import React from 'react';
import { getInterviewerWorkspace } from '@/lib/services/interviewer-query-service';
import { InterviewerClientView } from '@/components/interviewer/interviewer-client-view';

export const metadata = {
  title: 'Interviewer Workspace | Rotaract RecruitX',
  description: 'Conduct candidate evaluations and submit standardized scorecards.',
};

export default async function InterviewerPage() {
  const workspaceData = await getInterviewerWorkspace();

  return <InterviewerClientView data={workspaceData} />;
}
