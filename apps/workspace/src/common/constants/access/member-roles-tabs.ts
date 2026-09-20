/** The two panels of the merged member roles dialog: workspace-wide roles and per-customer/project roles. */
export const MemberRolesTab = {
  Global: "global",
  Customer: "customer",
} as const;

export type MemberRolesTab =
  (typeof MemberRolesTab)[keyof typeof MemberRolesTab];

export const MEMBER_ROLES_TAB_VALUES = [
  MemberRolesTab.Global,
  MemberRolesTab.Customer,
] as const;
