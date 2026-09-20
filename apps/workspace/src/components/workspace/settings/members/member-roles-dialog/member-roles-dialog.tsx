"use client";

import { type SubmitEvent, useId, useMemo, useState } from "react";

import type { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { unionRolePermissions } from "@invessiv/common/patterns/auth/union-role-permissions";
import {
  ButtonControl,
  Dialog,
  DialogSize,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { accessApiService } from "@/client/access/access-api-service";
import { MemberRolesTab } from "@/common/constants/access/member-roles-tabs";
import {
  selectAssignableRoles,
  selectOwnerRoleIds,
} from "@/common/patterns/access/role-selection";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type {
  SettingsAccessDictionary,
  SettingsMembersDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { resolveRoleLabel } from "@/lib/workspace/access/role-label";
import { AccessScopeTree } from "../../shared/access-scope-tree/access-scope-tree";
import { PermissionSummary } from "../../shared/permission-summary/permission-summary";
import { RoleChecklist } from "../../shared/role-checklist/role-checklist";
import { MemberRolesTabs } from "../member-roles-tabs/member-roles-tabs";
import styles from "./member-roles-dialog.module.css";

type MemberRolesDialogProps = {
  accessContent: SettingsAccessDictionary;
  canManageAccess: boolean;
  content: SettingsMembersDictionary;
  initialAccessScopes: readonly AccessScopeEntryDto[];
  initialTab?: MemberRolesTab;
  member: WorkspaceMemberDto;
  onCloseAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
  roles: readonly RoleAssignmentOptionDto[];
  rolesHref: string;
};

function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
}

function hasSameIds(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

export function MemberRolesDialog({
  accessContent,
  canManageAccess,
  content,
  initialAccessScopes,
  initialTab = MemberRolesTab.Global,
  member,
  onCloseAction,
  permissionsContent,
  roles,
  rolesHref,
}: MemberRolesDialogProps) {
  const formId = useId();
  const accessFormId = useId();
  const previewHeadingId = useId();
  const globalTabId = useId();
  const globalPanelId = useId();
  const customerTabId = useId();
  const customerPanelId = useId();
  const text = content.rolesDialog;
  const globalRoles = useMemo(
    () => roles.filter((role) => !role.scopeAssignable),
    [roles],
  );
  const customerRoles = useMemo(
    () => roles.filter((role) => role.scopeAssignable),
    [roles],
  );
  const initialGlobalRoleIds = member.roles
    .filter((memberRole) =>
      globalRoles.some((role) => role.id === memberRole.id),
    )
    .map((role) => role.id);
  const [selectedRoleIds, setSelectedRoleIds] = useState(initialGlobalRoleIds);
  const [activeTab, setActiveTab] = useState<MemberRolesTab>(
    canManageAccess ? initialTab : MemberRolesTab.Global,
  );
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [accessScopeAssignments, setAccessScopeAssignments] = useState<
    readonly AccessScopeAssignmentDto[]
  >(() => initialAccessScopes.map(({ roleId, scope }) => ({ roleId, scope })));
  const [scopeEntries, setScopeEntries] = useState(initialAccessScopes);
  const [scopeTreeVersion, setScopeTreeVersion] = useState(0);
  const [scopeReloadError, setScopeReloadError] = useState(false);
  const [accessIsDirty, setAccessIsDirty] = useState(false);
  const [accessIsSubmitting, setAccessIsSubmitting] = useState(false);

  async function reloadScopesAfterConflict() {
    const result = await accessApiService.listMemberAccessScopes(member.id);
    if (!result.ok) {
      setScopeReloadError(true);
      return;
    }
    setScopeEntries(result.accessScopes);
    setAccessScopeAssignments(
      result.accessScopes.map(({ roleId, scope }) => ({ roleId, scope })),
    );
    setAccessIsDirty(false);
    setScopeReloadError(false);
    setScopeTreeVersion((current) => current + 1);
  }

  const mutation = useVersionedMutation<
    WorkspaceMemberDto,
    WorkspaceMemberErrorCode
  >(member, onCloseAction, { onConflictAction: reloadScopesAfterConflict });
  const globalIsDirty = !hasSameIds(selectedRoleIds, initialGlobalRoleIds);
  const isDirty = globalIsDirty || accessIsDirty;
  const choices = selectAssignableRoles(globalRoles, [
    ...initialGlobalRoleIds,
    ...mutation.current.roles.map((role) => role.id),
  ]);
  // Read from the freshest known server state, not the initial snapshot: a legacy
  // customer-scoped-but-globally-assigned role changed by someone else between mount and a
  // version-conflict retry must not be silently reverted by this invisible passthrough.
  const preservedLegacyRoleIds = mutation.current.roles
    .filter((memberRole) =>
      customerRoles.some((role) => role.id === memberRole.id),
    )
    .map((role) => role.id);
  const previewRoleIds = mutation.current.isOwner
    ? [...selectedRoleIds, ...selectOwnerRoleIds(globalRoles)]
    : selectedRoleIds;
  const previewPermissions = unionRolePermissions(globalRoles, previewRoleIds);

  function requestClose() {
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    mutation.close();
  }

  function selectTab(tab: MemberRolesTab) {
    if (tab === MemberRolesTab.Customer && !canManageAccess) return;
    setActiveTab(tab);
  }

  async function submitAll() {
    await mutation.submit((current) =>
      accessApiService.replaceMemberRoleAssignments(member.id, {
        roleIds: [...selectedRoleIds, ...preservedLegacyRoleIds],
        accessScopeAssignments: [...accessScopeAssignments],
        version: current.version,
      }),
    );
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitAll();
  }

  return (
    <>
      <Dialog
        busy={mutation.isSubmitting || accessIsSubmitting}
        closeLabel={text.close}
        description={text.description}
        footer={
          <>
            <ButtonControl
              disabled={mutation.isSubmitting || accessIsSubmitting}
              onClick={requestClose}
              type="button"
              variant="ghost"
            >
              {text.cancel}
            </ButtonControl>
            <PrimaryCtaButton
              disabled={
                mutation.isSubmitting ||
                accessIsSubmitting ||
                !isDirty ||
                scopeReloadError
              }
              form={activeTab === MemberRolesTab.Global ? formId : accessFormId}
              type="submit"
            >
              {mutation.isSubmitting || accessIsSubmitting
                ? text.submitting
                : text.submit}
            </PrimaryCtaButton>
          </>
        }
        onCloseAction={requestClose}
        size={DialogSize.Wide}
        title={formatMessage(text.title, { name: member.displayName })}
      >
        <div className={styles.shell}>
          <MemberRolesTabs
            activeTab={activeTab}
            canManageAccess={canManageAccess}
            customerPanelId={customerPanelId}
            customerTabId={customerTabId}
            globalPanelId={globalPanelId}
            globalTabId={globalTabId}
            customerIsDirty={accessIsDirty}
            globalIsDirty={globalIsDirty}
            onSelectAction={selectTab}
            text={text}
          />
          {mutation.hasConflict || mutation.errorCode || scopeReloadError ? (
            <section className={styles.sharedFeedback} role="alert">
              {mutation.hasConflict ? (
                <>
                  <p>{text.conflict}</p>
                  <div className={styles.currentState}>
                    <h3 className={styles.currentStateHeading}>
                      {text.conflictCurrentHeading}
                    </h3>
                    <ul className={styles.currentRoles}>
                      {mutation.current.isOwner ? (
                        <li>{content.list.ownerBadge}</li>
                      ) : null}
                      {mutation.current.roles.map((role) => (
                        <li key={role.id}>
                          {resolveRoleLabel(role, permissionsContent)}
                        </li>
                      ))}
                      {!mutation.current.isOwner &&
                      mutation.current.roles.length === 0 ? (
                        <li>{content.list.noRoles}</li>
                      ) : null}
                    </ul>
                  </div>
                </>
              ) : null}
              {mutation.errorCode ? (
                <p>{content.errors[mutation.errorCode]}</p>
              ) : null}
              {scopeReloadError ? <p>{accessContent.errors.INTERNAL}</p> : null}
            </section>
          ) : null}

          <div
            aria-labelledby={globalTabId}
            hidden={activeTab !== MemberRolesTab.Global}
            id={globalPanelId}
            role="tabpanel"
            tabIndex={0}
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
            </form>
          </div>

          {canManageAccess ? (
            <div
              aria-labelledby={customerTabId}
              hidden={activeTab !== MemberRolesTab.Customer}
              id={customerPanelId}
              role="tabpanel"
              tabIndex={0}
            >
              <div className={styles.customerPanel}>
                <AccessScopeTree
                  accessContent={accessContent}
                  canManageAccess
                  formId={accessFormId}
                  initialAccessScopes={scopeEntries}
                  isExternallySubmitting={
                    mutation.isSubmitting || scopeReloadError
                  }
                  key={scopeTreeVersion}
                  member={member}
                  onAssignmentsChangeAction={setAccessScopeAssignments}
                  onDirtyChangeAction={setAccessIsDirty}
                  onSavedAction={onCloseAction}
                  onSubmitAction={() => {
                    void submitAll();
                  }}
                  onSubmittingChangeAction={setAccessIsSubmitting}
                  permissionsContent={permissionsContent}
                  previewGlobalRoleIds={[
                    ...selectedRoleIds,
                    ...preservedLegacyRoleIds,
                  ]}
                  roles={roles}
                  rolesHref={rolesHref}
                />
              </div>
            </div>
          ) : null}
        </div>
      </Dialog>

      {confirmDiscard ? (
        <Dialog
          closeLabel={text.keepEditing}
          description={text.discardDescription}
          footer={
            <>
              <ButtonControl
                onClick={() => setConfirmDiscard(false)}
                type="button"
                variant="ghost"
              >
                {text.keepEditing}
              </ButtonControl>
              <PrimaryCtaButton onClick={onCloseAction} type="button">
                {text.discard}
              </PrimaryCtaButton>
            </>
          }
          onCloseAction={() => setConfirmDiscard(false)}
          size={DialogSize.Narrow}
          title={text.discardTitle}
        />
      ) : null}
    </>
  );
}
