"use client";

import { type ReactNode, useId, useState } from "react";
import { faKey, faPlus } from "@fortawesome/free-solid-svg-icons";
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
import { portalCredentialErrorText } from "@/common/patterns/portal/portal-credential-error-text";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import type { Locale } from "@/config/i18n";
import { usePortalCredentials } from "@/hooks/portal/use-portal-credentials";
import { useDialogReturnFocus } from "@/hooks/shared/use-dialog-return-focus";
import type { PortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { PortalCredentialFormDialog } from "../portal-credential-form-dialog/portal-credential-form-dialog";
import { PortalCredentialTable } from "../portal-credential-table/portal-credential-table";
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
  let footer: ReactNode = null;
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
    const { canWrite } = list.capabilities;
    const { configured, credentials } = list;
    if (canWrite)
      footer = (
        <PrimaryCtaButton
          ref={focus.targetRef(OverlayKind.Create)}
          disabled={!configured}
          onClick={() => openForm({ kind: OverlayKind.Create })}
          type="button"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          {content.actions.add}
        </PrimaryCtaButton>
      );
    body = (
      <>
        {configured ? null : (
          <div className={styles.notice} role="note">
            <p className={styles.noticeTitle}>{content.notConfigured.title}</p>
            <p className={styles.noticeText}>
              {content.notConfigured.description}
            </p>
          </div>
        )}
        {!canWrite && cockpitHref ? (
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
            icon={faKey}
            title={content.empty.title}
          />
        ) : (
          <PortalCredentialTable
            content={content}
            editButtonRefFor={focus.targetRef}
            list={list}
            locale={locale}
            onEditAction={(entry) =>
              openForm({ kind: OverlayKind.Edit, credential: entry })
            }
            onRevealAction={reveal}
          />
        )}
      </>
    );
  }

  return (
    <Dialog
      closeButtonRef={focus.fallbackRef}
      closeLabel={content.dialog.close}
      description={content.dialog.intro}
      footer={footer}
      onCloseAction={onCloseAction}
      size={DialogSize.Large}
      title={content.dialog.title}
    >
      <div className={styles.body}>{body}</div>
    </Dialog>
  );
}
