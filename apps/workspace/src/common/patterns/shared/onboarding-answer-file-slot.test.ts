import { describe, expect, it } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import { getOnboardingAnswerFileSlot } from "./onboarding-answer-file-slot";

function link(
  id: string,
  groupEntryId: string | null,
  position: number,
): QuestionnaireAnswerFileDto {
  return {
    id,
    fieldId: "portrait",
    groupEntryId,
    position,
    file: {
      id,
      displayName: id,
      assetKind: AssetKind.Image,
      source: FileSource.Upload,
      extension: "png",
      sizeBytes: 42,
      url: null,
      note: null,
      createdAt: "2026-10-31T00:00:00.000Z",
    },
  };
}

describe("getOnboardingAnswerFileSlot", () => {
  it("keeps fields and group entries separate, sorts copies and counts only hidden links in the slot", () => {
    const last = link("last", "ada", 1);
    const first = link("first", "ada", 0);
    const files = [
      last,
      link("other-entry", "grace", 0),
      first,
      { ...link("other-field", "ada", 0), fieldId: "logo" },
      link("top-level", null, 0),
    ];
    const original = [...files];
    const result = getOnboardingAnswerFileSlot(
      files,
      [
        { fieldId: "portrait", groupEntryId: "ada" },
        { fieldId: "portrait", groupEntryId: "ada" },
        { fieldId: "portrait", groupEntryId: null },
        { fieldId: "logo", groupEntryId: "ada" },
      ],
      { fieldId: "portrait", groupEntryId: "ada" },
    );
    expect(result).toEqual({
      links: [first, last],
      attachments: [first.file, last.file],
      hiddenCount: 2,
    });
    expect(files).toEqual(original);
    expect(
      getOnboardingAnswerFileSlot(files, [], {
        fieldId: "missing",
        groupEntryId: null,
      }),
    ).toEqual({ links: [], attachments: [], hiddenCount: 0 });
  });
});
