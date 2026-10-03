import type { OnboardingStructureDialogKind } from "@/common/constants/crm/onboarding/onboarding-structure-dialog-kinds";

/** Which dialog of the structure tab is open; `null` while none is. */
export type OnboardingStructureDialog =
  | {
      kind: typeof OnboardingStructureDialogKind.Picker;
      failure: string | null;
    }
  | {
      kind: typeof OnboardingStructureDialogKind.Template;
      failure: string | null;
    }
  | { kind: typeof OnboardingStructureDialogKind.Own; failure: string | null }
  | { kind: typeof OnboardingStructureDialogKind.Remove; blockId: string }
  | null;
