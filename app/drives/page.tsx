import React from 'react';
import { getDrivesList } from '@/lib/services/drive-query-service';
import { DrivesClientView } from '@/components/drives/drives-client-view';

export const revalidate = 0; // Dynamic server component

export default async function DrivesPage() {
  const drives = await getDrivesList();

  return <DrivesClientView initialDrives={drives} />;
}
