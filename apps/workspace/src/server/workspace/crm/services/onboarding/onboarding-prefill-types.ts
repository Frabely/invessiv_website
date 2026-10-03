import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type {
  OnboardingAnswerFileWrite,
  OnboardingFormRow,
  OnboardingGroupEntryWrite,
  OnboardingSlotWrite,
} from "@/server/shared/services/onboarding/onboarding-form-types";

/** The form that gets pre-filled and the actor whose rights bound what may be read. */
export type PrefillTarget = {
  form: Pick<OnboardingFormRow, "id" | "customer_id">;
  /** The new blocks of the form; blocks it already had are never touched. */
  blockIds: readonly string[];
  /** Marks every pre-filled answer and bounds what may be read: the pre-fill never exceeds the actor's rights. */
  actor: WorkspaceActor;
};

/** What the pre-fill has collected to write; the sources add to it one after another. */
export type PrefillRows = {
  answers: OnboardingSlotWrite[];
  entries: OnboardingGroupEntryWrite[];
  files: OnboardingAnswerFileWrite[];
};
