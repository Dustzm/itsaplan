'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { projectPath } from '@/utils/paths';
import { useTeam, useTeamProjectsQuery } from '@/services/teams.service';
import SectionPageView from '@/components/common/page/SectionPageView';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import { Button } from '@/components/ui/button';
import NewProjectModal from '@/components/layout/NewProjectModal';
import TeamProjectPanel from './TeamProjectPanel';
import TeamProjectsTable from './TeamProjectsTable';

// The projects the team owns, one row each, opening in a side panel. Owners and
// managers run them, so only they create one; a plain member only reads them.
export default function TeamProjectsSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams');
  const router = useRouter();
  const team = useTeam(teamId);
  const { data } = useTeamProjectsQuery(teamId);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const canCreate = team != null && team.role !== 'member';
  const projects = data ?? [];
  const selected = projects.find((project) => project.id === selectedId) ?? null;

  return (
    <SectionPageView
      title={t('sections.projects.title')}
      description={t('sections.projects.description')}
      wide
      actions={
        canCreate ? (
          <Button size="sm" className="h-8 gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" />
            {t('panel.newProject')}
          </Button>
        ) : undefined
      }
    >
      {!data ? (
        <ListSkeleton rows={4} rowClassName="h-12" />
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('panel.noProjects')}</p>
      ) : (
        <TeamProjectsTable projects={projects} onSelect={setSelectedId} />
      )}

      {creating && (
        <NewProjectModal
          teamId={teamId}
          onClose={() => setCreating(false)}
          onCreated={(key) => {
            setCreating(false);
            router.push(projectPath(key));
          }}
        />
      )}

      {selected && team && (
        <TeamProjectPanel
          teamId={teamId}
          teamName={team.name}
          teamRole={team.role}
          project={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </SectionPageView>
  );
}
