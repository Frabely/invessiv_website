import type { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { Permission } from "@invessiv/common/constants/auth/permissions";

export interface SystemRoleDefinition {
  /** Fixed id seeded by the migration, so seeds and smokes can reference the role without a lookup. */
  id: string;
  /** Realm of the role; only permissions of the same realm can be attached. */
  realm: AuthRealm;
  /** Developer label mirrored into `roles.name`; the UI resolves its label from the system key. */
  name: string;
  /** Exact permission set; system roles are immutable, so code and database must match. */
  permissions: readonly Permission[];
}
