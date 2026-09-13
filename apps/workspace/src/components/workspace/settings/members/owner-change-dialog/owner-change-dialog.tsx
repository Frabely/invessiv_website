"use client";

import type { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
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
  const text = content.ownerDialog;
  const mutation = useVersionedMutation<
    WorkspaceMemberDto,
    WorkspaceMemberErrorCode
  >(member, onCloseAction);
  // After a conflict the fresh state decides the direction, so a stale click never flips it back.
  const grants = !mutation.current.isOwner;
  const name = member.displayName;

  async function handleConfirm() {
    await mutation.submit((current) =>
      grants
        ? accessApiService.grantOwner(member.id, { version: current.version })
        : accessApiService.revokeOwner(member.id, { version: current.version }),
    );
  }

  const message = mutation.hasConflict
    ? text.conflict
    : mutation.errorCode
      ? content.errors[mutation.errorCode]
      : null;

  return (
    <WorkspaceDialog
      busy={mutation.isSubmitting}
      closeLabel={text.close}
      description={grants ? text.grantDescription : text.revokeDescription}
      footer={
        <>
          <ButtonControl
            disabled={mutation.isSubmitting}
            onClick={onCloseAction}
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
      }
      onCloseAction={onCloseAction}
      size={WorkspaceDialogSize.Narrow}
      title={formatMessage(grants ? text.grantTitle : text.revokeTitle, {
        name,
      })}
    >
      {message ? (
        <p
          className={styles.message}
          data-tone={mutation.hasConflict ? "conflict" : "error"}
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </WorkspaceDialog>
  );
}
