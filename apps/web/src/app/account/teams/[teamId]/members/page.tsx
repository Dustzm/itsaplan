import TeamMembersSection from '@/features/teams/components/members/TeamMembersSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamMembersSection teamId={Number(teamId)} />;
}
