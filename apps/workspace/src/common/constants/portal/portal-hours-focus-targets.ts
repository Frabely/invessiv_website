export const PortalHoursFocusTarget = {
  Project: "project",
  Overview: "overview",
} as const;

export type PortalHoursFocusTarget =
  (typeof PortalHoursFocusTarget)[keyof typeof PortalHoursFocusTarget];
