export const AccessScopeType = {
  Customer: "customer",
  Project: "project",
} as const;

export const AccessScopeKind = {
  All: "all",
  Limited: "limited",
} as const;

export type AccessScopeKind =
  (typeof AccessScopeKind)[keyof typeof AccessScopeKind];

export type AccessScopeType =
  (typeof AccessScopeType)[keyof typeof AccessScopeType];

export const ACCESS_SCOPE_TYPE_VALUES = [
  AccessScopeType.Customer,
  AccessScopeType.Project,
] as const;
