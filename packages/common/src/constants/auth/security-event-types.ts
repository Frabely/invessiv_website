export const SecurityEventType = {
  WorkspaceOwnerBootstrapped: "workspace_owner_bootstrapped",
  WorkspaceMemberAdded: "workspace_member_added",
  WorkspaceMemberRolesChanged: "workspace_member_roles_changed",
  WorkspaceOwnerGranted: "workspace_owner_granted",
  WorkspaceOwnerRevoked: "workspace_owner_revoked",
  WorkspaceMemberDeactivated: "workspace_member_deactivated",
  WorkspaceMemberActivated: "workspace_member_activated",
  WorkspaceResponsibilitiesHandedOver: "workspace_responsibilities_handed_over",
  RoleCreated: "role_created",
  RoleUpdated: "role_updated",
  WorkspaceMemberAccessScopeGranted: "workspace_member_access_scope_granted",
  WorkspaceMemberAccessScopeRevoked: "workspace_member_access_scope_revoked",
  PortalInvitationCreated: "portal_invitation_created",
  PortalInvitationRevoked: "portal_invitation_revoked",
  PortalInvitationRedeemed: "portal_invitation_redeemed",
  PortalMembershipRevoked: "portal_membership_revoked",
  PortalMembershipRolesReplaced: "portal_membership_roles_replaced",
  PortalOwnerViewOpened: "portal_owner_view_opened",
} as const;

export type SecurityEventType =
  (typeof SecurityEventType)[keyof typeof SecurityEventType];

export const SECURITY_EVENT_TYPE_VALUES = [
  SecurityEventType.WorkspaceOwnerBootstrapped,
  SecurityEventType.WorkspaceMemberAdded,
  SecurityEventType.WorkspaceMemberRolesChanged,
  SecurityEventType.WorkspaceOwnerGranted,
  SecurityEventType.WorkspaceOwnerRevoked,
  SecurityEventType.WorkspaceMemberDeactivated,
  SecurityEventType.WorkspaceMemberActivated,
  SecurityEventType.WorkspaceResponsibilitiesHandedOver,
  SecurityEventType.RoleCreated,
  SecurityEventType.RoleUpdated,
  SecurityEventType.WorkspaceMemberAccessScopeGranted,
  SecurityEventType.WorkspaceMemberAccessScopeRevoked,
  SecurityEventType.PortalInvitationCreated,
  SecurityEventType.PortalInvitationRevoked,
  SecurityEventType.PortalInvitationRedeemed,
  SecurityEventType.PortalMembershipRevoked,
  SecurityEventType.PortalMembershipRolesReplaced,
  SecurityEventType.PortalOwnerViewOpened,
] as const;
