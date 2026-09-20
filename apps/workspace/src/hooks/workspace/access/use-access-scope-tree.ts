"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { roleAppliesToScopeType } from "@invessiv/common/patterns/auth/role-applies-to-scope-type";
import { accessApiService } from "@/client/access/access-api-service";
import type { AccessScopeTreeTarget } from "@/common/contracts/access/access-scope-tree-target";
import {
  accessScopeAssignmentKey,
  haveSameAccessScopeAssignments,
  mergeAccessCustomers,
} from "@/common/patterns/access/access-scope-tree";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";

export function useAccessScopeTree({
  fixedCustomer,
  initialAccessScopes,
  member,
  onSavedAction,
  roles,
}: {
  fixedCustomer?: AccessCustomerOptionDto;
  initialAccessScopes: readonly AccessScopeEntryDto[];
  member: WorkspaceMemberDto;
  onSavedAction: () => void;
  roles: readonly RoleAssignmentOptionDto[];
}) {
  const [initialAssignments, setInitialAssignments] = useState<
    AccessScopeAssignmentDto[]
  >(() => initialAccessScopes.map(({ roleId, scope }) => ({ roleId, scope })));
  const [assignments, setAssignments] =
    useState<AccessScopeAssignmentDto[]>(initialAssignments);
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
  const [projectErrorIds, setProjectErrorIds] = useState<string[]>([]);
  const [scopeReloadError, setScopeReloadError] = useState(false);
  const [touched, setTouched] = useState<AccessScopeTreeTarget | null>(null);
  const searchRequestId = useRef(0);
  const projectLoads = useRef(new Set<string>());

  async function reloadScopesAfterConflict() {
    const result = await accessApiService.listMemberAccessScopes(member.id);
    if (!result.ok) {
      setScopeReloadError(true);
      return;
    }
    const latest = result.accessScopes.map(({ roleId, scope }) => ({
      roleId,
      scope,
    }));
    setInitialAssignments(latest);
    setAssignments(latest);
    setScopeReloadError(false);
  }

  const mutation = useVersionedMutation(member, onSavedAction, {
    onConflictAction: reloadScopesAfterConflict,
  });
  const isDirty = !haveSameAccessScopeAssignments(
    assignments,
    initialAssignments,
  );

  const offeredRoles = useMemo(() => {
    const heldIds = new Set(initialAssignments.map(({ roleId }) => roleId));
    return roles.filter(
      (role) => role.scopeAssignable && (role.active || heldIds.has(role.id)),
    );
  }, [initialAssignments, roles]);
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
        : mergeAccessCustomers(initialAccessScopes, searchResults),
    [fixedCustomer, initialAccessScopes, searchResults],
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

  function toggleScope(
    scope: AccessScopeDto,
    roleId: string,
    checked: boolean,
  ) {
    const assignment = { roleId, scope };
    const key = accessScopeAssignmentKey(assignment);
    setAssignments((current) =>
      checked
        ? current.some((entry) => accessScopeAssignmentKey(entry) === key)
          ? current
          : [...current, assignment]
        : current.filter((entry) => accessScopeAssignmentKey(entry) !== key),
    );
  }

  async function submit() {
    if (scopeReloadError) return;
    await mutation.submit((current) =>
      accessApiService.replaceAccessScopes(member.id, {
        assignments,
        version: current.version,
      }),
    );
  }

  async function loadCustomerProjects(customerId: string) {
    const nodeId = `customer:${customerId}`;
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
    const nodeId = `customer:${customerId}`;
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

  return {
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
  };
}
