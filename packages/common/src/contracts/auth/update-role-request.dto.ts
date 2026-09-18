import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";

/** Body of `PATCH /api/workspace/roles/[id]`. Rejected for system roles. */
export interface UpdateRoleRequestDto extends VersionedWriteInput {
  /** Enables or disables grants limited to one customer or project. */
  scopeAssignable?: boolean;
  /** Unique per realm, compared case-insensitively and without surrounding spaces. */
  name: string;
  /** Optional explanation; empty input is stored as null. */
  description: string | null;
  /** False keeps the role assigned but makes it grant nothing on the next request. */
  active: boolean;
  /** The complete permission set afterwards, delegable workspace permissions only. */
  permissions: Permission[];
}
