/** The one server command a change of the ordered block list of a form stands for. */
export const OnboardingBlockListChangeKind = {
  Move: "move",
  Remove: "remove",
} as const;

export type OnboardingBlockListChangeKind =
  (typeof OnboardingBlockListChangeKind)[keyof typeof OnboardingBlockListChangeKind];
