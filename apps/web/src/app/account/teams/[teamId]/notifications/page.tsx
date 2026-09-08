import TeamNotificationsSection from '@/features/teams/components/notifications/TeamNotificationsSection';

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamNotificationsSection teamId={Number(teamId)} />;
}
