import TeamMcpSection from '@/features/teams/components/mcp/TeamMcpSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamMcpSection teamId={Number(teamId)} />;
}
