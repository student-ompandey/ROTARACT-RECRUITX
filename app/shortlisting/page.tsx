import React from 'react';
import { getShortlistingWorkspace } from '@/lib/services/shortlisting-service';
import { ShortlistingClientView } from '@/components/shortlisting/shortlisting-client-view';

export const metadata = {
  title: 'Shortlisting & Final Results | Rotaract RecruitX',
  description: 'Evaluate composite scores, apply admission cutoffs, and export official recruitment results.',
};

export default async function ShortlistingPage() {
  const shortlistingData = await getShortlistingWorkspace();

  return <ShortlistingClientView initialData={shortlistingData} />;
}
