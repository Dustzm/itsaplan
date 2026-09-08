'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { manageTeamsPath } from '@/utils/paths';
import { useTeamsQuery } from '@/services/teams.service';
import TeamsPageRail from './components/TeamsPageRail';
import TeamSectionNav from './components/TeamSectionNav';

// One team, as the second rail of the page and the section open beside it. Each
// section is a route of its own and loads only what it shows. A team the account is
// no longer in falls back to the first one left.
export default function TeamLayout({ teamId, children }: { teamId: number; children: ReactNode }) {
  const router = useRouter();
  const { data } = useTeamsQuery();
  const team = data?.find((entry) => entry.id === teamId) ?? null;

  useEffect(() => {
    if (data && !team) router.replace(manageTeamsPath());
  }, [data, team, router]);

  return (
    <>
      <TeamsPageRail className="lg:w-60">{team && <TeamSectionNav team={team} />}</TeamsPageRail>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </>
  );
}
