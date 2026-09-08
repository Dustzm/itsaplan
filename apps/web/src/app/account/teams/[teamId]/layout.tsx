import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import TeamLayout from '@/features/teams/TeamLayout';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ teamId: string }>;
  children: ReactNode;
}) {
  const { teamId } = await params;
  const id = Number(teamId);
  if (!Number.isInteger(id)) notFound();

  return <TeamLayout teamId={id}>{children}</TeamLayout>;
}
