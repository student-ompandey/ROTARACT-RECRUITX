import React from 'react';
import { notFound } from 'next/navigation';
import {
  getDriveDetail,
  getAvailableInterviewers,
} from '@/lib/services/drive-query-service';
import { DriveDetailClientView } from '@/components/drives/drive-detail-client-view';

export const revalidate = 0; // Dynamic server component

export default async function DriveDetailPage({
  params,
}: {
  params: Promise<{ driveId: string }>;
}) {
  const { driveId } = await params;
  const [drive, availableInterviewers] = await Promise.all([
    getDriveDetail(driveId),
    getAvailableInterviewers(),
  ]);

  if (!drive) {
    notFound();
  }

  return (
    <DriveDetailClientView
      drive={drive}
      availableInterviewers={availableInterviewers}
    />
  );
}
