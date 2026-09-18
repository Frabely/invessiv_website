import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { RoleSummaryDto } from "@invessiv/common/contracts/auth/role-summary.dto";

/** Role data required for assigning roles and previewing the resulting permissions. */
export interface RoleAssignmentOptionDto extends RoleSummaryDto {
  /** Optional explanation shown beside custom roles; system-role copy comes from the dictionary. */
  description: string | null;
  /** Scope-assignable roles are granted per customer or project and cannot be assigned workspace-wide. */
  scopeAssignable?: boolean;
  /** Effective permission keys used only for the assignment preview. */
  permissions: Permission[];
}
