import type { Permission } from "@invessiv/common/constants/auth/permissions";

/** Body of `POST /api/workspace/roles`. Always creates a custom workspace role. */
export interface CreateRoleRequestDto {
  /** Enables grants limited to one customer or project; all included permissions must support it. */
  scopeAssignable?: boolean;
  /** Unique per realm, compared case-insensitively and without surrounding spaces. */
  name: string;
  /** Optional explanation for other owners; empty input is stored as null. */
  description: string | null;
  /**
   * Delegable workspace permissions only. Delegability is read from the catalog in code; a
   * non-delegable key is rejected, whatever the client believes about it.
   */
  permissions: Permission[];
}
