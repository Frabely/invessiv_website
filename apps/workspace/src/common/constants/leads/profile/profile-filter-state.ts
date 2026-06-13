export const ProfileFilterState = {
  Inactive: "inactive",
  Include: "include",
  Exclude: "exclude",
} as const;

export type ProfileFilterState =
  (typeof ProfileFilterState)[keyof typeof ProfileFilterState];
