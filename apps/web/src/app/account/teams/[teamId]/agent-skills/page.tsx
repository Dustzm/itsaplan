import TeamAgentSkillsSection from '@/features/teams/components/agent-skills/TeamAgentSkillsSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamAgentSkillsSection teamId={Number(teamId)} />;
}
