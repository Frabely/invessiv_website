import type { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import type { Permission } from "@invessiv/common/constants/auth/permissions";

/**
 * Whether a role built from these permissions has anything meaningful to grant at the given
 * scope type. A role made purely of customer-entity permissions (e.g. `CustomersRead`) has
 * nothing to offer on a single project and should not be presented there.
 */
export function roleAppliesToScopeType(
  permissions: readonly Permission[],
  scopeType: AccessScopeType,
): boolean {
  return permissions.some((permission) =>
    PERMISSION_DEFINITIONS[permission].assignableScopeTypes.includes(scopeType),
  );
}
