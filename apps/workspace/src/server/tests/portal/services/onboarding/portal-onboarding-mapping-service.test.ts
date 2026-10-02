import { describe, expect, it } from "vitest";

import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import { portalOnboardingMappingService } from "@/server/portal/services/onboarding/portal-onboarding-mapping-service";
import type { PortalOnboardingFormParts } from "@/server/portal/services/onboarding/portal-onboarding-types";
import {
  blockFixture,
  choicesFixture,
  fieldFixture,
} from "../../../workspace/crm/support/questionnaire-definition-fixtures";

function step(
  block: QuestionnaireBlockDto,
  overrides: Partial<OnboardingFormBlockDto> = {},
): OnboardingFormBlockDto {
  return {
    position: 0,
    reviewStatus: OnboardingBlockReviewStatus.Pending,
    clarificationMode: null,
    reviewNote: null,
    reviewedByMemberId: null,
    reviewedAt: null,
    version: 1,
    block,
    ...overrides,
  };
}

function form(blocks: OnboardingFormBlockDto[]): OnboardingFormDto {
  return {
    id: "form-1",
    customerId: "customer-1",
    projectId: "project-1",
    sourceTemplateId: "template-1",
    status: OnboardingFormStatus.Open,
    createdByMemberId: "member-1",
    releasedAt: "2026-10-01T08:00:00.000Z",
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
    blocks,
    answers: [],
    answerFiles: [],
    groupEntries: [],
    services: [],
    version: 3,
    createdAt: "2026-10-01T07:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
  };
}

function parts(
  blocks: OnboardingFormBlockDto[],
  overrides: Partial<PortalOnboardingFormParts> = {},
): PortalOnboardingFormParts {
  return {
    form: form(blocks),
    locale: Locale.De,
    projectTitle: "Website",
    editableBlockIds: [],
    canSubmit: false,
    canAttach: false,
    prefilledBlockIds: new Set(),
    submittedByName: null,
    lastEditedAt: null,
    lastEditedByName: null,
    ...overrides,
  };
}

const bilingual = blockFixture(
  [
    fieldFixture("pick", T.Choice, {
      translations: {
        de: { label: "Auswahl", help: "Hilfe" },
        en: { label: "Pick", help: null },
      },
      choices: choicesFixture("a", "b").map((choice) => ({
        ...choice,
        labels: { de: `DE ${choice.key}`, en: `EN ${choice.key}` },
      })),
    }),
  ],
  {
    translations: {
      de: { title: "Unternehmen", intro: "Kurz zu euch" },
      en: { title: "Company", intro: null },
    },
  },
);

describe("portalOnboardingMappingService.toFormDto", () => {
  it("shows the booked services without internal ids, the remark and the attach right", () => {
    const input = parts([step(bilingual)], { canAttach: true });
    input.form.services = [
      {
        projectLineItemId: "line-1",
        title: "Landingpage",
        description: "Eine Seite mit Kontaktformular",
        position: 0,
      },
      {
        projectLineItemId: null,
        title: "Wartung",
        description: null,
        position: 1,
      },
    ];
    input.form.servicesNote = "Bitte noch das Blog prüfen.";

    const dto = portalOnboardingMappingService.toFormDto(input);

    expect(dto.services).toEqual([
      {
        title: "Landingpage",
        description: "Eine Seite mit Kontaktformular",
        position: 0,
      },
      { title: "Wartung", description: null, position: 1 },
    ]);
    expect(dto.servicesNote).toBe("Bitte noch das Blog prüfen.");
    expect(dto.canAttach).toBe(true);
  });

  it("maps the head and passes answers through", () => {
    const answer = {
      fieldId: "f-pick",
      groupEntryId: null,
      sortOrder: 0,
      value: null,
      choiceId: "c-a",
    };
    const input = parts([step(bilingual)], {
      editableBlockIds: [bilingual.id],
      canSubmit: true,
      submittedByName: "Ada",
      lastEditedAt: new Date("2026-10-01T09:30:00.000Z"),
      lastEditedByName: "Grace",
    });
    input.form.answers = [answer];
    input.form.servicesConfirmedAt = "2026-10-01T09:00:00.000Z";

    expect(portalOnboardingMappingService.toFormDto(input)).toMatchObject({
      id: "form-1",
      projectId: "project-1",
      projectTitle: "Website",
      status: OnboardingFormStatus.Open,
      submittedAt: null,
      submittedByName: "Ada",
      completedAt: null,
      answers: [answer],
      groupEntries: [],
      answerFiles: [],
      servicesConfirmed: true,
      editableBlockIds: [bilingual.id],
      lastEditedAt: "2026-10-01T09:30:00.000Z",
      lastEditedByName: "Grace",
      canSubmit: true,
    });
  });

  it("maps nullable head fields to null and unconfirmed services to false", () => {
    const dto = portalOnboardingMappingService.toFormDto(parts([]));

    expect(dto).toMatchObject({
      blocks: [],
      servicesConfirmed: false,
      lastEditedAt: null,
      lastEditedByName: null,
      submittedByName: null,
      editableBlockIds: [],
      canSubmit: false,
    });
  });

  it("resolves block, field and option texts in the requested locale", () => {
    const [block] = portalOnboardingMappingService.toFormDto(
      parts([step(bilingual)], { locale: Locale.En }),
    ).blocks;

    expect(block).toMatchObject({
      id: bilingual.id,
      title: "Company",
      intro: null,
      fallbackLocale: null,
      fields: [
        {
          id: "f-pick",
          label: "Pick",
          help: null,
          choices: [
            { id: "c-a", position: 0, label: "EN a" },
            { id: "c-b", position: 1, label: "EN b" },
          ],
        },
      ],
    });
  });

  it("falls back to a maintained locale and names it on the block", () => {
    const germanOnly = blockFixture([fieldFixture("name")]);

    const [block] = portalOnboardingMappingService.toFormDto(
      parts([step(germanOnly)], { locale: Locale.En }),
    ).blocks;

    expect(block).toMatchObject({
      title: "Unternehmen",
      fallbackLocale: Locale.De,
      fields: [{ label: "name" }],
    });
  });

  it("flags a fallback even when only one field lacks the locale", () => {
    const mixed = blockFixture([fieldFixture("name")], {
      translations: {
        de: { title: "Unternehmen", intro: null },
        en: { title: "Company", intro: null },
      },
    });

    const [block] = portalOnboardingMappingService.toFormDto(
      parts([step(mixed)], { locale: Locale.En }),
    ).blocks;

    expect(block).toMatchObject({
      title: "Company",
      fallbackLocale: Locale.De,
    });
  });

  it("keeps keys, versions, pre-fill sources and other locales out of the portal", () => {
    const group = fieldFixture("team", T.Group, {
      children: [
        fieldFixture("member", T.ShortText, { parentFieldId: "f-team" }),
      ],
    });
    const [block] = portalOnboardingMappingService.toFormDto(
      parts([step(blockFixture([group]))]),
    ).blocks;

    const [field] = block.fields;
    expect(Object.keys(block).sort()).toEqual(
      [
        "fallbackLocale",
        "fields",
        "id",
        "intro",
        "position",
        "prefilled",
        "reviewNote",
        "title",
      ].sort(),
    );
    for (const mapped of [field, field.children[0]]) {
      expect(mapped).not.toHaveProperty("key");
      expect(mapped).not.toHaveProperty("version");
      expect(mapped).not.toHaveProperty("prefillSource");
      expect(mapped).not.toHaveProperty("translations");
    }
    expect(field.children[0]).toMatchObject({
      id: "f-member",
      parentFieldId: "f-team",
      label: "member",
    });
  });

  it("shows the review note only for a block handed back to the customer, and only once the form went back", () => {
    const reviewed = {
      reviewStatus: OnboardingBlockReviewStatus.Clarification,
      reviewNote: "Bitte ergänzen",
      reviewedByMemberId: "member-1",
      reviewedAt: "2026-10-02T08:00:00.000Z",
    };
    const steps = [
      step(blockFixture([], { id: "customer" }), {
        ...reviewed,
        clarificationMode: OnboardingClarificationMode.Customer,
      }),
      step(blockFixture([], { id: "call" }), {
        ...reviewed,
        position: 1,
        clarificationMode: OnboardingClarificationMode.Call,
      }),
    ];
    const mapped = (status: OnboardingFormStatus) =>
      portalOnboardingMappingService.toFormDto(
        parts(steps, { form: { ...form(steps), status } }),
      ).blocks;
    const blocks = mapped(OnboardingFormStatus.ChangesRequested);

    expect(blocks.map((block) => block.reviewNote)).toEqual([
      "Bitte ergänzen",
      null,
    ]);
    expect(blocks[0]).not.toHaveProperty("reviewedByMemberId");
    // While the team still reviews, a question it has not sent yet stays internal.
    expect(
      mapped(OnboardingFormStatus.Submitted).map((block) => block.reviewNote),
    ).toEqual([null, null]);
  });

  it("marks only company-wide blocks with answers of the team as pre-filled", () => {
    const blocks = portalOnboardingMappingService.toFormDto(
      parts(
        [
          step(blockFixture([], { id: "carried", carryOver: true })),
          step(blockFixture([], { id: "project", carryOver: false })),
          step(blockFixture([], { id: "untouched", carryOver: true })),
        ],
        { prefilledBlockIds: new Set(["carried", "project"]) },
      ),
    ).blocks;

    expect(blocks.map((block) => block.prefilled)).toEqual([
      true,
      false,
      false,
    ]);
  });
});

describe("portalOnboardingMappingService.toSummaryDto", () => {
  it("adds project and edit state to the shared summary", () => {
    const progress = { answeredRequired: 1, totalRequired: 4, ratio: 0.25 };

    expect(
      portalOnboardingMappingService.toSummaryDto(
        {
          id: "form-1",
          status: OnboardingFormStatus.Open,
          progress,
          submittedAt: null,
          completedAt: null,
        },
        { projectId: "project-1", projectTitle: "Website", canEdit: true },
      ),
    ).toEqual({
      id: "form-1",
      projectId: "project-1",
      projectTitle: "Website",
      status: OnboardingFormStatus.Open,
      progress,
      submittedAt: null,
      completedAt: null,
      canEdit: true,
    });
  });
});
