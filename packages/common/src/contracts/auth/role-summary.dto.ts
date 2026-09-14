import type { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";

/** The part of a role a member row needs to show its badges. */
export interface RoleSummaryDto {
  /** Stable role id; `PUT …/members/[id]/roles` sends these ids. */
  id: string;
  /**
   * Custom name as stored. For system roles the UI shows the dictionary label resolved from
   * `systemKey` instead, so this value is never translated.
   */
  name: string;
  /** Null for custom roles. Set only for the fixed, migration-seeded system roles. */
  systemKey: SystemRoleKey | null;
  /**
   * An inactive role stays assigned but grants nothing until it is activated again, so the UI
   * marks it instead of hiding it.
   */
  active: boolean;
}
