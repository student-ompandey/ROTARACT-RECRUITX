import React from 'react';
import { AppShellLayoutWrapper } from '@/components/layout/app-shell-wrapper';

export default function DrivesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayoutWrapper>{children}</AppShellLayoutWrapper>;
}
