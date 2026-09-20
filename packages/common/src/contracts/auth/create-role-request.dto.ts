import type { Permission } from "@invessiv/common/constants/auth/permissions";

/** Body of `POST /api/workspace/roles`. Always creates a custom workspace role. */
export interface CreateRoleRequestDto {
  /** False creates a global role; true creates a customer/project role. Immutable after creation. */
  scopeAssignable: boolean;
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
