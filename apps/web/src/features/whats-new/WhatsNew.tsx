'use client';

import { useMarkWhatsNewSeen, useWhatsNewQuery } from './services/whatsNew.service';
import WhatsNewOverlay from './components/WhatsNewOverlay';

// Shows the post-upgrade screen once per release, over whatever page the user
// landed on. Mounted for every signed-in page; the query it reads is disabled
// without a session, so the sign-in and invite screens ask for nothing.
export default function WhatsNew() {
  const { data } = useWhatsNewQuery();
  const markSeen = useMarkWhatsNewSeen();

  if (!data?.pending) return null;
  // Nothing to say: a build whose version is missing from the changelog and an
  // account that sees neither the backup nor the report.
  if (data.releases.length === 0 && !data.backup && !data.migration) return null;

  return <WhatsNewOverlay data={data} onClose={() => markSeen.mutate()} />;
}
