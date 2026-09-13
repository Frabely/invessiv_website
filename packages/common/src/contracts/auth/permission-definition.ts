import type { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";

export interface PermissionDefinition {
  /** Realm the permission belongs to; a role can only bundle permissions of its own realm. */
  realm: AuthRealm;
  /**
   * False keeps the permission out of every custom role. Only system roles may hold it,
   * which prevents a role manager from building a privilege-escalation chain.
   */
  delegable: boolean;
  /** Developer-facing explanation mirrored into `permissions.description`; never shown in the UI. */
  description: string;
}
