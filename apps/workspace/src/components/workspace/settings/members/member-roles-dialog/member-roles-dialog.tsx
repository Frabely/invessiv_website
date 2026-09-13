"use client";

import { type SubmitEvent, useId, useState } from "react";

import type { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { unionRolePermissions } from "@invessiv/common/patterns/auth/union-role-permissions";
import { accessApiService } from "@/client/access/access-api-service";
import { WorkspaceDialogSize } from "@/common/constants/ui/workspace-dialog-sizes";
import {
  selectAssignableRoles,
  selectOwnerRoleIds,
} from "@/common/patterns/access/role-selection";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { WorkspaceDialog } from "@/components/workspace/shared/dialog/workspace-dialog/workspace-dialog";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type {
  SettingsMembersDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { PermissionSummary } from "../../shared/permission-summary/permission-summary";
import { RoleChecklist } from "../../shared/role-checklist/role-checklist";
import styles from "./member-roles-dialog.module.css";

type MemberRolesDialogProps = {
  content: SettingsMembersDictionary;
  member: WorkspaceMemberDto;
  onCloseAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
  roles: RoleDto[];
};

function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
}

export function MemberRolesDialog({
  content,
  member,
  onCloseAction,
  permissionsContent,
  roles,
}: MemberRolesDialogProps) {
  const formId = useId();
  const previewHeadingId = useId();
  const text = content.rolesDialog;
  const initialRoleIds = member.roles.map((role) => role.id);
  const [selectedRoleIds, setSelectedRoleIds] =
    useState<string[]>(initialRoleIds);
  const mutation = useVersionedMutation<
    WorkspaceMemberDto,
    WorkspaceMemberErrorCode
  >(member, onCloseAction);

  const choices = selectAssignableRoles(roles, initialRoleIds);
  const previewRoleIds = mutation.current.isOwner
    ? [...selectedRoleIds, ...selectOwnerRoleIds(roles)]
    : selectedRoleIds;
  const previewPermissions = unionRolePermissions(roles, previewRoleIds);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.submit((current) =>
      accessApiService.replaceMemberRoles(member.id, {
        roleIds: selectedRoleIds,
        version: current.version,
      }),
    );
  }

  return (
    <WorkspaceDialog
      busy={mutation.isSubmitting}
      closeLabel={text.close}
      description={text.description}
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
            form={formId}
            type="submit"
          >
            {mutation.isSubmitting ? text.submitting : text.submit}
          </PrimaryCtaButton>
        </>
      }
      onCloseAction={onCloseAction}
      size={WorkspaceDialogSize.Wide}
      title={formatMessage(text.title, { name: member.displayName })}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles.columns}>
          <div className={styles.column}>
            <RoleChecklist
              inactiveTemplate={content.list.inactiveRole}
              legend={text.rolesLabel}
              onToggleAction={(roleId) =>
                setSelectedRoleIds((current) => toggleId(current, roleId))
              }
              permissionsContent={permissionsContent}
              roles={choices}
              selectedRoleIds={selectedRoleIds}
            />
            {mutation.current.isOwner ? (
              <p className={styles.note}>{text.ownerNote}</p>
            ) : null}
          </div>

          <section
            aria-labelledby={previewHeadingId}
            aria-live="polite"
            className={styles.preview}
          >
            <h3 className={styles.previewHeading} id={previewHeadingId}>
              {formatMessage(text.previewHeading, {
                name: member.displayName,
              })}
            </h3>
            <PermissionSummary
              content={permissionsContent}
              emptyLabel={text.previewEmpty}
              permissions={previewPermissions}
            />
          </section>
        </div>

        {mutation.hasConflict ? (
          <p className={styles.conflict} role="alert">
            {text.conflict}
          </p>
        ) : null}
        {mutation.errorCode ? (
          <p className={styles.error} role="alert">
            {content.errors[mutation.errorCode]}
          </p>
        ) : null}
      </form>
    </WorkspaceDialog>
  );
}
