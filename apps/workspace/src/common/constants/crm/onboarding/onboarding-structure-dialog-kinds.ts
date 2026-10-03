/** The short-lived dialogs of the structure tab of a form. */
export const OnboardingStructureDialogKind = {
  Picker: "picker",
  Own: "own",
  Remove: "remove",
} as const;

export type OnboardingStructureDialogKind =
  (typeof OnboardingStructureDialogKind)[keyof typeof OnboardingStructureDialogKind];
