"use client";

import { useRouter } from "next/navigation";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { accessApiService } from "@/client/access/access-api-service";
import { WorkspaceDialogSize } from "@/common/constants/ui/workspace-dialog-sizes";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { WorkspaceDialog } from "@/components/workspace/shared/dialog/workspace-dialog/workspace-dialog";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { SettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./owner-change-dialog.module.css";

type OwnerChangeDialogProps = {
  content: SettingsMembersDictionary;
  member: WorkspaceMemberDto;
  onCloseAction: () => void;
};

export function OwnerChangeDialog({
  content,
  member,
  onCloseAction,
}: OwnerChangeDialogProps) {
  const router = useRouter();
  const text = content.ownerDialog;
  const mutation = useVersionedMutation<
    WorkspaceMemberDto,
    WorkspaceMemberErrorCode
  >(member, onCloseAction);
  // The intent is fixed when the dialog opens: a conflict must never turn a revoke into a grant.
  const grants = !member.isOwner;
  const name = member.displayName;
  const alreadyDone =
    (mutation.hasConflict && mutation.current.isOwner === grants) ||
    mutation.errorCode ===
      (grants
        ? WorkspaceMemberErrorCode.AlreadyOwner
        : WorkspaceMemberErrorCode.NotOwner);

  function handleClose() {
    // After a failed attempt the member list behind the dialog is stale.
    if (mutation.hasConflict || mutation.errorCode) {
      router.refresh();
    }
    onCloseAction();
  }

  async function handleConfirm() {
    await mutation.submit((current) =>
      grants
        ? accessApiService.grantOwner(member.id, { version: current.version })
        : accessApiService.revokeOwner(member.id, { version: current.version }),
    );
  }

  const message = alreadyDone
    ? formatMessage(grants ? text.alreadyGranted : text.alreadyRevoked, {
        name,
      })
    : mutation.hasConflict
      ? text.conflict
      : mutation.errorCode
        ? content.errors[mutation.errorCode]
        : null;
  const tone = alreadyDone
    ? "info"
    : mutation.hasConflict
      ? "conflict"
      : "error";

  return (
    <WorkspaceDialog
      busy={mutation.isSubmitting}
      closeLabel={text.close}
      description={grants ? text.grantDescription : text.revokeDescription}
      footer={
        alreadyDone ? (
          <PrimaryCtaButton onClick={handleClose} type="button">
            {text.done}
          </PrimaryCtaButton>
        ) : (
          <>
            <ButtonControl
              disabled={mutation.isSubmitting}
              onClick={handleClose}
              type="button"
              variant="ghost"
            >
              {text.cancel}
            </ButtonControl>
            <PrimaryCtaButton
              disabled={mutation.isSubmitting}
              onClick={handleConfirm}
              type="button"
            >
              {mutation.isSubmitting
                ? text.submitting
                : grants
                  ? text.grantSubmit
                  : text.revokeSubmit}
            </PrimaryCtaButton>
          </>
        )
      }
      onCloseAction={handleClose}
      size={WorkspaceDialogSize.Narrow}
      title={formatMessage(grants ? text.grantTitle : text.revokeTitle, {
        name,
      })}
    >
      {message ? (
        <p
          className={styles.message}
          data-tone={tone}
          role={alreadyDone ? "status" : "alert"}
        >
          {message}
        </p>
      ) : null}
    </WorkspaceDialog>
  );
}
