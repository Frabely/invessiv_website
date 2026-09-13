"use client";

import { type SubmitEvent, useId, useState } from "react";

import type { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import {
  type Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { accessApiService } from "@/client/access/access-api-service";
import { WorkspaceDialogSize } from "@/common/constants/ui/workspace-dialog-sizes";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormField } from "@/components/shared/form/form-field/form-field";
import { WorkspaceDialog } from "@/components/workspace/shared/dialog/workspace-dialog/workspace-dialog";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type {
  SettingsPermissionsDictionary,
  SettingsRolesDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import {
  resolveRoleDescription,
  resolveRoleLabel,
} from "@/lib/workspace/access/role-label";
import { PermissionPicker } from "../../shared/permission-picker/permission-picker";
import styles from "./role-form-dialog.module.css";

type RoleFormDialogProps = {
  content: SettingsRolesDictionary;
  onCloseAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
  /** Null creates a new custom role; a system role opens read-only. */
  role: RoleDto | null;
};

const ROLE_NAME_MAX_LENGTH = 80;
const ROLE_DESCRIPTION_MAX_LENGTH = 280;

export function RoleFormDialog({
  content,
  onCloseAction,
  permissionsContent,
  role,
}: RoleFormDialogProps) {
  const formId = useId();
  const activeId = useId();
  const text = content.dialog;
  const readOnly = role?.isSystem ?? false;
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [active, setActive] = useState(role?.active ?? true);
  const [permissions, setPermissions] = useState<Permission[]>(
    role?.permissions ?? [],
  );
  const [showValidation, setShowValidation] = useState(false);
  const mutation = useVersionedMutation<RoleDto | null, RoleErrorCode>(
    role,
    onCloseAction,
  );
  const nameError =
    showValidation && !name.trim() ? text.validation.nameRequired : undefined;

  function togglePermission(permission: Permission) {
    setPermissions((current) => {
      const next = new Set(current);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return PERMISSION_VALUES.filter((entry) => next.has(entry));
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    if (!name.trim()) {
      return;
    }

    const normalizedDescription = description.trim() || null;
    await mutation.submit((current) =>
      current
        ? accessApiService.updateRole(current.id, {
            name,
            description: normalizedDescription,
            active,
            permissions,
            version: current.version,
          })
        : accessApiService.createRole({
            name,
            description: normalizedDescription,
            permissions,
          }),
    );
  }

  if (readOnly && role) {
    const label = resolveRoleLabel(role, permissionsContent);
    const roleDescription = resolveRoleDescription(role, permissionsContent);
    return (
      <WorkspaceDialog
        closeLabel={text.close}
        description={text.viewDescription}
        footer={
          <ButtonControl onClick={onCloseAction} type="button" variant="ghost">
            {text.done}
          </ButtonControl>
        }
        onCloseAction={onCloseAction}
        size={WorkspaceDialogSize.Wide}
        title={formatMessage(text.viewTitle, { name: label })}
      >
        <div className={styles.form}>
          {roleDescription ? (
            <p className={styles.roleDescription}>{roleDescription}</p>
          ) : null}
          <PermissionPicker
            content={permissionsContent}
            legend={text.permissionsLabel}
            lockNonDelegable={false}
            readOnly
            selected={role.permissions}
          />
        </div>
      </WorkspaceDialog>
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
            {mutation.isSubmitting
              ? text.submitting
              : role
                ? text.submitEdit
                : text.submitCreate}
          </PrimaryCtaButton>
        </>
      }
      onCloseAction={onCloseAction}
      size={WorkspaceDialogSize.Wide}
      title={role ? text.editTitle : text.createTitle}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles.fields}>
          <FormField
            errorMessage={nameError}
            inputProps={{
              autoComplete: "off",
              maxLength: ROLE_NAME_MAX_LENGTH,
              name: "role-name",
              onChange: (event) => setName(event.target.value),
              placeholder: text.namePlaceholder,
              value: name,
            }}
            kind={FormFieldKind.Text}
            label={text.nameLabel}
            required
          />
          <FormField
            kind={FormFieldKind.Textarea}
            label={text.descriptionLabel}
            textareaProps={{
              maxLength: ROLE_DESCRIPTION_MAX_LENGTH,
              name: "role-description",
              onChange: (event) => setDescription(event.target.value),
              placeholder: text.descriptionPlaceholder,
              rows: 2,
              value: description,
            }}
          />
        </div>

        {role ? (
          <div className={styles.toggle}>
            <input
              aria-describedby={`${activeId}-hint`}
              checked={active}
              className={styles.checkbox}
              id={activeId}
              onChange={(event) => setActive(event.target.checked)}
              type="checkbox"
            />
            <label className={styles.toggleText} htmlFor={activeId}>
              <span className={styles.toggleLabel}>{text.activeLabel}</span>
              <span className={styles.toggleHint} id={`${activeId}-hint`}>
                {text.activeHint}
              </span>
            </label>
          </div>
        ) : null}

        <PermissionPicker
          content={permissionsContent}
          legend={text.permissionsLabel}
          lockNonDelegable
          onToggleAction={togglePermission}
          readOnly={false}
          selected={permissions}
        />

        {mutation.hasConflict ? (
          <p className={styles.message} data-tone="conflict" role="alert">
            {text.conflict}
          </p>
        ) : null}
        {mutation.errorCode ? (
          <p className={styles.message} data-tone="error" role="alert">
            {content.errors[mutation.errorCode]}
          </p>
        ) : null}
      </form>
    </WorkspaceDialog>
  );
}
