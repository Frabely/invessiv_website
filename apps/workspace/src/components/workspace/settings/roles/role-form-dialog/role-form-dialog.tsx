"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";

import type { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import {
  type Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import {
  ButtonControl,
  CheckboxControl,
  Dialog,
  DialogSize,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { accessApiService } from "@/client/access/access-api-service";
import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
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
import { PermissionSummary } from "../../shared/permission-summary/permission-summary";
import styles from "./role-form-dialog.module.css";

type RoleFormDialogProps = {
  content: SettingsRolesDictionary;
  onCloseAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
  /** Null creates a new custom role; a system role opens read-only. */
  role: RoleDto | null;
  realm?: AuthRealm;
};

type RoleFormDialogText = SettingsRolesDictionary["dialog"];

/**
 * Everything this dialog does differently per realm, in one place instead of scattered
 * `realm === AuthRealm.Portal` checks: whether a global/customer type must be picked before the
 * form shows, whether `scopeAssignable` is forced instead of user-chosen, and the type badge text.
 */
const ROLE_FORM_REALM_CONFIG: Record<
  AuthRealm,
  {
    requiresTypeSelection: boolean;
    forcedScopeAssignable: boolean | null;
    typeBadgeLabel: (
      text: RoleFormDialogText,
      scopeAssignable: boolean,
    ) => string;
  }
> = {
  [AuthRealm.Workspace]: {
    requiresTypeSelection: true,
    forcedScopeAssignable: null,
    typeBadgeLabel: (text, scopeAssignable) =>
      scopeAssignable ? text.customerRoleType : text.globalType,
  },
  [AuthRealm.Portal]: {
    requiresTypeSelection: false,
    forcedScopeAssignable: false,
    typeBadgeLabel: (text) => text.portalRoleType,
  },
};

export function RoleFormDialog({
  content,
  onCloseAction,
  permissionsContent,
  role,
  realm = AuthRealm.Workspace,
}: RoleFormDialogProps) {
  const formId = useId();
  const activeId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const text = content.dialog;
  const readOnly = role?.isSystem ?? false;
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [active, setActive] = useState(role?.active ?? true);
  const [scopeAssignable, setScopeAssignable] = useState<boolean | null>(
    role?.scopeAssignable ?? null,
  );
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
    if (
      !name.trim() ||
      (ROLE_FORM_REALM_CONFIG[realm].requiresTypeSelection &&
        scopeAssignable === null)
    ) {
      if (!name.trim()) nameInputRef.current?.focus();
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
            realm,
            name,
            description: normalizedDescription,
            permissions,
            scopeAssignable: selectedScopeAssignable,
          }),
    );
  }

  if (readOnly && role) {
    const label = resolveRoleLabel(role, permissionsContent);
    const roleDescription = resolveRoleDescription(role, permissionsContent);
    return (
      <Dialog
        closeLabel={text.close}
        description={text.viewDescription}
        footer={
          <ButtonControl onClick={onCloseAction} type="button" variant="ghost">
            {text.done}
          </ButtonControl>
        }
        onCloseAction={onCloseAction}
        size={DialogSize.Wide}
        title={formatMessage(text.viewTitle, { name: label })}
      >
        <div className={styles.form}>
          <div className={styles.readOnlyIntro}>
            <span className={styles.typeBadge}>{text.systemRoleType}</span>
            <span className={styles.typeBadge}>
              {ROLE_FORM_REALM_CONFIG[role.realm].typeBadgeLabel(
                text,
                role.scopeAssignable,
              )}
            </span>
            <span className={styles.readOnlyBadge}>{text.readOnlyLabel}</span>
            {roleDescription ? (
              <p className={styles.roleDescription}>{roleDescription}</p>
            ) : null}
          </div>
          <PermissionPicker
            realm={role.realm}
            content={permissionsContent}
            legend={text.permissionsLabel}
            lockNonDelegable={false}
            readOnly
            selected={role.permissions}
          />
        </div>
      </Dialog>
    );
  }

  if (
    !role &&
    scopeAssignable === null &&
    ROLE_FORM_REALM_CONFIG[realm].requiresTypeSelection
  ) {
    return (
      <Dialog
        closeLabel={text.close}
        description={text.typeSelectionDescription}
        footer={
          <ButtonControl onClick={onCloseAction} type="button" variant="ghost">
            {text.cancel}
          </ButtonControl>
        }
        onCloseAction={onCloseAction}
        size={DialogSize.Wide}
        title={text.typeSelectionTitle}
      >
        <div className={styles.typeGrid}>
          <button
            className={styles.typeCard}
            onClick={() => {
              setPermissions([]);
              setScopeAssignable(false);
            }}
            type="button"
          >
            <span className={styles.typeCardTag}>{text.globalType}</span>
            <strong>{text.globalRoleTitle}</strong>
            <span>{text.globalRoleDescription}</span>
          </button>
          <button
            className={styles.typeCard}
            onClick={() => {
              setPermissions([]);
              setScopeAssignable(true);
            }}
            type="button"
          >
            <span className={styles.typeCardTag}>{text.customerRoleType}</span>
            <strong>{text.customerRoleTitle}</strong>
            <span>{text.customerRoleDescription}</span>
          </button>
        </div>
      </Dialog>
    );
  }

  const selectedScopeAssignable =
    ROLE_FORM_REALM_CONFIG[realm].forcedScopeAssignable ??
    scopeAssignable ??
    role?.scopeAssignable ??
    false;

  return (
    <Dialog
      busy={mutation.isSubmitting}
      closeLabel={text.close}
      description={text.description}
      footer={
        <>
          {!role && ROLE_FORM_REALM_CONFIG[realm].requiresTypeSelection ? (
            <ButtonControl
              disabled={mutation.isSubmitting}
              onClick={() => setScopeAssignable(null)}
              type="button"
              variant="ghost"
            >
              {text.backToTypeSelection}
            </ButtonControl>
          ) : null}
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
      onCloseAction={mutation.close}
      size={DialogSize.Wide}
      title={role ? text.editTitle : text.createTitle}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div
          className={styles.topFields}
          data-has-status={role ? "true" : "false"}
        >
          <FormField
            errorMessage={nameError}
            inputRef={nameInputRef}
            inputProps={{
              autoComplete: "off",
              maxLength: AccessFieldLimits.RoleNameMaxLength,
              name: "role-name",
              onChange: (event) => setName(event.target.value),
              placeholder: text.namePlaceholder,
              value: name,
            }}
            kind={FormFieldKind.Text}
            label={text.nameLabel}
            required
          />
          {role ? (
            <div className={styles.statusField}>
              <span className={styles.fieldLabel}>{text.statusLabel}</span>
              <label className={styles.toggle} htmlFor={activeId}>
                <CheckboxControl
                  checked={active}
                  id={activeId}
                  onChange={(event) => setActive(event.target.checked)}
                />
                <span className={styles.toggleLabel}>
                  {active ? text.statusActive : text.statusInactive}
                </span>
              </label>
            </div>
          ) : null}
        </div>

        <div className={styles.roleTypeLine}>
          <span className={styles.fieldLabel}>{text.roleTypeLabel}</span>
          <span className={styles.typeBadge}>
            {ROLE_FORM_REALM_CONFIG[realm].typeBadgeLabel(
              text,
              selectedScopeAssignable,
            )}
          </span>
        </div>

        <FormField
          kind={FormFieldKind.Textarea}
          label={text.descriptionLabel}
          textareaProps={{
            maxLength: AccessFieldLimits.RoleDescriptionMaxLength,
            name: "role-description",
            onChange: (event) => setDescription(event.target.value),
            placeholder: text.descriptionPlaceholder,
            rows: 2,
            value: description,
          }}
        />

        <PermissionPicker
          realm={realm}
          content={permissionsContent}
          legend={text.permissionsLabel}
          lockNonDelegable
          onlyScopeAssignable={selectedScopeAssignable}
          onToggleAction={togglePermission}
          readOnly={false}
          selected={permissions}
        />

        {mutation.hasConflict ? (
          <section
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            <p className={styles.conflictMessage}>{text.conflict}</p>
            {mutation.current ? (
              <div className={styles.currentState}>
                <h3 className={styles.currentStateHeading}>
                  {text.conflictCurrentHeading}
                </h3>
                <p className={styles.currentStateSummary}>
                  {formatMessage(text.conflictCurrentSummary, {
                    name: mutation.current.name,
                    status: mutation.current.active
                      ? text.statusActive
                      : text.statusInactive,
                  })}
                </p>
                <p className={styles.currentStateDescription}>
                  {mutation.current.description ??
                    text.conflictCurrentNoDescription}
                </p>
                <PermissionSummary
                  content={permissionsContent}
                  emptyLabel={text.conflictCurrentNoPermissions}
                  permissions={mutation.current.permissions}
                />
              </div>
            ) : null}
          </section>
        ) : null}
        {mutation.errorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {content.errors[mutation.errorCode]}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
