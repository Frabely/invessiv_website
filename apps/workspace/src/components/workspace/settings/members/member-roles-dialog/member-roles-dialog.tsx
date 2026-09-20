"use client";

import {
  type KeyboardEvent,
  type SubmitEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
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
  const previewHeadingId = useId();
  const globalTabId = useId();
  const globalPanelId = useId();
  const customerTabId = useId();
  const customerPanelId = useId();
  const globalTabRef = useRef<HTMLButtonElement>(null);
  const customerTabRef = useRef<HTMLButtonElement>(null);
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
  const mutation = useVersionedMutation<
    WorkspaceMemberDto,
    WorkspaceMemberErrorCode
  >(member, onCloseAction);
  const isDirty = !hasSameIds(selectedRoleIds, initialGlobalRoleIds);
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

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const tabs = canManageAccess
      ? [MemberRolesTab.Global, MemberRolesTab.Customer]
      : [MemberRolesTab.Global];
    const currentIndex = tabs.indexOf(activeTab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = tabs[nextIndex] ?? MemberRolesTab.Global;
    selectTab(next);
    (next === MemberRolesTab.Global
      ? globalTabRef.current
      : customerTabRef.current
    )?.focus();
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.submit((current) =>
      accessApiService.replaceMemberRoles(member.id, {
        roleIds: [...selectedRoleIds, ...preservedLegacyRoleIds],
        version: current.version,
      }),
    );
  }

  return (
    <>
      <Dialog
        busy={mutation.isSubmitting}
        closeLabel={text.close}
        description={text.description}
        footer={
          activeTab === MemberRolesTab.Global ? (
            <>
              <ButtonControl
                disabled={mutation.isSubmitting}
                onClick={requestClose}
                type="button"
                variant="ghost"
              >
                {text.cancel}
              </ButtonControl>
              <PrimaryCtaButton
                disabled={mutation.isSubmitting || !isDirty}
                form={formId}
                type="submit"
              >
                {mutation.isSubmitting ? text.submitting : text.submit}
              </PrimaryCtaButton>
            </>
          ) : (
            <ButtonControl onClick={requestClose} type="button" variant="ghost">
              {text.done}
            </ButtonControl>
          )
        }
        onCloseAction={requestClose}
        size={DialogSize.Wide}
        title={formatMessage(text.title, { name: member.displayName })}
      >
        <div className={styles.shell}>
          <div
            aria-label={text.tabsLabel}
            className={styles.tabs}
            role="tablist"
          >
            <button
              aria-controls={globalPanelId}
              aria-selected={activeTab === MemberRolesTab.Global}
              className={styles.tab}
              id={globalTabId}
              onClick={() => selectTab(MemberRolesTab.Global)}
              onKeyDown={handleTabKeyDown}
              ref={globalTabRef}
              role="tab"
              tabIndex={activeTab === MemberRolesTab.Global ? 0 : -1}
              type="button"
            >
              {text.globalTab}
              {isDirty ? (
                <span className={styles.unsaved}>{text.unsaved}</span>
              ) : null}
            </button>
            {canManageAccess ? (
              <button
                aria-controls={customerPanelId}
                aria-selected={activeTab === MemberRolesTab.Customer}
                className={styles.tab}
                id={customerTabId}
                onClick={() => selectTab(MemberRolesTab.Customer)}
                onKeyDown={handleTabKeyDown}
                ref={customerTabRef}
                role="tab"
                tabIndex={activeTab === MemberRolesTab.Customer ? 0 : -1}
                type="button"
              >
                {text.customerTab}
              </button>
            ) : null}
          </div>

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

              {mutation.hasConflict ? (
                <section className={styles.conflict} role="alert">
                  <p className={styles.conflictMessage}>{text.conflict}</p>
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
                </section>
              ) : null}
              {mutation.errorCode ? (
                <p className={styles.error} role="alert">
                  {content.errors[mutation.errorCode]}
                </p>
              ) : null}
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
                <p className={styles.immediateNote}>{text.immediateNote}</p>
                <AccessScopeTree
                  accessContent={accessContent}
                  canManageAccess
                  initialAccessScopes={initialAccessScopes}
                  member={member}
                  onOpenGlobalRolesAction={() =>
                    selectTab(MemberRolesTab.Global)
                  }
                  permissionsContent={permissionsContent}
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
