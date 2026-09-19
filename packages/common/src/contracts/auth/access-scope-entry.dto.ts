import type { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { WorkspaceMemberAccessScopeDto } from "@invessiv/common/contracts/auth/workspace-member-access-scope.dto";

/**
 * A scoped role grant with everything a list needs to name it. The command result stays the
 * slim {@link WorkspaceMemberAccessScopeDto}; only the read side pays for the joins.
 */
export interface AccessScopeEntryDto extends WorkspaceMemberAccessScopeDto {
  /** Copied from Clerk for display. Master data only; never used to find or authorize a member. */
  memberDisplayName: string;
  /** Custom name as stored. For system roles the UI shows the label resolved from `roleSystemKey`. */
  roleName: string;
  /** Null for custom roles. Only bindable custom roles appear here today, so this is display-only. */
  roleSystemKey: SystemRoleKey | null;
  /** An inactive role stays granted but confers nothing, so the list marks it instead of hiding it. */
  roleActive: boolean;
  /** Number of the customer the grant belongs to; format it in the view, never here. */
  customerNumber: number;
  /** Display name of the customer the grant belongs to, also for a project-level grant. */
  customerDisplayName: string;
  /** Title of the bound project. Null for a customer-level grant, which covers all projects. */
  projectTitle: string | null;
}
