export const TriState = {
  Off: "off",
  Include: "include",
  Exclude: "exclude",
} as const;

export type TriState = (typeof TriState)[keyof typeof TriState];
