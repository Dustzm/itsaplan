import TeamProjectsSection from '@/features/teams/components/projects/TeamProjectsSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamProjectsSection teamId={Number(teamId)} />;
}
