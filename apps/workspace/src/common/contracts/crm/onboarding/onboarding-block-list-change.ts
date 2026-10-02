import type { OnboardingBlockListChangeKind } from "@/common/constants/crm/onboarding/onboarding-block-list-change-kinds";

/** The one server command a change of the ordered block list stands for. */
export type OnboardingBlockListChange =
  | {
      kind: typeof OnboardingBlockListChangeKind.Move;
      blockId: string;
      direction: -1 | 1;
    }
  | { kind: typeof OnboardingBlockListChangeKind.Remove; blockId: string }
  | null;
