"use client";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { accessApiService } from "@/client/access/access-api-service";
import { DialogMessageRole } from "@/common/constants/ui/dialog-message-roles";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
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
    ? DialogMessageTone.Info
    : mutation.hasConflict
      ? DialogMessageTone.Conflict
      : DialogMessageTone.Error;

  return (
    <WorkspaceDialog
      busy={mutation.isSubmitting}
      closeLabel={text.close}
      description={grants ? text.grantDescription : text.revokeDescription}
      footer={
        alreadyDone ? (
          <PrimaryCtaButton onClick={mutation.close} type="button">
            {text.done}
          </PrimaryCtaButton>
        ) : (
          <>
            <ButtonControl
              disabled={mutation.isSubmitting}
              onClick={mutation.close}
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
      onCloseAction={mutation.close}
      size={WorkspaceDialogSize.Narrow}
      title={formatMessage(grants ? text.grantTitle : text.revokeTitle, {
        name,
      })}
    >
      {message ? (
        <p
          className={styles.message}
          data-tone={tone}
          role={
            alreadyDone ? DialogMessageRole.Status : DialogMessageRole.Alert
          }
        >
          {message}
        </p>
      ) : null}
    </WorkspaceDialog>
  );
}
