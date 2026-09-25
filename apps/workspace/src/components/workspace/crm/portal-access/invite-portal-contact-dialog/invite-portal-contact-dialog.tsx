"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { portalAccessApiService } from "@/client/crm/portal-access-api-service";
import type { Locale } from "@/config/i18n";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getPortalShellDictionary } from "@/i18n/dictionaries/portal";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { PORTAL_NAV_ITEMS } from "@/common/constants/portal/portal-nav-items";
import { portalAccessErrorMessage } from "@/common/patterns/crm/portal-access-error-message";
import { PortalInviteStepContent } from "../portal-invite-step-content/portal-invite-step-content";
import styles from "./invite-portal-contact-dialog.module.css";

export interface PortalInviteDialogProps {
  access: PortalAccessDto;
  content: CrmPortalAccessDictionary;
  permissionsContent: SettingsPermissionsDictionary;
  initialAssignmentId: string;
  locale: Locale;
  onCloseAction: () => void;
}

export function PortalInviteDialog({
  access,
  content,
  permissionsContent,
  initialAssignmentId,
  locale,
  onCloseAction,
}: PortalInviteDialogProps) {
  const router = useRouter();
  const baseId = useId();
  const [assignmentId, setAssignmentId] = useState(initialAssignmentId);
  const defaultRoleId = access.roles.find(
    (role) => role.systemKey === SystemRoleKey.PortalStandard && role.active,
  )?.id;
  const [roleIds, setRoleIds] = useState<string[]>(
    defaultRoleId ? [defaultRoleId] : [],
  );
  const [preview, setPreview] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(
    access.previewConfirmedAt !== null,
  );
  const [customerVersion, setCustomerVersion] = useState(
    access.customerVersion,
  );
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chosenContact = access.contacts.find(
    (contact) => contact.assignmentId === assignmentId,
  );
  const chosenRoles = access.roles.filter(
    (role) => role.active && roleIds.includes(role.id),
  );
  const portalLabels = getPortalShellDictionary(locale).nav.items;
  const permittedAreas = PORTAL_NAV_ITEMS.filter((item) =>
    chosenRoles.some((role) =>
      role.permissions.includes(item.requiredPermission),
    ),
  ).map((item) => portalLabels[item.labelKey]);

  function toggleRole(roleId: string) {
    setRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  }

  async function confirmPreviewIfNeeded(): Promise<boolean> {
    if (previewConfirmed) return true;

    const confirmed = await portalAccessApiService.confirmPreview(
      access.customerId,
      {
        version: customerVersion,
      },
    );
    if (!confirmed.ok) {
      if (confirmed.code === ConcurrencyErrorCode.VersionConflict) {
        // Adopts the fresh version on a conflict so the input isn't lost — the user
        // simply retries with the same choices instead of closing and reopening the dialog.
        setCustomerVersion(confirmed.current.version);
      }
      setError(portalAccessErrorMessage(confirmed.code, content));
      return false;
    }
    setPreviewConfirmed(true);
    return true;
  }

  async function submit() {
    if (!chosenContact) {
      setError(content.errors.contact);
      return;
    }
    if (chosenRoles.length === 0) {
      setError(content.errors.roles);
      return;
    }
    if (!previewConfirmed && !preview) {
      setPreview(true);
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    if (!(await confirmPreviewIfNeeded())) {
      setBusy(false);
      return;
    }
    const result = await portalAccessApiService.invite(
      access.customerId,
      locale,
      {
        assignmentId,
        roleIds,
        // Every invite opts in by default; the choice returns once outbox delivery exists (Ordner 20c).
        emailNotificationsEnabled: true,
      },
    );
    setBusy(false);
    if (!result.ok) {
      setError(portalAccessErrorMessage(result.code, content));
      return;
    }
    setInviteUrl(result.value.inviteUrl);
    router.refresh();
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setError(content.errors.copy);
    }
  }

  const title = inviteUrl
    ? content.dialog.linkTitle
    : preview
      ? content.dialog.previewTitle
      : content.dialog.title;
  const primaryActionLabel = preview
    ? content.dialog.confirm
    : previewConfirmed
      ? content.dialog.send
      : content.dialog.continue;
  return (
    <Dialog
      title={title}
      closeLabel={content.dialog.close}
      size={DialogSize.Narrow}
      description={preview ? content.dialog.previewIntro : undefined}
      onCloseAction={onCloseAction}
      footer={
        inviteUrl ? (
          <ButtonControl type="button" onClick={onCloseAction}>
            {content.dialog.close}
          </ButtonControl>
        ) : (
          <>
            <ButtonControl
              type="button"
              variant="ghost"
              onClick={onCloseAction}
            >
              {content.dialog.cancel}
            </ButtonControl>
            <ButtonControl
              type="button"
              disabled={busy}
              onClick={() => void submit()}
            >
              {primaryActionLabel}
            </ButtonControl>
          </>
        )
      }
    >
      <PortalInviteStepContent
        access={access}
        content={content}
        permissionsContent={permissionsContent}
        baseId={baseId}
        assignmentId={assignmentId}
        roleIds={roleIds}
        contactName={chosenContact?.displayName ?? ""}
        permittedAreas={permittedAreas}
        preview={preview}
        inviteUrl={inviteUrl}
        copied={copied}
        onAssignmentChange={setAssignmentId}
        onRoleToggle={toggleRole}
        onCopy={() => void copyInviteLink()}
      />
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}
