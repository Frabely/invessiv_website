import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { OnboardingFormContextDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-context.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireChoiceDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-choice.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";

const BLOCK = "block-1";

function choice(
  id: string,
  key: string,
  position: number,
): QuestionnaireChoiceDto {
  return {
    id,
    key,
    position,
    labels: { de: `${key} de`, en: `${key} en` },
    version: 1,
  };
}

/** A field whose key is `<id>_key` and whose label is `<id> DE` / `<id> EN`. */
function field(
  id: string,
  type: QuestionnaireFieldType,
  overrides: Partial<QuestionnaireFieldDto> = {},
): QuestionnaireFieldDto {
  return {
    id,
    blockId: BLOCK,
    parentFieldId: null,
    key: `${id}_key`,
    position: 0,
    type,
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: {
      de: { label: `${id} DE`, help: null },
      en: { label: `${id} EN`, help: null },
    },
    choices: [],
    children: [],
    version: 1,
    ...overrides,
  };
}

/** One block `design_direction` that holds every answer shape the export knows. */
export function exportFieldsFixture(): QuestionnaireFieldDto[] {
  return [
    field("tone", QuestionnaireFieldType.LongText, {
      position: 0,
      requirement: QuestionnaireFieldRequirement.Required,
    }),
    field("style", QuestionnaireFieldType.MultiChoice, {
      position: 1,
      choices: [choice("modern", "modern", 0), choice("classic", "classic", 1)],
    }),
    field("why_classic", QuestionnaireFieldType.ShortText, {
      position: 2,
      conditionFieldId: "style",
      conditionChoiceId: "classic",
    }),
    field("formality", QuestionnaireFieldType.Scale, {
      position: 3,
      choices: [choice("low", "low", 0), choice("high", "high", 1)],
    }),
    field("logo", QuestionnaireFieldType.Files, { position: 4 }),
    field("team", QuestionnaireFieldType.Group, {
      position: 5,
      children: [
        field("member_name", QuestionnaireFieldType.ShortText, {
          parentFieldId: "team",
          position: 0,
        }),
        field("portrait", QuestionnaireFieldType.Files, {
          parentFieldId: "team",
          position: 1,
        }),
      ],
    }),
    field("services", QuestionnaireFieldType.ProjectServices, { position: 6 }),
    field("terms", QuestionnaireFieldType.Confirmation, { position: 7 }),
  ];
}

/** An uploaded image attached to a field; the file id is `file-<id>`. */
export function exportAttachmentFixture(
  id: string,
  fieldId: string,
  groupEntryId: string | null,
  name: string,
  file: Partial<FileAttachmentDto> = {},
): QuestionnaireAnswerFileDto {
  return {
    id,
    fieldId,
    groupEntryId,
    position: 0,
    file: {
      id: `file-${id}`,
      displayName: name,
      assetKind: AssetKind.Image,
      source: FileSource.Upload,
      extension: null,
      sizeBytes: 10,
      url: null,
      note: null,
      createdAt: "2026-10-01T00:00:00.000Z",
      ...file,
    },
  };
}

/** A released form with the block of `exportFieldsFixture` and one booked service. */
export function exportFormFixture(
  overrides: Partial<OnboardingFormDto> = {},
): OnboardingFormDto {
  return {
    id: "form-1",
    customerId: "customer-1",
    projectId: "project-1",
    sourceTemplateId: null,
    status: OnboardingFormStatus.Open,
    createdByMemberId: "member-1",
    releasedAt: "2026-10-02T00:00:00.000Z",
    releasedByMemberId: "member-1",
    submittedAt: null,
    submittedByPortalMembershipId: null,
    servicesConfirmedAt: null,
    servicesConfirmedByPortalMembershipId: null,
    servicesNote: null,
    servicesChangedSinceConfirmation: false,
    callHeldOn: null,
    completedAt: null,
    completedByMemberId: null,
    blocks: [
      {
        position: 0,
        reviewStatus: OnboardingBlockReviewStatus.Pending,
        clarificationMode: null,
        reviewNote: null,
        reviewedByMemberId: null,
        reviewedAt: null,
        version: 1,
        block: {
          id: BLOCK,
          key: "design_direction",
          carryOver: false,
          status: QuestionnaireCatalogStatus.Active,
          sourceBlockId: null,
          translations: {
            de: { title: "Design", intro: null },
            en: { title: "Design EN", intro: null },
          },
          fields: exportFieldsFixture(),
          version: 1,
        },
      },
    ],
    answers: [],
    answerFiles: [],
    hiddenAnswerFiles: [],
    groupEntries: [],
    services: [
      {
        projectLineItemId: "li-1",
        title: "Website",
        description: null,
        position: 0,
      },
    ],
    version: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

export function exportContextFixture(): OnboardingFormContextDto {
  return {
    customerId: "customer-1",
    customerName: "Muster GmbH",
    projectId: "project-1",
    projectTitle: "Relaunch",
    projectPhase: ProjectPhase.Onboarding,
    templateTitle: null,
  };
}
