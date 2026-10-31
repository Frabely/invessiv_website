import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ONBOARDING_BLOCK_REVIEW_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { ONBOARDING_EXPORT_ANSWER_KIND_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-export-answer-kinds";
import { ONBOARDING_EXPORT_FILE_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-export-file-statuses";
import { ONBOARDING_EXPORT_SCHEMA_VERSION } from "@invessiv/common/constants/crm/onboarding/onboarding-export-format";
import { ONBOARDING_FORM_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { PROJECT_PHASE_SEQUENCE } from "@invessiv/common/constants/crm/project-phases";
import { QUESTIONNAIRE_FIELD_TYPE_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { OnboardingExportFileStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-export-file-statuses";
import { onboardingExportMappingService } from "@/server/workspace/crm/services/onboarding/onboarding-export-mapping-service";
import { ONBOARDING_EXPORT_README } from "@/server/workspace/crm/services/onboarding/onboarding-export-readme";
import {
  exportAttachmentFixture,
  exportContextFixture,
  exportFormFixture,
} from "../support/onboarding-export-fixtures";

vi.mock("server-only", () => ({}));

function keysOf(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => keysOf(item, keys));
  else if (value && typeof value === "object")
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      keysOf(child, keys);
    }
  return keys;
}

// The team guide lives next to the other guides; both descriptions must cover the same export.
const TEAM_GUIDE = readFileSync(
  fileURLToPath(
    new URL(
      "../../../../../../../../docs/guides/onboarding-export.md",
      import.meta.url,
    ),
  ),
  "utf8",
);

const DESCRIPTIONS = [
  ["README.md in the archive", ONBOARDING_EXPORT_README],
  ["docs/guides/onboarding-export.md", TEAM_GUIDE],
] as const;

function documents(text: string, name: string) {
  // A nested property may be documented as `parent[].key`.
  return text.includes(`\`${name}\``) || text.includes(`.${name}\``);
}

function sampleExport() {
  const link = exportAttachmentFixture("l-1", "logo", null, "logo.svg");
  return onboardingExportMappingService.map({
    form: exportFormFixture({
      answerFiles: [link],
      groupEntries: [{ id: "e-1", fieldId: "team", position: 0 }],
    }),
    context: exportContextFixture(),
    locale: "de",
    exportedAt: "2026-10-31T10:00:00.000Z",
    files: new Map([
      [
        link.file.id,
        onboardingExportMappingService.toExportFile(
          link.file,
          OnboardingExportFileStatus.Included,
          [{ blockKey: "b", groupKey: null, entryNumber: null, fieldKey: "f" }],
          "files/b/f/logo.svg",
        ),
      ],
    ]),
  });
}

const VALUES = [
  ...ONBOARDING_FORM_STATUS_VALUES,
  ...ONBOARDING_BLOCK_REVIEW_STATUS_VALUES,
  ...ONBOARDING_EXPORT_ANSWER_KIND_VALUES,
  ...ONBOARDING_EXPORT_FILE_STATUS_VALUES,
  ...QUESTIONNAIRE_FIELD_TYPE_VALUES,
  ...PROJECT_PHASE_SEQUENCE,
  ...ASSET_KIND_VALUES,
];

describe.each(DESCRIPTIONS)("onboarding export description: %s", (_, text) => {
  it("explains every property a real export contains", () => {
    expect(
      [...keysOf(sampleExport())].filter((key) => !documents(text, key)),
    ).toEqual([]);
  });

  it("names every value the export can carry", () => {
    expect(VALUES.filter((value) => !documents(text, value))).toEqual([]);
  });
});

describe("onboarding export README", () => {
  it("states the schema version", () => {
    expect(ONBOARDING_EXPORT_README).toContain(
      `**${ONBOARDING_EXPORT_SCHEMA_VERSION}**`,
    );
  });
});
