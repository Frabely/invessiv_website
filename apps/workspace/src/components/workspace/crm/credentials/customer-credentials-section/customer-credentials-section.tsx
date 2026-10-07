"use client";

import { useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { credentialsApiService } from "@/client/crm/credentials-api-service";
import { CredentialListLoadStatus } from "@/common/constants/credentials/credential-list-load-status";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import type { CredentialsViewModel } from "@/common/contracts/crm/credentials/credentials-view-model";
import { groupCredentials } from "@/common/patterns/crm/credentials/credential-groups";
import { crmScopeRights as scopeRights } from "@/common/patterns/crm/crm-scope-rights";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import type { Locale } from "@/config/i18n";
import { useCredentialProjectFilter } from "@/hooks/workspace/crm/use-credential-project-filter";
import { useCustomerCredentials } from "@/hooks/workspace/crm/use-customer-credentials";
import { useDialogReturnFocus } from "@/hooks/workspace/use-dialog-return-focus";
import type { CrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CredentialDeleteDialog } from "../credential-delete-dialog/credential-delete-dialog";
import { CredentialFormDialog } from "../credential-form-dialog/credential-form-dialog";
import { CredentialGroup } from "../credential-group/credential-group";
import { CredentialProjectFilter } from "../credential-project-filter/credential-project-filter";
import { CredentialRow } from "../credential-row/credential-row";
import styles from "./customer-credentials-section.module.css";

type CustomerCredentialsSectionProps = {
  content: CrmCredentialsDictionary;
  customerId: string;
  locale: Locale;
  viewModel: CredentialsViewModel;
};

const CredentialOverlayKind = {
  Create: "create",
  Edit: "edit",
  Delete: "delete",
} as const;

type CredentialOverlay =
  | { kind: typeof CredentialOverlayKind.Create }
  | { kind: typeof CredentialOverlayKind.Edit; credential: CredentialDto }
  | { kind: typeof CredentialOverlayKind.Delete; credential: CredentialDto };

/**
 * The credentials of one customer, grouped by scope. The list is metadata loaded through the API;
 * a password or note reaches the browser only when its field asks for exactly that value.
 */
export function CustomerCredentialsSection({
  content,
  customerId,
  locale,
  viewModel,
}: CustomerCredentialsSectionProps) {
  const filter = useCredentialProjectFilter(viewModel.read.projectIds);
  const [revision, setRevision] = useState(0);
  const list = useCustomerCredentials(customerId, filter.projectId, revision);
  const [overlay, setOverlay] = useState<CredentialOverlay | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const focus = useDialogReturnFocus({
    dialogOpen: overlay !== null,
    ready: list.status !== CredentialListLoadStatus.Loading,
  });

  const { configured } = viewModel;
  const writeTargets = scopeRights.targets(viewModel.write, viewModel.projects);
  const canWrite = writeTargets.length > 0;
  const readableProjects = viewModel.projects.filter((project) =>
    viewModel.read.projectIds.includes(project.id),
  );
  const defaultTarget =
    filter.projectId !== undefined && writeTargets.includes(filter.projectId)
      ? filter.projectId
      : (writeTargets[0] ?? null);
  const isReady = list.status === CredentialListLoadStatus.Ready;
  const groups = groupCredentials(
    list.credentials,
    viewModel.projects,
    filter.projectId,
  );

  function open(next: CredentialOverlay) {
    focus.rememberTarget(
      next.kind === CredentialOverlayKind.Create
        ? next.kind
        : `${next.credential.id}:${next.kind}`,
    );
    setOverlay(next);
  }

  function close() {
    focus.restoreAfterReload();
    setOverlay(null);
    list.reload();
  }

  function changed(message: string, credential: CredentialDto) {
    setAnnouncement(formatMessage(message, { name: credential.title }));
    setRevision((current) => current + 1);
  }

  async function reveal(
    credential: CredentialDto,
    field: CredentialSecretField,
    intent: CredentialRevealIntent,
  ): Promise<CredentialRevealOutcome> {
    const result = await credentialsApiService.reveal(
      credential.id,
      field,
      intent,
    );
    if (!result.ok) return { ok: false, message: content.errors[result.code] };
    list.markRevealed(credential.id);
    return { ok: true, value: result.value };
  }

  const addButton = (
    <PrimaryCtaButton
      ref={focus.targetRef(CredentialOverlayKind.Create)}
      disabled={!configured}
      onClick={() => open({ kind: CredentialOverlayKind.Create })}
      type="button"
    >
      <span className={styles.actionIcon}>
        <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
      </span>
      {content.actions.add}
    </PrimaryCtaButton>
  );

  return (
    <CollapsibleSection
      toggleRef={focus.fallbackRef}
      action={canWrite ? addButton : null}
      after={
        <>
          <p aria-live="polite" className="sr-only" role="status">
            {announcement}
          </p>
          {overlay?.kind === CredentialOverlayKind.Create ||
          overlay?.kind === CredentialOverlayKind.Edit ? (
            <CredentialFormDialog
              content={content}
              credential={
                overlay.kind === CredentialOverlayKind.Edit
                  ? overlay.credential
                  : undefined
              }
              customerId={customerId}
              defaultTarget={defaultTarget}
              key={
                overlay.kind === CredentialOverlayKind.Edit
                  ? overlay.credential.id
                  : CredentialOverlayKind.Create
              }
              onCloseAction={close}
              onSavedAction={(credential, created) =>
                changed(
                  created
                    ? content.announcements.created
                    : content.announcements.saved,
                  credential,
                )
              }
              projects={viewModel.projects}
              targets={writeTargets}
            />
          ) : null}
          {overlay?.kind === CredentialOverlayKind.Delete ? (
            <CredentialDeleteDialog
              content={content}
              credential={overlay.credential}
              key={overlay.credential.id}
              onChangedAction={list.replace}
              onCloseAction={close}
              onDeletedAction={(credential) =>
                changed(content.announcements.deleted, credential)
              }
            />
          ) : null}
        </>
      }
      count={
        isReady
          ? list.credentials.length === 1
            ? content.section.countOne
            : formatMessage(content.section.count, {
                count: list.credentials.length,
              })
          : undefined
      }
      labelCollapse={content.section.collapseLabel}
      labelExpand={content.section.expandLabel}
      title={content.section.title}
    >
      <div className={styles.body}>
        {configured ? null : (
          <div className={styles.notice} role="note">
            <p className={styles.noticeTitle}>{content.notConfigured.title}</p>
            <p className={styles.noticeText}>
              {content.notConfigured.description}
            </p>
          </div>
        )}
        {readableProjects.length > 0 ? (
          <CredentialProjectFilter
            content={content.filter}
            customerWide={viewModel.read.customerWide}
            onChangeAction={filter.setProjectId}
            projectId={filter.projectId}
            projects={readableProjects}
          />
        ) : null}
        {list.status === CredentialListLoadStatus.Loading ? (
          <p className={styles.status} role="status">
            {content.section.loading}
          </p>
        ) : null}
        {list.status === CredentialListLoadStatus.Error ? (
          <div className={styles.loadError} role="alert">
            <p>{content.section.loadError}</p>
            <ButtonControl onClick={list.reload} type="button" variant="ghost">
              {content.section.retry}
            </ButtonControl>
          </div>
        ) : null}
        {isReady && list.credentials.length === 0 ? (
          filter.projectId === undefined ? (
            <SectionEmptyState
              description={
                canWrite
                  ? content.empty.description
                  : content.empty.readOnlyDescription
              }
              title={content.empty.title}
            />
          ) : (
            <SectionEmptyState
              action={
                <ButtonControl
                  onClick={() => filter.setProjectId(undefined)}
                  type="button"
                  variant="ghost"
                >
                  {content.empty.showAll}
                </ButtonControl>
              }
              description={content.empty.filteredDescription}
              title={
                filter.projectId === null
                  ? content.empty.customerWideTitle
                  : content.empty.filteredTitle
              }
            />
          )
        ) : null}
        {isReady && list.credentials.length > 0
          ? groups.map((group) => (
              <CredentialGroup
                emptyText={content.groups.projectEmpty}
                hint={
                  group.projectId === null
                    ? content.groups.customerWideHint
                    : undefined
                }
                key={group.projectId ?? "customer-wide"}
                title={
                  group.projectId === null
                    ? content.groups.customerWide
                    : (viewModel.projects.find(
                        (project) => project.id === group.projectId,
                      )?.title ?? group.projectId)
                }
              >
                {group.credentials.map((credential) => (
                  <CredentialRow
                    editButtonRef={focus.targetRef(
                      `${credential.id}:${CredentialOverlayKind.Edit}`,
                    )}
                    deleteButtonRef={focus.targetRef(
                      `${credential.id}:${CredentialOverlayKind.Delete}`,
                    )}
                    configured={configured}
                    content={content}
                    credential={credential}
                    key={credential.id}
                    locale={locale}
                    onDeleteAction={(entry) =>
                      open({
                        kind: CredentialOverlayKind.Delete,
                        credential: entry,
                      })
                    }
                    onEditAction={(entry) =>
                      open({
                        kind: CredentialOverlayKind.Edit,
                        credential: entry,
                      })
                    }
                    onRevealAction={reveal}
                  />
                ))}
              </CredentialGroup>
            ))
          : null}
      </div>
    </CollapsibleSection>
  );
}
