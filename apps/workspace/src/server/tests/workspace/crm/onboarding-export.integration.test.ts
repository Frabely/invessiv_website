import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingExportAnswerKind } from "@invessiv/common/constants/crm/onboarding/onboarding-export-answer-kinds";
import { OnboardingExportFileStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-export-file-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { OnboardingExportDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { exportOnboardingForm } from "@/server/workspace/crm/query-handler/export-onboarding-form.query-handler";
import { createOnboardingIntegrationFixture } from "./support/onboarding-integration-fixture";
import { fieldByKey } from "./support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 60_000 });

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "onboarding export PostgreSQL integration",
  () => {
    const f = createOnboardingIntegrationFixture();

    async function form(
      status: OnboardingFormStatus,
      customerId = f.customerId,
    ): Promise<OnboardingFormDto> {
      const block = await f.catalogBlock([
        { key: "tone", type: T.LongText },
        { key: "logo", type: T.Files },
        { key: "team", type: T.Group },
        { key: "member_name", type: T.ShortText, parent: "team" },
      ]);
      const template = await f.template([block.id]);
      const started = f.value(
        await startProjectOnboarding(
          await f.project({ customerId }),
          { templateId: template.id },
          f.member(),
        ),
      );
      await f.setFormStatus(started.id, status);
      return started;
    }

    async function manifestOf(
      target: OnboardingFormDto,
      actor: WorkspaceActor = f.member(),
    ): Promise<OnboardingExportDto> {
      const archive = await exportOnboardingForm(target.id, actor, Locale.De);
      if (!archive) throw new Error("expected an archive");
      return JSON.parse(archive.manifest.build([])) as OnboardingExportDto;
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    });

    it("exports a draft with every question unanswered", async () => {
      const target = await form(OnboardingFormStatus.Draft);
      const manifest = await manifestOf(target);

      expect(manifest.status).toBe(OnboardingFormStatus.Draft);
      expect(manifest.blocks[0]!.fields.map((field) => field.key)).toEqual([
        "tone",
        "logo",
        "team",
      ]);
      expect(manifest.blocks[0]!.fields.every((field) => !field.answered)).toBe(
        true,
      );
    });

    it("exports a completed form with answers, group entries and links", async () => {
      const target = await form(OnboardingFormStatus.Completed);
      const block = target.blocks[0]!.block;
      await f.answer(target, fieldByKey(block, "tone").id, {
        value: "Locker, per du",
      });
      await f.answerFile(target, fieldByKey(block, "logo").id, 0);
      const entry = await f.groupEntry(target, fieldByKey(block, "team").id, 0);
      await f.answer(target, fieldByKey(block, "member_name").id, {
        value: "Anna",
        groupEntryId: entry,
      });

      const archive = await exportOnboardingForm(
        target.id,
        f.member(),
        Locale.De,
      );
      expect(archive?.entries).toEqual([]);
      expect(archive?.filename).toMatch(
        /^onboarding-.+-\d{4}-\d{2}-\d{2}\.zip$/,
      );
      const fields = (
        JSON.parse(archive!.manifest.build([])) as OnboardingExportDto
      ).blocks[0]!.fields;

      expect(fields[0]).toMatchObject({
        answered: true,
        answer: {
          kind: OnboardingExportAnswerKind.Text,
          value: "Locker, per du",
        },
      });
      expect(fields[1]!.answer).toMatchObject({
        files: [{ status: OnboardingExportFileStatus.Link, path: null }],
      });
      expect(fields[2]!.answer).toMatchObject({
        entries: [{ number: 1, fields: [{ answer: { value: "Anna" } }] }],
      });
    });

    it("only counts files for a member without files.read", async () => {
      const target = await form(OnboardingFormStatus.Open);
      await f.answerFile(
        target,
        fieldByKey(target.blocks[0]!.block, "logo").id,
        0,
      );

      const manifest = await manifestOf(
        target,
        f.member([Permission.ProjectsRead]),
      );

      expect(manifest.blocks[0]!.fields[1]!.answer).toEqual({
        kind: OnboardingExportAnswerKind.Files,
        files: [
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

    it("finds nothing outside the member's scope", async () => {
      const foreign = await form(
        OnboardingFormStatus.Open,
        f.foreignCustomerId,
      );
      const customerBound = f.actor({
        permissions: new Set(),
        customerPermissions: new Map([
          [f.customerId, new Set([Permission.ProjectsRead])],
        ]),
      });

      expect(
        await exportOnboardingForm(foreign.id, customerBound, Locale.De),
      ).toBeNull();
      expect(
        await exportOnboardingForm(foreign.id, f.member([]), Locale.De),
      ).toBeNull();
    });
  },
);
