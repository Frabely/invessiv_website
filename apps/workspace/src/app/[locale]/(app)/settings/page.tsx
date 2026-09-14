import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import {
  SETTINGS_TAB_QUERY_PARAM,
  SettingsTab,
} from "@/common/constants/access/settings-tabs";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { resolveSettingsTab } from "@/common/patterns/access/settings-tab";
import { MembersList } from "@/components/workspace/settings/members/members-list/members-list";
import { RolesList } from "@/components/workspace/settings/roles/roles-list/roles-list";
import { SettingsHeader } from "@/components/workspace/settings/shell/settings-header/settings-header";
import { WorkspacePageShell } from "@/components/workspace/workspace-page-shell/workspace-page-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getSettingsMembersDictionary,
  getSettingsMetaDictionary,
  getSettingsPermissionsDictionary,
  getSettingsRolesDictionary,
  getSettingsShellDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { requireWorkspaceArea } from "@/lib/auth/permissions";
import { workspaceAreaPathFor } from "@/lib/auth/routes";
import { syncWorkspaceMemberProfiles } from "@/server/workspace/access/command-handler/sync-workspace-member-profiles.command-handler";
import { listRoleAssignmentOptions } from "@/server/workspace/access/query-handler/list-role-assignment-options.query-handler";
import { listRoles } from "@/server/workspace/access/query-handler/list-roles.query-handler";
import { listWorkspaceMembers } from "@/server/workspace/access/query-handler/list-workspace-members.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getSettingsMetaDictionary(locale as Locale);
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function SettingsPage({
  params,
  searchParams,
}: SettingsPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Layouts are not re-rendered on search param changes, so the page gates its own data.
  const actor = await requireWorkspaceArea(locale, WorkspaceArea.Settings);
  const activeLocale = locale as Locale;
  const canManageRoles = can(actor, Permission.RolesManage);
  const activeTab = resolveSettingsTab(
    (await searchParams)[SETTINGS_TAB_QUERY_PARAM],
    canManageRoles,
  );
  const permissionsContent = getSettingsPermissionsDictionary(activeLocale);

  const membersTabData = () => {
    // Clerk is asked after the response, so a slow directory never delays the list.
    after(syncWorkspaceMemberProfiles);
    return Promise.all([listWorkspaceMembers(), listRoleAssignmentOptions()]);
  };
  const [members, assignmentRoles, managedRoles] =
    activeTab === SettingsTab.Members
      ? [...(await membersTabData()), []]
      : [[], [], await listRoles()];

  return (
    <WorkspacePageShell pageId="settings">
      <SettingsHeader
        activeTab={activeTab}
        basePath={workspaceAreaPathFor(activeLocale, WorkspaceArea.Settings)}
        canManageRoles={canManageRoles}
        content={getSettingsShellDictionary(activeLocale)}
      />
      {activeTab === SettingsTab.Roles ? (
        <RolesList
          content={getSettingsRolesDictionary(activeLocale)}
          permissionsContent={permissionsContent}
          roles={managedRoles}
        />
      ) : (
        <MembersList
          content={getSettingsMembersDictionary(activeLocale)}
          currentMemberId={actor.workspaceMemberId}
          members={members}
          permissionsContent={permissionsContent}
          roles={assignmentRoles}
        />
      )}
    </WorkspacePageShell>
  );
}
