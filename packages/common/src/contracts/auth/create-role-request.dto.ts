import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";

/** Body of `POST /api/workspace/roles`. Creates a custom role in the selected realm. */
export interface CreateRoleRequestDto {
  /** Existing callers omit this and create a workspace role. */
  realm?: AuthRealm;
  /** False creates a global role; true creates a customer/project role. Immutable after creation. */
  scopeAssignable: boolean;
  /** Unique per realm, compared case-insensitively and without surrounding spaces. */
  name: string;
  /** Optional explanation for other owners; empty input is stored as null. */
  description: string | null;
  /**
   * Delegable permissions from the selected realm only. Delegability is read from the catalog in code; a
   * non-delegable key is rejected, whatever the client believes about it.
   */
  permissions: Permission[];
}
