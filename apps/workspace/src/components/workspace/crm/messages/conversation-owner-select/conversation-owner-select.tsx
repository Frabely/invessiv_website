"use client";

import { useId } from "react";
import { CustomSelect } from "@invessiv/ui";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import { messagesApiService } from "@/client/crm/messages-api-service";
import type { ConversationOwnerAssignment } from "@/common/contracts/crm/conversation-owner-assignment";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmMessagesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./conversation-owner-select.module.css";

type ConversationOwnerSelectProps = {
  assignment: ConversationOwnerAssignment;
  candidates: readonly WorkspaceMemberOptionDto[];
  content: CrmMessagesDictionary["owner"];
  customerId: string;
  /** Shown as the current option when the owner is no longer a candidate (e.g. deactivated). */
  ownerDisplayName: string;
};

const noop = () => {};

/** Only rendered with `chat.write`; the server still validates the chosen member. */
export function ConversationOwnerSelect({
  assignment,
  candidates,
  content,
  customerId,
  ownerDisplayName,
}: ConversationOwnerSelectProps) {
  const selectId = useId();
  const statusId = useId();
  const { current, errorCode, hasConflict, isSubmitting, submit } =
    useVersionedMutation<ConversationOwnerAssignment, MessageErrorCode>(
      assignment,
      noop,
    );
  const options = candidates.some(
    (candidate) => candidate.id === current.ownerMemberId,
  )
    ? candidates
    : [
        { id: current.ownerMemberId, displayName: ownerDisplayName },
        ...candidates,
      ];

  function change(ownerMemberId: string) {
    if (ownerMemberId === current.ownerMemberId) return;
    void submit(async (latest) => {
      const result = await messagesApiService.updateOwner(customerId, {
        ownerMemberId,
        version: latest.version,
      });
      return result.ok ? { ok: true, current: result.assignment } : result;
    });
  }

  let status: string | null = null;
  if (isSubmitting) {
    status = content.saving;
  } else if (hasConflict) {
    status = content.conflict;
  } else if (errorCode === MessageErrorCode.ValidationError) {
    status = content.invalid;
  } else if (errorCode) {
    status = content.error;
  }

  return (
    <div className={styles.owner}>
      <label className={styles.label} htmlFor={selectId}>
        {content.label}
      </label>
      <CustomSelect
        describedBy={status ? statusId : undefined}
        disabled={isSubmitting}
        id={selectId}
        onChange={change}
        options={options.map((option) => ({
          value: option.id,
          label: option.displayName,
        }))}
        value={current.ownerMemberId}
      />
      <p
        aria-live="polite"
        className={styles.status}
        data-tone={errorCode || hasConflict ? "attention" : undefined}
        id={statusId}
      >
        {status}
      </p>
    </div>
  );
}
