'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Role } from '@/lib/api';
import { usePermissionCatalogQuery, useTeamRolesQuery } from '@/services/roles.service';
import { useTeam } from '@/services/teams.service';
import SectionPageView from '@/components/common/page/SectionPageView';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import RoleEditorPanel from './RoleEditorPanel';
import TeamRolesList from './TeamRolesList';
import TeamRolesToolbar from './TeamRolesToolbar';

// The roles section of a team: the roles every project of the team assigns from,
// with the editor they are created and changed in. The team's owner and managers
// manage them, and deleting one is the owner's alone; a plain member reads a notice
// instead of the list.
export default function TeamRolesSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams');
  const team = useTeam(teamId);
  const canManage = team?.role === 'owner' || team?.role === 'manager';
  const rolesQuery = useTeamRolesQuery(canManage ? teamId : null);
  const catalogQuery = usePermissionCatalogQuery();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const roles = rolesQuery.data ?? [];
  const catalog = catalogQuery.data ?? null;
  const editorOpen = creating || editing !== null;

  return (
    <SectionPageView
      title={t('sections.roles.title')}
      description={t('sections.roles.description')}
      wide
      actions={
        canManage ? (
          <TeamRolesToolbar
            teamId={teamId}
            roles={roles}
            catalog={catalog}
            onCreate={() => setCreating(true)}
          />
        ) : undefined
      }
    >
      {!team ? (
        <ListSkeleton rows={4} rowClassName="h-12" />
      ) : !canManage ? (
        <p className="text-sm text-muted-foreground">{t('roles.ownerOnly')}</p>
      ) : (
        <TeamRolesList
          teamId={teamId}
          roles={roles}
          pending={rolesQuery.isPending}
          canEdit={catalog !== null}
          canDelete={team.role === 'owner'}
          onEdit={setEditing}
        />
      )}

      {editorOpen && catalog && (
        <RoleEditorPanel
          teamId={teamId}
          role={editing}
          catalog={catalog}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </SectionPageView>
  );
}
