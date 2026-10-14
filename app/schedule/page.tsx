import React from 'react';
import { getDriveSchedule } from '@/lib/services/schedule-query-service';
import { getDrivesList } from '@/lib/services/drive-query-service';
import { ScheduleClientView } from '@/components/schedule/schedule-client-view';

export const revalidate = 0; // Dynamic server component

export default async function SchedulePage() {
  const [overview, drives] = await Promise.all([
    getDriveSchedule(),
    getDrivesList(),
  ]);

  const driveOptions = drives.map((d) => ({ id: d.id, name: d.name }));

  return <ScheduleClientView overview={overview} drives={driveOptions} />;
}
