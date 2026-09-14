import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PermissionHolder } from "@invessiv/common/contracts/auth/permission-holder";
import { can } from "@invessiv/common/patterns/auth/can";
import type { LeadActionPermissions } from "@/common/contracts/leads/lead-action-permissions";

export function resolveLeadActionPermissions(
  holder: PermissionHolder,
): LeadActionPermissions {
  return {
    canWrite: can(holder, Permission.LeadsWrite),
    canDelete: can(holder, Permission.LeadsDelete),
    canImport: can(holder, Permission.LeadsImport),
    canGenerateOutreach: can(holder, Permission.OutreachGenerate),
  };
}
