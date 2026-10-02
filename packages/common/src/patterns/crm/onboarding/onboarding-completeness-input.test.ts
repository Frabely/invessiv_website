import { describe, expect, it } from "vitest";
import { OnboardingBlockReviewStatus } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import { AssetKind } from "../../../constants/files/asset-kind";
import { FileSource } from "../../../constants/files/file-source";
import type { OnboardingFormBlockDto } from "../../../contracts/crm/onboarding/onboarding-form-block.dto";
import { toOnboardingCompletenessInput } from "./onboarding-completeness-input";

const STEP: OnboardingFormBlockDto = {
  position: 0,
  reviewStatus: OnboardingBlockReviewStatus.Pending,
  clarificationMode: null,
  reviewNote: null,
  reviewedByMemberId: null,
  reviewedAt: null,
  version: 1,
  block: {
    id: "block-1",
    key: "company",
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    sourceBlockId: null,
    translations: { de: { title: "Unternehmen", intro: null } },
    fields: [],
    version: 1,
  },
};

const VISIBLE = {
  id: "link-1",
  fieldId: "logo",
  groupEntryId: null,
  position: 0,
  file: {
    id: "file-1",
    displayName: "logo.png",
    assetKind: AssetKind.Image,
    source: FileSource.Upload,
    extension: "png" as const,
    sizeBytes: 10,
    url: null,
    note: null,
    createdAt: "2026-10-01T10:00:00.000Z",
  },
};

describe("toOnboardingCompletenessInput", () => {
  it("hands over the block copies and counts hidden files like visible ones", () => {
    const input = toOnboardingCompletenessInput({
      blocks: [STEP],
      answers: [],
      answerFiles: [VISIBLE],
      hiddenAnswerFiles: [{ fieldId: "logo", groupEntryId: "entry-1" }],
      groupEntries: [],
      servicesConfirmedAt: null,
    });

    expect(input.blocks).toEqual([STEP.block]);
    expect(
      input.answerFiles.map(({ fieldId, groupEntryId }) => [
        fieldId,
        groupEntryId,
      ]),
    ).toEqual([
      ["logo", null],
      ["logo", "entry-1"],
    ]);
    expect(input.servicesConfirmed).toBe(false);
  });

  it("reads the confirmation of the services from its timestamp", () => {
    expect(
      toOnboardingCompletenessInput({
        blocks: [],
        answers: [],
        answerFiles: [],
        hiddenAnswerFiles: [],
        groupEntries: [],
        servicesConfirmedAt: "2026-10-01T10:00:00.000Z",
      }).servicesConfirmed,
    ).toBe(true);
  });
});
