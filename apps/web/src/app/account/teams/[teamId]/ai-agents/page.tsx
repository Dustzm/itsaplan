import TeamAiAgentsSection from '@/features/teams/components/ai-agents/TeamAiAgentsSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamAiAgentsSection teamId={Number(teamId)} />;
}
