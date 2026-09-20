"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { roleAppliesToScopeType } from "@invessiv/common/patterns/auth/role-applies-to-scope-type";
import { accessApiService } from "@/client/access/access-api-service";
import {
  findDirectScopeAssignment,
  mergeAccessCustomers,
} from "@/common/patterns/access/access-scope-tree";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";

type TouchedTarget =
  | { type: typeof AccessScopeType.Customer; customerId: string; label: string }
  | {
      type: typeof AccessScopeType.Project;
      customerId: string;
      projectId: string;
      label: string;
    };

function customerNodeId(customerId: string) {
  return `customer:${customerId}`;
}

function scopeKey(scope: AccessScopeDto, roleId: string) {
  return scope.type === AccessScopeType.Customer
    ? `${scope.type}:${scope.customerId}:${roleId}`
    : `${scope.type}:${scope.projectId}:${roleId}`;
}

export function useAccessScopeTree({
  fixedCustomer,
  initialAccessScopes,
  member,
  roles,
}: {
  fixedCustomer?: AccessCustomerOptionDto;
  initialAccessScopes: readonly AccessScopeEntryDto[];
  member: WorkspaceMemberDto;
  roles: readonly RoleAssignmentOptionDto[];
}) {
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
      if (requestId !== searchRequestId.current) return;
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
    if (reloadError) return;
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
        if ("current" in result) setReloadError(!(await reloadScopes()));
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
    if (expanded) void loadCustomerProjects(customerId);
  }

  function resetSearch() {
    searchRequestId.current += 1;
    setSearch("");
    setIsSearching(false);
    setSearchError(false);
    setSearchResults([]);
  }

  function isPending(scope: AccessScopeDto, roleId: string) {
    return pendingKeys.includes(scopeKey(scope, roleId));
  }

  return {
    accessScopes,
    commitSearch,
    customers,
    expandedIds,
    isSearching,
    isPending,
    loadingIds,
    loadCustomerProjects,
    mutation,
    offeredProjectRoles,
    offeredRoles,
    projectErrorIds,
    projectsByCustomer,
    reloadError,
    reloadScopes,
    resetSearch,
    search,
    searchError,
    searchResults,
    setReloadError,
    setTouched,
    toggleCustomer,
    toggleScope,
    touched,
  };
}
