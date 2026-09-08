import TeamIntegrationsSection from '@/features/teams/components/integrations/TeamIntegrationsSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamIntegrationsSection teamId={Number(teamId)} />;
}
