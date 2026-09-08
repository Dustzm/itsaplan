import TeamInfoSection from '@/features/teams/components/info/TeamInfoSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamInfoSection teamId={Number(teamId)} />;
}
