import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { OnboardingFormServiceDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-service.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type {
  onboardingAnswerFiles,
  onboardingAnswers,
  onboardingFormBlocks,
  onboardingForms,
  onboardingGroupEntries,
} from "@invessiv/db/record-configuration";
import type { FileRow } from "@/server/shared/files/file-object-service-types";

export type OnboardingFormRow = typeof onboardingForms.$inferSelect;
export type OnboardingFormBlockRow = typeof onboardingFormBlocks.$inferSelect;
export type OnboardingAnswerRow = typeof onboardingAnswers.$inferSelect;
export type OnboardingGroupEntryRow =
  typeof onboardingGroupEntries.$inferSelect;
export type OnboardingAnswerFileRow = typeof onboardingAnswerFiles.$inferSelect;

/** A file link together with the file entry it points at. */
export type OnboardingAnswerFileWithFile = {
  link: OnboardingAnswerFileRow;
  file: FileRow;
};

/** What a service entry is built from, whether it is a live line item or a snapshot row. */
export type OnboardingServiceSource = Pick<
  OnboardingFormServiceDto,
  "projectLineItemId" | "title" | "description"
>;

/** One slot of a form: a field on block level, or a sub-field within one group entry. */
export type OnboardingAnswerSlot = {
  formId: string;
  fieldId: string;
  groupEntryId: string | null;
};

/** What a slot holds: text values or selected options, never both. Empty means no answer. */
export type OnboardingSlotContent =
  { values: readonly string[] } | { choiceIds: readonly string[] };

export type OnboardingSlotWrite = {
  slot: OnboardingAnswerSlot;
  content: OnboardingSlotContent;
};

/** Who wrote an answer: a contact in the portal, or a member through the pre-fill. */
export type OnboardingAnswerAuthor =
  { portalMembershipId: string } | { memberId: string };

/** A status change the customer triggers, with what its activity and chat notice need. */
export type OnboardingCustomerTransition = {
  actor: ActivityActor;
  portalMembershipId: string;
  projectTitle: string;
};

/** A status change the team triggers, with what its activity and chat notice need. */
export type OnboardingMemberTransition = {
  actor: ActivityActor;
  memberId: string;
  projectTitle: string;
};

/** A block the team hands back to the customer, as activity and chat notice name it. */
export type OnboardingRequestedBlock = {
  blockId: string;
  title: string;
  note: string;
};

/** The change request of the team with the blocks it reopens. */
export type OnboardingChangeRequest = OnboardingMemberTransition & {
  requested: readonly OnboardingRequestedBlock[];
};

/** The completion by the team: the day the call took place and whether the project moves on. */
export type OnboardingCompletion = OnboardingMemberTransition & {
  callHeldOn: string;
  advancePhase: boolean;
};

/** Everything a form DTO is made of, loaded for one viewer. */
export type OnboardingFormParts = {
  form: OnboardingFormRow;
  steps: readonly OnboardingFormBlockRow[];
  blocks: readonly QuestionnaireBlockDto[];
  answers: readonly OnboardingAnswerRow[];
  groupEntries: readonly OnboardingGroupEntryRow[];
  answerFiles: readonly OnboardingAnswerFileWithFile[];
  services: readonly OnboardingFormServiceDto[];
  servicesChangedSinceConfirmation: boolean;
};
