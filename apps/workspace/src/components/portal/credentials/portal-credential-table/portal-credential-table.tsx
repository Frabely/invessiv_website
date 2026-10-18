import type { Ref } from "react";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import type { PortalCredentialListDto } from "@invessiv/common/contracts/portal/portal-credential-list.dto";
import { DataTableLayout } from "@invessiv/ui";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { groupCredentials } from "@/common/patterns/crm/credentials/credential-groups";
import type { Locale } from "@/config/i18n";
import type { PortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { PortalCredentialTableRow } from "../portal-credential-table-row/portal-credential-table-row";
import styles from "./portal-credential-table.module.css";

export type PortalCredentialTableProps = {
  content: PortalCredentialsDictionary;
  /** Ref for the entry's "change" button, so focus can return to it after the form. */
  editButtonRefFor: (credentialId: string) => Ref<HTMLButtonElement>;
  list: PortalCredentialListDto;
  locale: Locale;
  onEditAction: (credential: PortalCredentialDto) => void;
  onRevealAction: (
    credential: PortalCredentialDto,
    field: CredentialSecretField,
    intent: CredentialRevealIntent,
  ) => Promise<CredentialRevealOutcome>;
};

/**
 * The released credentials in the shared table: the head stays put while the rows scroll, and on
 * a phone the rows become cards. Entries for all projects come first, then each project's own;
 * the project column only appears once an entry belongs to a project.
 */
export function PortalCredentialTable({
  content,
  editButtonRefFor,
  list,
  locale,
  onEditAction,
  onRevealAction,
}: PortalCredentialTableProps) {
  const { capabilities, configured, credentials, projects } = list;
  const { columns } = content.table;
  const groups = groupCredentials(credentials, projects, undefined);
  const showProject = groups.some((group) => group.projectId !== null);

  function projectLabel(projectId: string | null): string | null {
    if (!showProject) return null;
    if (projectId === null) return content.table.allProjects;
    return projects.find((project) => project.id === projectId)?.title ?? "";
  }

  return (
    <div className={styles.tableArea}>
      <DataTableLayout
        ariaLabel={content.table.label}
        caption={content.table.label}
        columns={[
          { header: columns.access, id: "access" },
          { header: columns.origin, id: "origin" },
          { header: columns.username, id: "username" },
          { header: columns.secret, id: "secret", width: 250 },
          ...(showProject ? [{ header: columns.project, id: "project" }] : []),
          { header: columns.changed, id: "changed" },
          {
            header: columns.actions,
            id: "actions",
            isVisuallyHidden: true,
          },
        ]}
        fillAvailableHeight
        responsiveMode="cards"
      >
        {groups.flatMap((group) =>
          group.credentials.map((credential) => (
            <PortalCredentialTableRow
              canReveal={capabilities.canReveal}
              canWrite={capabilities.canWrite}
              configured={configured}
              content={content}
              credential={credential}
              editButtonRef={editButtonRefFor(credential.id)}
              key={`${credential.id}:${credential.version}:${capabilities.canReveal}:${configured}`}
              locale={locale}
              projectLabel={projectLabel(group.projectId)}
              onEditAction={onEditAction}
              onRevealAction={onRevealAction}
            />
          )),
        )}
      </DataTableLayout>
    </div>
  );
}
