import type { PortalContactDto } from "./portal-contact.dto";
import type { PortalInvitationDto } from "./portal-invitation.dto";
import type { PortalMembershipDto } from "./portal-membership.dto";
import type { PortalRoleDto } from "./portal-role.dto";

export interface PortalAccessDto {
  /** Customer whose access records passed the caller's portal.manage scope. */
  customerId: string;
  /** Required when confirming the customer's first portal preview. */
  customerVersion: number;
  /** Null until an internal member confirms the first-invitation preview. */
  previewConfirmedAt: string | null;
  /** Existing assignments that can be selected in the invitation dialog. */
  contacts: PortalContactDto[];
  /** Portal-realm roles, including inactive roles needed to display history. */
  roles: PortalRoleDto[];
  /** Unredeemed and unrevoked invitations for this customer. */
  invitations: PortalInvitationDto[];
  /** Active memberships only; revoked rows remain in database history. */
  memberships: PortalMembershipDto[];
}
