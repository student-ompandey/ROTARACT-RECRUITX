import React from 'react';
import { getCandidatesRoster } from '@/lib/services/candidate-query-service';
import { getDrivesList } from '@/lib/services/drive-query-service';
import { CandidatesClientView } from '@/components/candidates/candidates-client-view';

export const revalidate = 0; // Dynamic server component

export default async function CandidatesPage() {
  const [{ candidates, availableBranches }, drives] = await Promise.all([
    getCandidatesRoster(),
    getDrivesList(),
  ]);

  const drivesOptions = drives.map((d) => ({ id: d.id, name: d.name }));

  return (
    <CandidatesClientView
      initialCandidates={candidates}
      availableBranches={availableBranches}
      drives={drivesOptions}
    />
  );
}
