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

/** Everything a form DTO is made of, loaded for one viewer. */
export type OnboardingFormParts = {
  form: OnboardingFormRow;
  steps: readonly OnboardingFormBlockRow[];
  blocks: readonly QuestionnaireBlockDto[];
  answers: readonly OnboardingAnswerRow[];
  groupEntries: readonly OnboardingGroupEntryRow[];
  answerFiles: readonly OnboardingAnswerFileWithFile[];
  services: readonly OnboardingFormServiceDto[];
};
