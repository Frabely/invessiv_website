import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessScopeDto } from "@invessiv/common/contracts/auth/access-scope.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";

export function findDirectScopeAssignment(
  accessScopes: readonly AccessScopeEntryDto[],
  roleId: string,
  scope: AccessScopeDto,
): AccessScopeEntryDto | undefined {
  return accessScopes.find((entry) => {
    if (entry.roleId !== roleId || entry.scope.type !== scope.type) {
      return false;
    }
    if (scope.type === AccessScopeType.Customer) {
      return entry.scope.customerId === scope.customerId;
    }
    return (
      entry.scope.type === AccessScopeType.Project &&
      entry.scope.customerId === scope.customerId &&
      entry.scope.projectId === scope.projectId
    );
  });
}

export function isRoleInheritedFromCustomer(
  accessScopes: readonly AccessScopeEntryDto[],
  customerId: string,
  roleId: string,
): boolean {
  return accessScopes.some(
    (entry) =>
      entry.roleId === roleId &&
      entry.scope.type === AccessScopeType.Customer &&
      entry.scope.customerId === customerId,
  );
}

export function mergeAccessCustomers(
  accessScopes: readonly AccessScopeEntryDto[],
  searchResults: readonly AccessCustomerOptionDto[],
): AccessCustomerOptionDto[] {
  const customers = new Map<string, AccessCustomerOptionDto>();
  for (const entry of accessScopes) {
    if (!customers.has(entry.scope.customerId)) {
      customers.set(entry.scope.customerId, {
        id: entry.scope.customerId,
        customerNumber: entry.customerNumber,
        displayName: entry.customerDisplayName,
      });
    }
  }
  for (const customer of searchResults) {
    if (!customers.has(customer.id)) {
      customers.set(customer.id, customer);
    }
  }
  return [...customers.values()];
}
