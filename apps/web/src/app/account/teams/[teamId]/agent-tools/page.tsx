import TeamAgentToolsSection from '@/features/teams/components/agent-tools/TeamAgentToolsSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamAgentToolsSection teamId={Number(teamId)} />;
}
