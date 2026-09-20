import type { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";

export interface PermissionDefinition {
  /** Realm the permission belongs to; a role can only bundle permissions of its own realm. */
  realm: AuthRealm;
  /**
   * False keeps the permission out of every custom role. Only system roles may hold it,
   * which prevents a role manager from building a privilege-escalation chain.
   */
  delegable: boolean;
  /** Whether a role holding this permission may be assigned to a customer or project scope. */
  scopeAssignable: boolean;
  /**
   * Scope types this permission is meaningful for once its role is scope-assignable. Empty when
   * `scopeAssignable` is false. A permission whose entity only exists at the customer level (e.g.
   * `CustomersWrite`) never lists `project` here, even though a project-scoped grant of it would
   * be technically accepted — it would just be inert, since no authorization check ever reads a
   * customer-entity permission from a project-scoped grant.
   */
  assignableScopeTypes: readonly AccessScopeType[];
  /** Developer-facing explanation mirrored into `permissions.description`; never shown in the UI. */
  description: string;
}
