import { describe, expect, it, vi } from "vitest";

import { OnboardingExportAnswerKind } from "@invessiv/common/constants/crm/onboarding/onboarding-export-answer-kinds";
import { OnboardingExportFileStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-export-file-statuses";
import { ONBOARDING_EXPORT_SCHEMA_VERSION } from "@invessiv/common/constants/crm/onboarding/onboarding-export-format";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { OnboardingExportFileDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-file.dto";
import type { OnboardingExportFieldDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-field.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { onboardingExportMappingService } from "@/server/workspace/crm/services/onboarding/onboarding-export-mapping-service";
import {
  exportAttachmentFixture,
  exportContextFixture,
  exportFieldsFixture,
  exportFormFixture,
} from "../support/onboarding-export-fixtures";

vi.mock("server-only", () => ({}));

const fields = exportFieldsFixture();
const form = exportFormFixture;
const attachment = exportAttachmentFixture;
const context = exportContextFixture();
const LOGO_USAGE = {
  blockKey: "design_direction",
  groupKey: null,
  entryNumber: null,
  fieldKey: "logo_key",
};

function exportOf(
  value: OnboardingFormDto,
  files: ReadonlyMap<string, OnboardingExportFileDto> = new Map(),
) {
  return onboardingExportMappingService.map({
    form: value,
    context,
    locale: "de",
    exportedAt: "2026-10-31T10:00:00.000Z",
    files,
  });
}

function byKey(list: readonly OnboardingExportFieldDto[], key: string) {
  const found = list.find((entry) => entry.key === key);
  if (!found) throw new Error(`missing field ${key}`);
  return found;
}

describe("onboardingExportMappingService.map", () => {
  it("exports every question of an untouched form as unanswered", () => {
    const result = exportOf(form());

    expect(result).toMatchObject({
      schemaVersion: ONBOARDING_EXPORT_SCHEMA_VERSION,
      locale: "de",
      customerName: "Muster GmbH",
      projectTitle: "Relaunch",
      status: OnboardingFormStatus.Open,
      services: {
        confirmedAt: null,
        items: [{ title: "Website", description: null }],
      },
    });
    const block = result.blocks[0]!;
    expect(block).toMatchObject({ key: "design_direction", title: "Design" });
    expect(block.fields.map((entry) => entry.key)).toEqual(
      fields.map((entry) => entry.key),
    );
    expect(block.fields.every((entry) => !entry.answered)).toBe(true);
    expect(byKey(block.fields, "tone_key")).toMatchObject({
      label: "tone DE",
      required: true,
      visible: true,
      answer: { kind: OnboardingExportAnswerKind.Text, value: null },
    });
  });

  it("keeps a hidden question with its condition and lists all options with their selection", () => {
    const fieldsOut = exportOf(
      form({
        answers: [
          {
            fieldId: "style",
            groupEntryId: null,
            sortOrder: 0,
            value: null,
            choiceId: "modern",
          },
        ],
      }),
    ).blocks[0]!.fields;

    expect(byKey(fieldsOut, "style_key")).toMatchObject({
      answered: true,
      answer: {
        kind: OnboardingExportAnswerKind.Choice,
        multiple: true,
        options: [
          { key: "modern", label: "modern de", selected: true },
          { key: "classic", label: "classic de", selected: false },
        ],
      },
    });
    expect(byKey(fieldsOut, "why_classic_key")).toMatchObject({
      visible: false,
      condition: {
        fieldKey: "style_key",
        optionKey: "classic",
        optionLabel: "classic de",
      },
    });
  });

  it("maps scale, confirmation and service confirmation", () => {
    const fieldsOut = exportOf(
      form({
        servicesConfirmedAt: "2026-10-03T00:00:00.000Z",
        answers: [
          {
            fieldId: "formality",
            groupEntryId: null,
            sortOrder: 0,
            value: "4",
            choiceId: null,
          },
          {
            fieldId: "terms",
            groupEntryId: null,
            sortOrder: 0,
            value: "true",
            choiceId: null,
          },
        ],
      }),
    ).blocks[0]!.fields;

    expect(byKey(fieldsOut, "formality_key").answer).toEqual({
      kind: OnboardingExportAnswerKind.Scale,
      value: 4,
      steps: 5,
      lowLabel: "low de",
      highLabel: "high de",
    });
    expect(byKey(fieldsOut, "terms_key").answer).toEqual({
      kind: OnboardingExportAnswerKind.Confirmation,
      confirmed: true,
    });
    expect(byKey(fieldsOut, "services_key").answered).toBe(true);
  });

  it("lists group sub-questions without entries and answers per entry", () => {
    const empty = byKey(exportOf(form()).blocks[0]!.fields, "team_key");
    expect(empty.answer).toMatchObject({
      kind: OnboardingExportAnswerKind.Group,
      entries: [],
    });
    expect(
      empty.answer.kind === OnboardingExportAnswerKind.Group &&
        empty.answer.questions.map((entry) => entry.key),
    ).toEqual(["member_name_key", "portrait_key"]);

    const filled = byKey(
      exportOf(
        form({
          groupEntries: [{ id: "entry-1", fieldId: "team", position: 0 }],
          answers: [
            {
              fieldId: "member_name",
              groupEntryId: "entry-1",
              sortOrder: 0,
              value: "Anna",
              choiceId: null,
            },
          ],
        }),
      ).blocks[0]!.fields,
      "team_key",
    );
    expect(filled.answered).toBe(true);
    expect(filled.answer).toMatchObject({
      entries: [
        {
          number: 1,
          fields: [
            { key: "member_name_key", answer: { value: "Anna" } },
            { key: "portrait_key", answered: false },
          ],
        },
      ],
    });
  });

  it("takes file outcomes from the archive and counts files the member may not open", () => {
    const included: OnboardingExportFileDto = {
      fileId: "file-link-1",
      name: "logo.svg",
      kind: AssetKind.Image,
      status: OnboardingExportFileStatus.Included,
      path: "files/design_direction/logo_key/logo.svg",
      url: null,
      note: null,
      usedIn: [LOGO_USAGE],
    };
    const fieldsOut = exportOf(
      form({
        answerFiles: [attachment("link-1", "logo", null, "logo.svg")],
        hiddenAnswerFiles: [{ fieldId: "logo", groupEntryId: null }],
      }),
      new Map([["file-link-1", included]]),
    ).blocks[0]!.fields;

    expect(byKey(fieldsOut, "logo_key").answer).toEqual({
      kind: OnboardingExportAnswerKind.Files,
      files: [
        included,
        {
          fileId: null,
          name: null,
          kind: null,
          status: OnboardingExportFileStatus.NoAccess,
          path: null,
          url: null,
          note: null,
          usedIn: [],
        },
      ],
    });
  });
});

describe("onboardingExportMappingService.toFileLocations", () => {
  const entries = [
    { id: "entry-b", fieldId: "team", position: 1 },
    { id: "entry-a", fieldId: "team", position: 0 },
  ];

  it("keeps a file used once in the folder of its question", () => {
    const locations = onboardingExportMappingService.toFileLocations(
      form({
        groupEntries: entries,
        answerFiles: [
          attachment("logo-1", "logo", null, "logo.svg"),
          attachment("p-2", "portrait", "entry-b", "anna.jpg"),
        ],
      }),
    );

    expect(Object.fromEntries(locations)).toEqual({
      "file-logo-1": {
        folder: "files/design_direction/logo_key",
        usedIn: [LOGO_USAGE],
      },
      "file-p-2": {
        folder: "files/design_direction/team_key/entry-2/portrait_key",
        usedIn: [
          {
            blockKey: "design_direction",
            groupKey: "team_key",
            entryNumber: 2,
            fieldKey: "portrait_key",
          },
        ],
      },
    });
  });

  it("packs a file used by several questions once into the shared folder and lists every use in form order", () => {
    const shared = { file: { id: "file-shared" } };
    const portrait = attachment("p-1", "portrait", "entry-a", "logo.svg");
    const logo = attachment("logo-1", "logo", null, "logo.svg");
    const locations = onboardingExportMappingService.toFileLocations(
      form({
        groupEntries: entries,
        answerFiles: [
          { ...portrait, file: { ...portrait.file, ...shared.file } },
          { ...logo, file: { ...logo.file, ...shared.file } },
        ],
      }),
    );

    expect(locations.get("file-shared")).toEqual({
      folder: "files/shared",
      usedIn: [
        LOGO_USAGE,
        {
          blockKey: "design_direction",
          groupKey: "team_key",
          entryNumber: 1,
          fieldKey: "portrait_key",
        },
      ],
    });
  });

  it("gives every question of a reused file the same id, path and uses", () => {
    const link = attachment("logo-1", "logo", null, "logo.svg");
    const exported = onboardingExportMappingService.toExportFile(
      link.file,
      OnboardingExportFileStatus.Included,
      [LOGO_USAGE, LOGO_USAGE],
      "files/shared/logo.svg",
    );
    const fieldsOut = exportOf(
      form({
        groupEntries: [entries[1]!],
        answerFiles: [
          link,
          { ...attachment("p-1", "portrait", "entry-a", "x"), file: link.file },
        ],
      }),
      new Map([[link.file.id, exported]]),
    ).blocks[0]!.fields;
    const team = byKey(fieldsOut, "team_key").answer;

    expect(byKey(fieldsOut, "logo_key").answer).toMatchObject({
      files: [exported],
    });
    expect(team).toMatchObject({
      entries: [{ fields: [{}, { answer: { files: [exported] } }] }],
    });
  });
});

describe("onboardingExportMappingService.toExportFile", () => {
  const { file } = attachment("link-1", "logo", null, "logo.svg", {
    note: "Hauptlogo",
  });

  it("keeps the archive path only for an included file", () => {
    expect(
      onboardingExportMappingService.toExportFile(
        file,
        OnboardingExportFileStatus.Included,
        [LOGO_USAGE],
        "files/a/logo.svg",
      ),
    ).toEqual({
      fileId: "file-link-1",
      name: "logo.svg",
      kind: AssetKind.Image,
      status: OnboardingExportFileStatus.Included,
      path: "files/a/logo.svg",
      url: null,
      note: "Hauptlogo",
      usedIn: [LOGO_USAGE],
    });
    expect(
      onboardingExportMappingService.toExportFile(
        file,
        OnboardingExportFileStatus.Timeout,
        [LOGO_USAGE],
        "files/a/logo.svg",
      ).path,
    ).toBeNull();
  });
});
