import TeamRolesSection from '@/features/teams/components/roles/TeamRolesSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamRolesSection teamId={Number(teamId)} />;
}
