"use client";

import { type SubmitEvent, useEffect, useId } from "react";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";
import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type { TreeNode } from "@invessiv/common/contracts/ui/tree-node";
import { unionRolePermissions } from "@invessiv/common/patterns/auth/union-role-permissions";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import { ButtonControl, TreeView } from "@invessiv/ui";
import {
  findDirectScopeAssignment,
  isRoleInheritedFromCustomer,
} from "@/common/patterns/access/access-scope-tree";
import { ListSearchField } from "@/components/workspace/shared/toolbar/list-search-field/list-search-field";
import { useAccessScopeTree } from "@/hooks/workspace/access/use-access-scope-tree";
import type {
  SettingsAccessDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { PermissionSummary } from "../permission-summary/permission-summary";
import {
  AccessScopeRow,
  type AccessScopeRowProps,
} from "../access-scope-row/access-scope-row";
import styles from "./access-scope-tree.module.css";

type RowData = {
  scope: AccessScopeDto | null;
  roles: AccessScopeRowProps["roles"];
};

export type AccessScopeTreeProps = {
  accessContent: SettingsAccessDictionary;
  canManageAccess: boolean;
  fixedCustomer?: AccessCustomerOptionDto;
  formId?: string;
  isExternallySubmitting?: boolean;
  initialAccessScopes: readonly AccessScopeEntryDto[];
  member: WorkspaceMemberDto;
  previewGlobalRoleIds?: readonly string[];
  onDirtyChangeAction?: (isDirty: boolean) => void;
  onAssignmentsChangeAction?: (
    assignments: readonly AccessScopeAssignmentDto[],
  ) => void;
  onSavedAction?: () => void;
  onSubmitAction?: () => void;
  onSubmittingChangeAction?: (isSubmitting: boolean) => void;
  permissionsContent: SettingsPermissionsDictionary;
  roles: readonly RoleAssignmentOptionDto[];
  rolesHref: string;
};

function customerNodeId(customerId: string) {
  return `customer:${customerId}`;
}

function projectNodeId(projectId: string) {
  return `project:${projectId}`;
}

export function AccessScopeTree({
  accessContent,
  canManageAccess,
  fixedCustomer,
  formId,
  isExternallySubmitting = false,
  initialAccessScopes,
  member,
  previewGlobalRoleIds,
  onDirtyChangeAction,
  onAssignmentsChangeAction,
  onSavedAction,
  onSubmitAction,
  onSubmittingChangeAction,
  permissionsContent,
  roles,
  rolesHref,
}: AccessScopeTreeProps) {
  const generatedFormId = useId();
  const {
    assignments,
    commitSearch,
    customers,
    expandedIds,
    isDirty,
    isSearching,
    loadingIds,
    loadCustomerProjects,
    mutation,
    offeredProjectRoles,
    offeredRoles,
    projectErrorIds,
    projectsByCustomer,
    resetSearch,
    search,
    searchError,
    searchResults,
    scopeReloadError,
    setTouched,
    submit,
    toggleCustomer,
    toggleScope,
    touched,
  } = useAccessScopeTree({
    fixedCustomer,
    initialAccessScopes,
    member,
    onSavedAction: onSavedAction ?? (() => undefined),
    roles,
  });

  useEffect(() => {
    onDirtyChangeAction?.(isDirty);
  }, [isDirty, onDirtyChangeAction]);

  useEffect(() => {
    onAssignmentsChangeAction?.(assignments);
  }, [assignments, onAssignmentsChangeAction]);

  useEffect(() => {
    onSubmittingChangeAction?.(mutation.isSubmitting);
  }, [mutation.isSubmitting, onSubmittingChangeAction]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSubmitAction) {
      onSubmitAction();
      return;
    }
    void submit();
  }

  const isSubmitting = mutation.isSubmitting || isExternallySubmitting;
  const rows = new Map<string, RowData>();
  const customerNodes: TreeNode[] = customers.map((customer) => {
    const customerScope: AccessScopeDto = {
      type: AccessScopeType.Customer,
      customerId: customer.id,
    };
    const customerId = customerNodeId(customer.id);
    rows.set(customerId, {
      scope: customerScope,
      roles: offeredRoles.map((role) => {
        const direct = Boolean(
          findDirectScopeAssignment(assignments, role.id, customerScope),
        );
        return {
          role,
          checked: direct,
          direct,
          disabled: !canManageAccess || isSubmitting || scopeReloadError,
          inherited: false,
          pending: false,
          removeDirectDisabled: true,
        };
      }),
    });
    const knownProjects =
      projectsByCustomer[customer.id] ??
      initialAccessScopes
        .filter(
          (entry) =>
            entry.scope.type === AccessScopeType.Project &&
            entry.scope.customerId === customer.id,
        )
        .map((entry) => ({
          id:
            entry.scope.type === AccessScopeType.Project
              ? entry.scope.projectId
              : "",
          customerId: customer.id,
          title: entry.projectTitle ?? "",
        }))
        .filter(
          (project, index, all) =>
            all.findIndex((entry) => entry.id === project.id) === index,
        );
    const children = knownProjects.map((project) => {
      const projectScope: AccessScopeDto = {
        type: AccessScopeType.Project,
        customerId: customer.id,
        projectId: project.id,
      };
      const id = projectNodeId(project.id);
      rows.set(id, {
        scope: projectScope,
        roles: offeredProjectRoles.map((role) => {
          const inherited = isRoleInheritedFromCustomer(
            assignments,
            customer.id,
            role.id,
          );
          const direct = Boolean(
            findDirectScopeAssignment(assignments, role.id, projectScope),
          );
          return {
            role,
            checked: inherited || direct,
            direct,
            disabled:
              !canManageAccess || isSubmitting || scopeReloadError || inherited,
            inherited,
            pending: false,
            removeDirectDisabled:
              !canManageAccess || isSubmitting || scopeReloadError,
          };
        }),
      });
      return {
        id,
        label: project.title,
        secondaryLabel: null,
        hasChildren: false,
        children: [],
      };
    });
    return {
      id: customerId,
      label: `${formatCustomerNumber(customer.customerNumber)} · ${customer.displayName}`,
      secondaryLabel: accessContent.wholeCustomer,
      hasChildren:
        projectsByCustomer[customer.id] === undefined || children.length > 0,
      children,
    };
  });

  const nodes: TreeNode[] = customerNodes;

  const previewRoleIds = touched
    ? [
        ...(previewGlobalRoleIds ?? member.roles.map((role) => role.id)),
        ...assignments
          .filter(
            (entry) =>
              entry.scope.customerId === touched.customerId &&
              (entry.scope.type === AccessScopeType.Customer ||
                (touched.type === AccessScopeType.Project &&
                  entry.scope.type === AccessScopeType.Project &&
                  entry.scope.projectId === touched.projectId)),
          )
          .map((entry) => entry.roleId),
      ]
    : [];
  const previewPermissions = unionRolePermissions(roles, previewRoleIds);
  const noResults =
    Boolean(search) &&
    !isSearching &&
    !searchError &&
    searchResults.length === 0;

  return (
    <form
      className={styles.root}
      id={formId ?? generatedFormId}
      onSubmit={handleSubmit}
    >
      {offeredRoles.length === 0 ? (
        <section className={styles.empty}>
          <h3>{accessContent.noCustomerRolesTitle}</h3>
          <p>{accessContent.noCustomerRolesDescription}</p>
          <a className={styles.catalogLink} href={rolesHref}>
            {accessContent.openRoleCatalog}
          </a>
        </section>
      ) : null}
      {!fixedCustomer ? (
        <ListSearchField
          currentValue={search}
          label={accessContent.searchLabel}
          onCommitAction={commitSearch}
          placeholder={accessContent.searchPlaceholder}
        />
      ) : null}
      {isSearching ? (
        <p className={styles.status} role="status">
          {accessContent.searchLoading}
        </p>
      ) : null}
      {searchError ? (
        <div className={styles.inlineError} role="alert">
          <p>{accessContent.searchError}</p>
          <ButtonControl
            onClick={() => void commitSearch(search || undefined)}
            type="button"
            variant="ghost"
          >
            {accessContent.retrySearch}
          </ButtonControl>
        </div>
      ) : null}

      {offeredRoles.length > 0 ? (
        <div className={styles.contentGrid}>
          <div className={styles.treeFrame}>
            <TreeView
              ariaLabel={accessContent.treeLabel}
              collapseLabelTemplate={accessContent.collapse}
              expandLabelTemplate={accessContent.expand}
              expandedIds={expandedIds}
              loadingIds={loadingIds}
              loadingLabel={accessContent.projectsLoading}
              nodes={nodes}
              onToggleAction={(nodeId, expanded) => {
                const customer = customers.find(
                  (entry) => customerNodeId(entry.id) === nodeId,
                );
                if (customer) {
                  toggleCustomer(customer.id, expanded);
                }
              }}
              renderRowActions={(node) => {
                const row = rows.get(node.id);
                if (!row) {
                  return null;
                }
                return (
                  <div
                    className={styles.rowActions}
                    onFocus={() => {
                      if (!row.scope) return;
                      setTouched(
                        row.scope.type === AccessScopeType.Customer
                          ? {
                              type: row.scope.type,
                              customerId: row.scope.customerId,
                              label: node.label,
                            }
                          : {
                              type: row.scope.type,
                              customerId: row.scope.customerId,
                              projectId: row.scope.projectId,
                              label: node.label,
                            },
                      );
                    }}
                  >
                    <AccessScopeRow
                      accessContent={accessContent}
                      onToggleAction={(roleId, checked) => {
                        if (row.scope)
                          void toggleScope(row.scope, roleId, checked);
                      }}
                      onRemoveDirectAction={(roleId) => {
                        if (row.scope)
                          void toggleScope(row.scope, roleId, false);
                      }}
                      permissionsContent={permissionsContent}
                      roles={row.roles}
                      scopeLabel={node.label}
                    />
                  </div>
                );
              }}
            />
          </div>

          <section aria-live="polite" className={styles.preview}>
            {touched ? (
              <>
                <h3>
                  {formatMessage(accessContent.previewHeading, {
                    target: touched.label,
                  })}
                </h3>
                <PermissionSummary
                  content={permissionsContent}
                  emptyLabel={accessContent.previewEmpty}
                  permissions={previewPermissions}
                />
              </>
            ) : (
              <p>{accessContent.previewPrompt}</p>
            )}
          </section>
        </div>
      ) : null}

      {projectErrorIds.map((customerId) => {
        const customer = customers.find((entry) => entry.id === customerId);
        if (!customer) {
          return null;
        }
        const customerLabel = `${formatCustomerNumber(customer.customerNumber)} · ${customer.displayName}`;
        return (
          <div className={styles.inlineError} key={customerId} role="alert">
            <p>
              {formatMessage(accessContent.projectsError, {
                customer: customerLabel,
              })}
            </p>
            <ButtonControl
              aria-label={formatMessage(accessContent.retryProjectsLabel, {
                customer: customerLabel,
              })}
              onClick={() => void loadCustomerProjects(customerId)}
              type="button"
              variant="ghost"
            >
              {accessContent.retryProjects}
            </ButtonControl>
          </div>
        );
      })}

      {assignments.length === 0 && !search ? (
        <section className={styles.empty}>
          <h3>{accessContent.emptyTitle}</h3>
          <p>{accessContent.emptyDescription}</p>
        </section>
      ) : null}
      {noResults ? (
        <section className={styles.empty} data-kind="no-results">
          <h3>{accessContent.noResultsTitle}</h3>
          <p>{formatMessage(accessContent.noResultsDescription, { search })}</p>
          <ButtonControl onClick={resetSearch} type="button" variant="ghost">
            {accessContent.resetSearch}
          </ButtonControl>
        </section>
      ) : null}

      {mutation.hasConflict ? (
        <p className={styles.conflict} role="alert">
          {accessContent.conflict}
        </p>
      ) : null}
      {mutation.errorCode ? (
        <p className={styles.error} role="alert">
          {accessContent.errors[
            mutation.errorCode as keyof typeof accessContent.errors
          ] ?? accessContent.errors.INTERNAL}
        </p>
      ) : null}
      {scopeReloadError ? (
        <p className={styles.error} role="alert">
          {accessContent.errors.INTERNAL}
        </p>
      ) : null}
    </form>
  );
}
