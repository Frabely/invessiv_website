"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import type { OwnershipResponsibilityCountsDto } from "@invessiv/common/contracts/auth/ownership-responsibility-counts.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { accessApiService } from "@/client/access/access-api-service";
import { DialogMessageRole } from "@/common/constants/ui/dialog-message-roles";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import {
  ButtonControl,
  Dialog,
  DialogSize,
  PrimaryCtaButton,
} from "@invessiv/ui";
import type { SettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./member-status-dialog.module.css";

type MemberStatusDialogProps = {
  content: SettingsMembersDictionary;
  member: WorkspaceMemberDto;
  onCloseAction: () => void;
};

export function MemberStatusDialog({
  content,
  member,
  onCloseAction,
}: MemberStatusDialogProps) {
  const router = useRouter();
  const text = content.statusDialog;
  const desiredActive = !member.active;
  const [current, setCurrent] = useState(member);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<WorkspaceMemberErrorCode | null>(
    null,
  );
  const [hasConflict, setHasConflict] = useState(false);
  const [responsibilityCounts, setResponsibilityCounts] =
    useState<OwnershipResponsibilityCountsDto | null>(null);
  const alreadyDone =
    current.active === desiredActive ||
    errorCode ===
      (desiredActive
        ? WorkspaceMemberErrorCode.MemberAlreadyActive
        : WorkspaceMemberErrorCode.MemberAlreadyInactive);

  function close() {
    if (hasConflict || errorCode) {
      router.refresh();
    }
    onCloseAction();
  }

  async function confirm() {
    setIsSubmitting(true);
    setErrorCode(null);
    setHasConflict(false);
    setResponsibilityCounts(null);
    const result = await accessApiService.updateMemberStatus(member.id, {
      active: desiredActive,
      version: current.version,
    });
    if (result.ok) {
      router.refresh();
      onCloseAction();
      return;
    }
    setIsSubmitting(false);
    if (result.code === ConcurrencyErrorCode.VersionConflict) {
      setCurrent(result.current);
      setHasConflict(true);
      return;
    }
    setErrorCode(result.code);
    setResponsibilityCounts(result.responsibilityCounts ?? null);
  }

  const customerResponsibilityCount =
    responsibilityCounts?.[OwnableEntity.Customer] ?? 0;
  const taskResponsibilityCount =
    responsibilityCounts?.[OwnableEntity.Task] ?? 0;
  const hasOpenResponsibilities =
    customerResponsibilityCount > 0 || taskResponsibilityCount > 0;
  const message = alreadyDone
    ? formatMessage(
        desiredActive ? text.alreadyActivated : text.alreadyDeactivated,
        { name: member.displayName },
      )
    : hasOpenResponsibilities
      ? [
          customerResponsibilityCount > 0
            ? formatMessage(text.responsibilities, {
                count: customerResponsibilityCount,
              })
            : null,
          taskResponsibilityCount > 0
            ? formatMessage(text.openTasks, {
                count: taskResponsibilityCount,
              })
            : null,
        ]
          .filter((entry): entry is string => entry !== null)
          .join(" ")
      : hasConflict
        ? text.conflict
        : errorCode
          ? content.errors[errorCode]
          : null;
  const tone = alreadyDone
    ? DialogMessageTone.Info
    : hasConflict
      ? DialogMessageTone.Conflict
      : DialogMessageTone.Error;

  return (
    <Dialog
      busy={isSubmitting}
      closeLabel={text.close}
      description={
        desiredActive ? text.activateDescription : text.deactivateDescription
      }
      footer={
        alreadyDone ? (
          <PrimaryCtaButton onClick={close} type="button">
            {text.done}
          </PrimaryCtaButton>
        ) : (
          <>
            <ButtonControl
              disabled={isSubmitting}
              onClick={close}
              type="button"
              variant="ghost"
            >
              {text.cancel}
            </ButtonControl>
            <PrimaryCtaButton
              disabled={isSubmitting || hasOpenResponsibilities}
              onClick={confirm}
              type="button"
            >
              {isSubmitting
                ? text.submitting
                : desiredActive
                  ? text.activateSubmit
                  : text.deactivateSubmit}
            </PrimaryCtaButton>
          </>
        )
      }
      onCloseAction={close}
      size={DialogSize.Narrow}
      title={formatMessage(
        desiredActive ? text.activateTitle : text.deactivateTitle,
        { name: member.displayName },
      )}
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
    </Dialog>
  );
}
