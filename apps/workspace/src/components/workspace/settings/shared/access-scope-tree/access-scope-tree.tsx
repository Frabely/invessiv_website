"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type { TreeNode } from "@invessiv/common/contracts/ui/tree-node";
import { roleAppliesToScopeType } from "@invessiv/common/patterns/auth/role-applies-to-scope-type";
import { unionRolePermissions } from "@invessiv/common/patterns/auth/union-role-permissions";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import { ButtonControl, TreeView } from "@invessiv/ui";
import { accessApiService } from "@/client/access/access-api-service";
import {
  findDirectScopeAssignment,
  isRoleInheritedFromCustomer,
  mergeAccessCustomers,
} from "@/common/patterns/access/access-scope-tree";
import { ListSearchField } from "@/components/workspace/shared/toolbar/list-search-field/list-search-field";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
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

type TouchedTarget =
  | { type: typeof AccessScopeType.Customer; customerId: string; label: string }
  | {
      type: typeof AccessScopeType.Project;
      customerId: string;
      projectId: string;
      label: string;
    };

type RowData = {
  scope: AccessScopeDto | null;
  roles: AccessScopeRowProps["roles"];
};

export type AccessScopeTreeProps = {
  accessContent: SettingsAccessDictionary;
  canManageAccess: boolean;
  fixedCustomer?: AccessCustomerOptionDto;
  initialAccessScopes: readonly AccessScopeEntryDto[];
  member: WorkspaceMemberDto;
  onOpenGlobalRolesAction?: () => void;
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

function scopeKey(scope: AccessScopeDto, roleId: string) {
  return scope.type === AccessScopeType.Customer
    ? `${scope.type}:${scope.customerId}:${roleId}`
    : `${scope.type}:${scope.projectId}:${roleId}`;
}

export function AccessScopeTree({
  accessContent,
  canManageAccess,
  fixedCustomer,
  initialAccessScopes,
  member,
  onOpenGlobalRolesAction,
  permissionsContent,
  roles,
  rolesHref,
}: AccessScopeTreeProps) {
  const [accessScopes, setAccessScopes] = useState<AccessScopeEntryDto[]>([
    ...initialAccessScopes,
  ]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AccessCustomerOptionDto[]>(
    fixedCustomer ? [fixedCustomer] : [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [projectsByCustomer, setProjectsByCustomer] = useState<
    Record<string, AccessProjectOptionDto[]>
  >({});
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [projectErrorIds, setProjectErrorIds] = useState<string[]>([]);
  const [reloadError, setReloadError] = useState(false);
  const [touched, setTouched] = useState<TouchedTarget | null>(null);
  const searchRequestId = useRef(0);
  const projectLoads = useRef(new Set<string>());
  const mutation = useVersionedMutation(member, () => undefined);

  const offeredRoles = useMemo(() => {
    const heldIds = new Set(accessScopes.map((entry) => entry.roleId));
    return roles.filter(
      (role) => role.scopeAssignable && (role.active || heldIds.has(role.id)),
    );
  }, [accessScopes, roles]);

  // A role built purely from customer-entity permissions (e.g. "manage customers") has nothing
  // to grant on a single project and would sit there as inert, confusing dead weight.
  const offeredProjectRoles = useMemo(
    () =>
      offeredRoles.filter((role) =>
        roleAppliesToScopeType(role.permissions, AccessScopeType.Project),
      ),
    [offeredRoles],
  );

  const customers = useMemo(
    () =>
      fixedCustomer
        ? [fixedCustomer]
        : mergeAccessCustomers(accessScopes, searchResults),
    [accessScopes, fixedCustomer, searchResults],
  );

  const commitSearch = useCallback(
    async (value: string | undefined) => {
      const requestId = ++searchRequestId.current;
      const query = value ?? "";
      if (!query) {
        setSearch("");
        setIsSearching(false);
        setSearchError(false);
        setSearchResults(fixedCustomer ? [fixedCustomer] : []);
        return;
      }
      setIsSearching(true);
      setSearchError(false);
      setSearchResults([]);
      const result = await accessApiService.listAccessCustomers(query);
      if (requestId !== searchRequestId.current) {
        return;
      }
      setSearch(query);
      setIsSearching(false);
      if (result.ok) {
        setSearchResults(result.customers);
        return;
      }
      setSearchError(true);
    },
    [fixedCustomer],
  );

  async function reloadScopes(): Promise<boolean> {
    const result = await accessApiService.listMemberAccessScopes(member.id);
    if (result.ok) {
      setAccessScopes(result.accessScopes);
      return true;
    }
    return false;
  }

  async function toggleScope(
    scope: AccessScopeDto,
    roleId: string,
    checked: boolean,
  ) {
    if (reloadError) {
      return;
    }
    const key = scopeKey(scope, roleId);
    setPendingKeys((current) => [...current, key]);
    const existing = findDirectScopeAssignment(accessScopes, roleId, scope);
    await mutation.submit(async (current) => {
      const result = checked
        ? await accessApiService.grantAccessScope(member.id, {
            roleId,
            scope,
            version: current.version,
          })
        : existing
          ? await accessApiService.revokeAccessScope(member.id, existing.id, {
              version: current.version,
            })
          : { ok: true as const, member: current };

      if (!result.ok) {
        if ("current" in result) {
          setReloadError(!(await reloadScopes()));
        }
        return result;
      }

      const grantedScope =
        "accessScope" in result ? result.accessScope : undefined;
      if (checked && grantedScope) {
        const role = roles.find((entry) => entry.id === roleId);
        const customer = customers.find(
          (entry) => entry.id === scope.customerId,
        );
        const project =
          scope.type === AccessScopeType.Project
            ? projectsByCustomer[scope.customerId]?.find(
                (entry) => entry.id === scope.projectId,
              )
            : undefined;
        if (role && customer) {
          setAccessScopes((currentScopes) => [
            ...currentScopes,
            {
              ...grantedScope,
              memberDisplayName: member.displayName,
              roleName: role.name,
              roleSystemKey: role.systemKey,
              roleActive: role.active,
              customerNumber: customer.customerNumber,
              customerDisplayName: customer.displayName,
              projectTitle: project?.title ?? null,
            },
          ]);
        }
      } else if (existing) {
        setAccessScopes((currentScopes) =>
          currentScopes.filter((entry) => entry.id !== existing.id),
        );
      }
      return { ok: true as const, current: result.member };
    });
    setPendingKeys((current) => current.filter((entry) => entry !== key));
  }

  async function loadCustomerProjects(customerId: string) {
    const nodeId = customerNodeId(customerId);
    if (
      projectsByCustomer[customerId] ||
      projectLoads.current.has(customerId)
    ) {
      return;
    }
    projectLoads.current.add(customerId);
    setProjectErrorIds((current) => current.filter((id) => id !== customerId));
    setLoadingIds((current) => [...current, nodeId]);
    const result =
      await accessApiService.listAccessCustomerProjects(customerId);
    if (result.ok) {
      setProjectsByCustomer((current) => ({
        ...current,
        [customerId]: result.projects,
      }));
    } else {
      setProjectErrorIds((current) => [...new Set([...current, customerId])]);
    }
    projectLoads.current.delete(customerId);
    setLoadingIds((current) => current.filter((id) => id !== nodeId));
  }

  function toggleCustomer(customerId: string, expanded: boolean) {
    const nodeId = customerNodeId(customerId);
    setExpandedIds((current) =>
      expanded
        ? [...new Set([...current, nodeId])]
        : current.filter((id) => id !== nodeId),
    );
    if (expanded) {
      void loadCustomerProjects(customerId);
    }
  }

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
          findDirectScopeAssignment(accessScopes, role.id, customerScope),
        );
        return {
          role,
          checked: direct,
          direct,
          disabled: !canManageAccess || reloadError,
          inherited: false,
          pending: pendingKeys.includes(scopeKey(customerScope, role.id)),
          removeDirectDisabled: true,
        };
      }),
    });
    const knownProjects =
      projectsByCustomer[customer.id] ??
      accessScopes
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
            accessScopes,
            customer.id,
            role.id,
          );
          const direct = Boolean(
            findDirectScopeAssignment(accessScopes, role.id, projectScope),
          );
          return {
            role,
            checked: inherited || direct,
            direct,
            disabled: !canManageAccess || reloadError || inherited,
            inherited,
            pending: pendingKeys.includes(scopeKey(projectScope, role.id)),
            removeDirectDisabled: !canManageAccess || reloadError,
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
        ...member.roles.map((role) => role.id),
        ...accessScopes
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
    <div className={styles.root}>
      <div className={styles.globalHint}>
        <p>{accessContent.globalRolesHint}</p>
        {onOpenGlobalRolesAction ? (
          <ButtonControl
            onClick={onOpenGlobalRolesAction}
            type="button"
            variant="ghost"
          >
            {accessContent.openGlobalRoles}
          </ButtonControl>
        ) : null}
      </div>
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

      {accessScopes.length === 0 && !search ? (
        <section className={styles.empty}>
          <h3>{accessContent.emptyTitle}</h3>
          <p>{accessContent.emptyDescription}</p>
        </section>
      ) : null}
      {noResults ? (
        <section className={styles.empty} data-kind="no-results">
          <h3>{accessContent.noResultsTitle}</h3>
          <p>{formatMessage(accessContent.noResultsDescription, { search })}</p>
          <ButtonControl
            onClick={() => {
              searchRequestId.current += 1;
              setSearch("");
              setIsSearching(false);
              setSearchError(false);
              setSearchResults([]);
            }}
            type="button"
            variant="ghost"
          >
            {accessContent.resetSearch}
          </ButtonControl>
        </section>
      ) : null}

      {mutation.hasConflict && !reloadError ? (
        <p className={styles.conflict} role="alert">
          {accessContent.conflict}
        </p>
      ) : null}
      {reloadError ? (
        <div className={styles.inlineError} role="alert">
          <p>{accessContent.reloadError}</p>
          <ButtonControl
            onClick={() => {
              void reloadScopes().then((loaded) => setReloadError(!loaded));
            }}
            type="button"
            variant="ghost"
          >
            {accessContent.retryReload}
          </ButtonControl>
        </div>
      ) : null}
      {mutation.errorCode ? (
        <p className={styles.error} role="alert">
          {accessContent.errors[
            mutation.errorCode as keyof typeof accessContent.errors
          ] ?? accessContent.errors.INTERNAL}
        </p>
      ) : null}
    </div>
  );
}
