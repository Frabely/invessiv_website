"use client";

import { type ReactNode, useId, useState } from "react";
import {
  faKey,
  faPlus,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  Dialog,
  DialogSize,
  EmptyState,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { portalCredentialsApiService } from "@/client/portal/portal-credentials-api-service";
import { CredentialListLoadStatus } from "@/common/constants/credentials/credential-list-load-status";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { groupCredentials } from "@/common/patterns/crm/credentials/credential-groups";
import { portalCredentialErrorText } from "@/common/patterns/portal/portal-credential-error-text";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import type { Locale } from "@/config/i18n";
import { usePortalCredentials } from "@/hooks/portal/use-portal-credentials";
import { useDialogReturnFocus } from "@/hooks/shared/use-dialog-return-focus";
import type { PortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { PortalCredentialFormDialog } from "../portal-credential-form-dialog/portal-credential-form-dialog";
import { PortalCredentialRow } from "../portal-credential-row/portal-credential-row";
import styles from "./portal-credentials-dialog.module.css";

export type PortalCredentialsDialogProps = {
  /** CRM link for the owner view's notice; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalCredentialsDictionary;
  customerId: string;
  locale: Locale;
  /** True when the widget's "add credential" opened the dialog: the form comes first and closing it closes everything. */
  startWithCreate: boolean;
  onCloseAction: () => void;
  /** Announces a saved entry in the dashboard's live region. */
  onSavedAction: (message: string) => void;
};

const OverlayKind = {
  Create: "create",
  Edit: "edit",
} as const;

type Overlay =
  | { kind: typeof OverlayKind.Create }
  | { kind: typeof OverlayKind.Edit; credential: PortalCredentialDto };

/**
 * The company's credentials as a dialog of the dashboard, like the section in the CRM cockpit:
 * there is no page of its own. The list is loaded when the dialog opens, never with the
 * dashboard, and a password or note reaches the browser only when its field asks for exactly
 * that value. Adding and changing swap the list for the shared form instead of stacking dialogs.
 */
export function PortalCredentialsDialog({
  cockpitHref,
  content,
  customerId,
  locale,
  startWithCreate,
  onCloseAction,
  onSavedAction,
}: PortalCredentialsDialogProps) {
  const ownerNoticeId = useId();
  const [revision, setRevision] = useState(0);
  const { list, status, reload, isRefreshing } = usePortalCredentials(
    customerId,
    revision,
  );
  const [overlay, setOverlay] = useState<Overlay | null>(
    startWithCreate ? { kind: OverlayKind.Create } : null,
  );
  // The direct way in ends where it began: on the dashboard, not on a list nobody asked for.
  const [directCreate, setDirectCreate] = useState(startWithCreate);
  const focus = useDialogReturnFocus({
    dialogOpen: overlay !== null,
    ready: !isRefreshing && status !== CredentialListLoadStatus.Loading,
  });

  function openForm(next: Overlay) {
    focus.rememberTarget(
      next.kind === OverlayKind.Edit ? next.credential.id : OverlayKind.Create,
    );
    setDirectCreate(false);
    setOverlay(next);
  }

  async function reveal(
    credential: PortalCredentialDto,
    field: CredentialSecretField,
    intent: CredentialRevealIntent,
  ): Promise<CredentialRevealOutcome> {
    const result = await portalCredentialsApiService.reveal(
      customerId,
      credential.id,
      field,
      intent,
    );
    return result.ok
      ? { ok: true, value: result.value }
      : {
          ok: false,
          message: portalCredentialErrorText(result.code, content.errors),
        };
  }

  function closeForm() {
    if (directCreate) {
      onCloseAction();
      return;
    }
    focus.restoreAfterReload();
    setOverlay(null);
  }

  if (list && overlay && (list.capabilities.canWrite || !directCreate)) {
    return (
      <PortalCredentialFormDialog
        canReveal={list.capabilities.canReveal}
        content={content}
        credential={
          overlay.kind === OverlayKind.Edit ? overlay.credential : undefined
        }
        customerId={customerId}
        key={
          overlay.kind === OverlayKind.Edit
            ? overlay.credential.id
            : overlay.kind
        }
        onCloseAction={closeForm}
        onSavedAction={(title, created) => {
          onSavedAction(
            formatMessage(
              created
                ? content.announcements.created
                : content.announcements.saved,
              { name: title },
            ),
          );
          setRevision((current) => current + 1);
        }}
        projects={list.projects}
      />
    );
  }

  let body: ReactNode;
  if (!list) {
    body =
      status === CredentialListLoadStatus.Error ? (
        <div className={styles.loadError} role="alert">
          <p>{content.dialog.loadError}</p>
          <ButtonControl onClick={reload} type="button" variant="ghost">
            {content.dialog.retry}
          </ButtonControl>
        </div>
      ) : (
        <p className={styles.status} role="status">
          {content.dialog.loading}
        </p>
      );
  } else {
    const { canReveal, canWrite } = list.capabilities;
    const { configured, credentials, projects } = list;
    body = (
      <>
        <p className={styles.trust}>
          <FontAwesomeIcon aria-hidden="true" icon={faShieldHalved} />
          <span>{content.dialog.trust}</span>
        </p>
        {configured ? null : (
          <div className={styles.notice} role="note">
            <p className={styles.noticeTitle}>{content.notConfigured.title}</p>
            <p className={styles.noticeText}>
              {content.notConfigured.description}
            </p>
          </div>
        )}
        {canWrite ? (
          <div className={styles.actions}>
            <PrimaryCtaButton
              ref={focus.targetRef(OverlayKind.Create)}
              disabled={!configured}
              onClick={() => openForm({ kind: OverlayKind.Create })}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
              {content.actions.add}
            </PrimaryCtaButton>
          </div>
        ) : cockpitHref ? (
          <PortalOwnerNotice
            cockpitHref={cockpitHref}
            hint={content.owner.hint}
            id={ownerNoticeId}
            linkLabel={content.owner.link}
          />
        ) : null}
        {credentials.length === 0 ? (
          <EmptyState
            alignment="start"
            description={
              canWrite
                ? content.empty.description
                : content.empty.readOnlyDescription
            }
            icon={<FontAwesomeIcon icon={faKey} />}
            title={content.empty.title}
          />
        ) : (
          <div className={styles.groups}>
            {groupCredentials(credentials, projects, undefined).map((group) => (
              <CredentialGroupSection
                hint={
                  group.projectId === null
                    ? content.groups.generalHint
                    : undefined
                }
                key={group.projectId ?? "general"}
                title={
                  group.projectId === null
                    ? content.groups.general
                    : (projects.find(
                        (project) => project.id === group.projectId,
                      )?.title ?? "")
                }
              >
                {group.credentials.map((credential) => (
                  <PortalCredentialRow
                    canReveal={canReveal}
                    canWrite={canWrite}
                    configured={configured}
                    content={content}
                    credential={credential}
                    editButtonRef={focus.targetRef(credential.id)}
                    key={credential.id}
                    locale={locale}
                    onEditAction={(entry) =>
                      openForm({ kind: OverlayKind.Edit, credential: entry })
                    }
                    onRevealAction={reveal}
                  />
                ))}
              </CredentialGroupSection>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <Dialog
      closeButtonRef={focus.fallbackRef}
      closeLabel={content.dialog.close}
      description={content.dialog.intro}
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      title={content.dialog.title}
    >
      <div className={styles.body}>{body}</div>
    </Dialog>
  );
}

type CredentialGroupSectionProps = {
  children: ReactNode;
  hint?: string;
  title: string;
};

function CredentialGroupSection({
  children,
  hint,
  title,
}: CredentialGroupSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={styles.group}>
      <div className={styles.groupHead}>
        <h3 className={styles.groupTitle} id={headingId}>
          {title}
        </h3>
        {hint ? <p className={styles.groupHint}>{hint}</p> : null}
      </div>
      <ul className={styles.list}>{children}</ul>
    </section>
  );
}
