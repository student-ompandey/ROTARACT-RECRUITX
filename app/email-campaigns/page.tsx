import React from 'react';
import { getCampaignsOverview } from '@/lib/services/campaign-query-service';
import { getDrivesList } from '@/lib/services/drive-query-service';
import { CampaignsClientView } from '@/components/campaigns/campaigns-client-view';

export const revalidate = 0; // Dynamic server component

export default async function EmailCampaignsPage() {
  const [overview, drives] = await Promise.all([
    getCampaignsOverview(),
    getDrivesList(),
  ]);

  const driveOptions = drives.map((d) => ({ id: d.id, name: d.name }));

  return <CampaignsClientView overview={overview} drives={driveOptions} />;
}
