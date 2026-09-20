"use client";

import type { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { ButtonControl } from "@invessiv/ui";
import { accessApiService } from "@/client/access/access-api-service";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { resolveRoleLabel } from "@/lib/workspace/access/role-label";
import styles from "./customer-access-assignment-row.module.css";

type CustomerAccessAssignmentRowProps = {
  assignment: AccessScopeEntryDto;
  content: CrmAccessDictionary;
  member: WorkspaceMemberDto;
  permissionsContent: SettingsPermissionsDictionary;
  scopeLabel: string;
};

export function CustomerAccessAssignmentRow({
  assignment,
  content,
  member,
  permissionsContent,
  scopeLabel,
}: CustomerAccessAssignmentRowProps) {
  const mutation = useVersionedMutation<
    WorkspaceMemberDto,
    WorkspaceMemberErrorCode
  >(member, () => undefined);
  const roleLabel = resolveRoleLabel(
    { name: assignment.roleName, systemKey: assignment.roleSystemKey },
    permissionsContent,
  );

  async function removeAssignment() {
    await mutation.submit((current) =>
      accessApiService.revokeAccessScope(member.id, assignment.id, {
        version: current.version,
      }),
    );
  }

  return (
    <li className={styles.row}>
      <span className={styles.member}>{assignment.memberDisplayName}</span>
      <span
        className={styles.role}
        data-active={assignment.roleActive ? "true" : "false"}
      >
        {assignment.roleActive
          ? roleLabel
          : formatMessage(content.section.inactiveRole, { role: roleLabel })}
      </span>
      <ButtonControl
        aria-label={formatMessage(content.section.removeLabel, {
          member: assignment.memberDisplayName,
          role: roleLabel,
          scope: scopeLabel,
        })}
        disabled={mutation.isSubmitting}
        onClick={() => void removeAssignment()}
        type="button"
        variant="ghost"
      >
        {content.section.remove}
      </ButtonControl>
      {mutation.hasConflict ? (
        <p className={styles.message} data-tone="conflict" role="alert">
          {content.section.removeConflict}
        </p>
      ) : null}
      {mutation.errorCode ? (
        <p className={styles.message} data-tone="error" role="alert">
          {content.errors[mutation.errorCode as keyof typeof content.errors] ??
            content.errors.INTERNAL}
        </p>
      ) : null}
    </li>
  );
}
