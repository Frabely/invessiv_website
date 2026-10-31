import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingExportFileStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-export-file-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { OnboardingExportDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import { FileArchiveEntryStatus } from "@/common/constants/files/file-archive-entry-status";
import { MAX_ARCHIVE_BYTES } from "@/common/constants/files/file-archive-limits";
import { exportOnboardingForm } from "@/server/workspace/crm/query-handler/export-onboarding-form.query-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import {
  exportAttachmentFixture,
  exportContextFixture,
  exportFormFixture,
} from "../support/onboarding-export-fixtures";

vi.mock("server-only", () => ({}));

const FORM_ID = "0b000000-0000-4000-8000-000000000001";
const FOLDER = "files/design_direction/logo_key";

const mocks = vi.hoisted(() => ({
  rows: [] as unknown[],
  findReadableForm: vi.fn(),
  findReadableContext: vi.fn(),
  toFormDto: vi.fn(),
}));

vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: () => ({
    select: () => ({ from: () => ({ where: async () => mocks.rows }) }),
  }),
}));
vi.mock(
  "@/server/workspace/crm/services/onboarding/onboarding-form-access-service",
  () => ({
    onboardingFormAccessService: {
      findReadableForm: mocks.findReadableForm,
      findReadableContext: mocks.findReadableContext,
    },
  }),
);
vi.mock(
  "@/server/shared/services/onboarding/onboarding-form-read-service",
  () => ({ onboardingFormReadService: { toFormDto: mocks.toFormDto } }),
);
vi.mock("@/server/workspace/crm/services/files/file-access-service", () => ({
  fileAccessService: { readableCondition: () => undefined },
}));

function storedRow(
  id: string,
  overrides: Partial<{
    assetKind: AssetKind;
    storageKey: string | null;
    sizeBytes: number | null;
    url: string | null;
  }> = {},
) {
  return {
    id: `file-${id}`,
    assetKind: AssetKind.Image,
    displayName: `${id}.png`,
    storageKey: `key-${id}`,
    sizeBytes: 10,
    url: null,
    ...overrides,
  };
}

function logo(id: string, position: number) {
  return {
    ...exportAttachmentFixture(id, "logo", null, `${id}.png`),
    position,
  };
}

describe("exportOnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findReadableForm.mockResolvedValue({ id: FORM_ID });
    mocks.findReadableContext.mockResolvedValue(exportContextFixture());
  });

  it("answers null for a form out of reach or an invalid id", async () => {
    mocks.findReadableForm.mockResolvedValue(null);
    const actor = workspaceActorWith([]);
    expect(await exportOnboardingForm(FORM_ID, actor, Locale.De)).toBeNull();
    expect(await exportOnboardingForm("nope", actor, Locale.De)).toBeNull();
  });

  it("streams only storable files and names every other one in the manifest", async () => {
    mocks.toFormDto.mockResolvedValue(
      exportFormFixture({
        answerFiles: ["ok", "huge", "video", "link", "gone", "late"].map(logo),
      }),
    );
    mocks.rows = [
      storedRow("ok"),
      storedRow("huge", { sizeBytes: MAX_ARCHIVE_BYTES + 1 }),
      storedRow("video", { assetKind: AssetKind.Video }),
      storedRow("link", { storageKey: null, url: "https://example.com/x" }),
      storedRow("late"),
    ];

    const archive = await exportOnboardingForm(
      FORM_ID,
      workspaceActorWith([]),
      Locale.De,
    );

    expect(archive?.filename).toMatch(
      /^onboarding-Relaunch-\d{4}-\d{2}-\d{2}\.zip$/,
    );
    expect(archive?.entries).toEqual([
      {
        displayName: "ok.png",
        storageKey: "key-ok",
        url: null,
        folder: FOLDER,
      },
      {
        displayName: "late.png",
        storageKey: "key-late",
        url: null,
        folder: FOLDER,
      },
    ]);

    const manifest = JSON.parse(
      archive!.manifest.build([
        { path: `${FOLDER}/ok.png`, status: FileArchiveEntryStatus.Included },
        { path: `${FOLDER}/late.png`, status: FileArchiveEntryStatus.Timeout },
      ]),
    ) as OnboardingExportDto;
    const answer = manifest.blocks[0]!.fields.find(
      (field) => field.key === "logo_key",
    )!.answer;

    expect(answer).toMatchObject({
      files: [
        {
          name: "ok.png",
          status: OnboardingExportFileStatus.Included,
          path: `${FOLDER}/ok.png`,
        },
        {
          name: "huge.png",
          status: OnboardingExportFileStatus.SizeLimit,
          path: null,
        },
        {
          name: "video.png",
          status: OnboardingExportFileStatus.Video,
          path: null,
        },
        {
          name: "link.png",
          status: OnboardingExportFileStatus.Link,
          path: null,
        },
        {
          name: "gone.png",
          status: OnboardingExportFileStatus.Unreadable,
          path: null,
        },
        {
          name: "late.png",
          status: OnboardingExportFileStatus.Timeout,
          path: null,
        },
      ],
    });
  });

  it("packs a file used by two questions once and keeps both uses in the manifest", async () => {
    const logoLink = logo("ok", 0);
    const reused = {
      ...exportAttachmentFixture("p-1", "portrait", "entry-1", "ok.png"),
      file: logoLink.file,
    };
    mocks.toFormDto.mockResolvedValue(
      exportFormFixture({
        groupEntries: [{ id: "entry-1", fieldId: "team", position: 0 }],
        answerFiles: [logoLink, reused],
      }),
    );
    mocks.rows = [storedRow("ok")];

    const archive = await exportOnboardingForm(
      FORM_ID,
      workspaceActorWith([]),
      Locale.De,
    );

    expect(archive?.entries).toEqual([
      {
        displayName: "ok.png",
        storageKey: "key-ok",
        url: null,
        folder: "files/shared",
      },
    ]);
    const manifest = JSON.parse(
      archive!.manifest.build([
        {
          path: "files/shared/ok.png",
          status: FileArchiveEntryStatus.Included,
        },
      ]),
    ) as OnboardingExportDto;
    const fields = manifest.blocks[0]!.fields;
    const fromLogo = fields.find((field) => field.key === "logo_key")!.answer;
    const fromTeam = fields.find((field) => field.key === "team_key")!.answer;
    const expected = {
      fileId: "file-ok",
      path: "files/shared/ok.png",
      usedIn: [
        {
          blockKey: "design_direction",
          groupKey: null,
          entryNumber: null,
          fieldKey: "logo_key",
        },
        {
          blockKey: "design_direction",
          groupKey: "team_key",
          entryNumber: 1,
          fieldKey: "portrait_key",
        },
      ],
    };

    expect(fromLogo).toMatchObject({ files: [expected] });
    expect(fromTeam).toMatchObject({
      entries: [{ fields: [{}, { answer: { files: [expected] } }] }],
    });
  });
});
