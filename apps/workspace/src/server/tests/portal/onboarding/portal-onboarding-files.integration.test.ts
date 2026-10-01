import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UPLOAD_CONTENT_TYPES } from "@invessiv/common/constants/files/upload-content-types";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  files,
  onboardingAnswerFiles,
  onboardingGroupEntries,
} from "@invessiv/db/record-configuration";
import {
  createPortalActor,
  type PortalActor,
} from "@/server/portal/auth/portal-actor";
import { attachPortalOnboardingFile } from "@/server/portal/command-handler/attach-portal-onboarding-file.command-handler";
import { detachPortalOnboardingFile } from "@/server/portal/command-handler/detach-portal-onboarding-file.command-handler";
import { submitPortalOnboarding } from "@/server/portal/command-handler/submit-portal-onboarding.command-handler";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { deleteFile } from "@/server/workspace/crm/command-handler/delete-file.command-handler";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { createOnboardingIntegrationFixture } from "../../workspace/crm/support/onboarding-integration-fixture";
import { fieldByKey } from "../../workspace/crm/support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

const NOT_FOUND = { ok: false, code: E.NotFound };
const LOCKED = { ok: false, code: E.Locked };
const VALIDATION = { ok: false, code: E.Validation };
const NOT_ATTACHABLE = { ok: false, code: E.NotAttachable };
const LIMIT_REACHED = { ok: false, code: E.LimitReached };

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal onboarding file attachments",
  () => {
    const f = createOnboardingIntegrationFixture();
    const PREFIX = `integration:onboarding-files:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );

    /** A released form on a fresh project, built from the given catalog blocks. */
    async function openForm(
      blocks: readonly QuestionnaireBlockDto[],
      status: OnboardingFormStatus = OnboardingFormStatus.Open,
    ): Promise<OnboardingFormDto> {
      const template = await f.template(blocks.map((block) => block.id));
      const form = f.value(
        await startProjectOnboarding(
          await f.project(),
          { templateId: template.id },
          f.member(),
        ),
      );
      await f.setFormStatus(form.id, status);
      return form;
    }

    function field(form: OnboardingFormDto, key: string) {
      for (const step of form.blocks) {
        const found = fieldByKey(step.block, key);
        if (found) return found;
      }
      throw new Error(`No field ${key}`);
    }

    /** A ready link the customer added for the form's project, unless overridden. */
    async function customerFile(
      form: OnboardingFormDto,
      overrides: Partial<typeof files.$inferInsert> = {},
    ): Promise<string> {
      const id = crypto.randomUUID();
      await f
        .database()
        .insert(files)
        .values({
          id,
          customer_id: form.customerId,
          project_id: form.projectId,
          source: FileSource.Link,
          status: FileStatus.Ready,
          asset_kind: AssetKind.Link,
          display_name: "Logo",
          url: `https://example.com/${id}`,
          visible_to_customer: true,
          uploaded_by_side: UploadSide.Customer,
          uploaded_by_portal_membership_id: f.membershipId,
          version: 1,
          ...overrides,
        });
      return id;
    }

    /** Columns that turn the link above into an uploaded image. */
    const imageUpload = (): Partial<typeof files.$inferInsert> => ({
      source: FileSource.Upload,
      asset_kind: AssetKind.Image,
      url: null,
      storage_key: `${PREFIX}${crypto.randomUUID()}`,
      content_type: UPLOAD_CONTENT_TYPES[UploadExtension.Png],
      extension: UploadExtension.Png,
      size_bytes: 1,
      inspection_status: FileInspectionStatus.Unscanned,
    });

    function storedLinks(formId: string) {
      return f
        .database()
        .select()
        .from(onboardingAnswerFiles)
        .where(eq(onboardingAnswerFiles.form_id, formId))
        .orderBy(onboardingAnswerFiles.position);
    }

    function attach(
      actor: PortalActor,
      form: OnboardingFormDto,
      fileId: string,
      key = "logo",
      groupEntryId: string | null = null,
    ) {
      return attachPortalOnboardingFile(actor, form.id, {
        fieldId: field(form, key).id,
        groupEntryId,
        fileId,
      });
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it("attaches an own ready file of the project and shows it at the field", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      const first = await customerFile(form);
      const second = await customerFile(form);

      const attached = await attach(contact, form, first);
      expect(attached).toMatchObject({
        ok: true,
        value: {
          fieldId: field(form, "logo").id,
          groupEntryId: null,
          position: 0,
          file: { id: first, displayName: "Logo" },
        },
      });
      expect(await attach(contact, form, second)).toMatchObject({
        ok: true,
        value: { position: 1, file: { id: second } },
      });

      const links = await storedLinks(form.id);
      expect(links.map((link) => link.file_id)).toEqual([first, second]);
      const dto = await getPortalOnboardingForm(contact, form.id, Locale.De);
      expect(dto?.answerFiles).toMatchObject([
        { id: links[0].id, file: { id: first } },
        { id: links[1].id, file: { id: second } },
      ]);
      expect(attached.ok && attached.value.id).toBe(links[0].id);
    });

    it("treats a repeated attachment of the same file as a success", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      const fileId = await customerFile(form);
      await attach(contact, form, fileId);

      expect(await attach(contact, form, fileId)).toMatchObject({
        ok: true,
        value: { position: 0, file: { id: fileId } },
      });
      expect(await storedLinks(form.id)).toHaveLength(1);
    });

    it("lets a required files field block the submission until a file is attached", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([
          {
            key: "logo",
            type: T.Files,
            overrides: { requirement: QuestionnaireFieldRequirement.Required },
          },
        ]),
      ]);

      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: false,
        code: E.RequiredMissing,
      });
      await attach(contact, form, await customerFile(form));
      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: true,
      });
    });

    it("answers a file of another company and a hidden internal file like a missing one", async () => {
      const contact = await sessions.session(f.customerId);
      const stranger = await sessions.session(f.foreignCustomerId);
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      const foreign = await customerFile(form, {
        customer_id: f.foreignCustomerId,
        project_id: f.foreignProjectId,
        uploaded_by_portal_membership_id: stranger.membershipId,
      });
      const hidden = await customerFile(form, {
        visible_to_customer: false,
        uploaded_by_side: UploadSide.Internal,
        uploaded_by_portal_membership_id: null,
        uploaded_by_member_id: f.memberId,
      });

      expect(await attach(contact, form, foreign)).toEqual(NOT_FOUND);
      expect(await attach(contact, form, hidden)).toEqual(NOT_FOUND);
      expect(await attach(contact, form, crypto.randomUUID())).toEqual(
        NOT_FOUND,
      );
      expect(await storedLinks(form.id)).toEqual([]);
    });

    it("refuses a shared internal file, an unfinished upload, another project and a wrong kind", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([
          { key: "logo", type: T.Files },
          {
            key: "photos",
            type: T.Files,
            overrides: { acceptedAssetKinds: [AssetKind.Image] },
          },
        ]),
      ]);
      const internal = await customerFile(form, {
        uploaded_by_side: UploadSide.Internal,
        uploaded_by_portal_membership_id: null,
        uploaded_by_member_id: f.memberId,
      });
      const pending = await customerFile(form, {
        ...imageUpload(),
        status: FileStatus.Pending,
      });
      const elsewhere = await customerFile(form, {
        project_id: f.siblingProjectId,
      });
      const general = await customerFile(form, { project_id: null });
      const link = await customerFile(form);
      const image = await customerFile(form, imageUpload());

      for (const fileId of [internal, pending, elsewhere, general])
        expect(await attach(contact, form, fileId)).toEqual(NOT_ATTACHABLE);
      expect(await attach(contact, form, link, "photos")).toEqual(
        NOT_ATTACHABLE,
      );
      expect(await attach(contact, form, image, "photos")).toMatchObject({
        ok: true,
      });
      expect(await storedLinks(form.id)).toHaveLength(1);
    });

    it("stops at the field's maximum of files", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([
          { key: "logo", type: T.Files, overrides: { maxItems: 1 } },
        ]),
      ]);
      await attach(contact, form, await customerFile(form));

      expect(await attach(contact, form, await customerFile(form))).toEqual(
        LIMIT_REACHED,
      );
      expect(await storedLinks(form.id)).toHaveLength(1);
    });

    it("rejects a field that takes no files, a field of another form and a mismatched entry", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([
        { key: "logo", type: T.Files },
        { key: "name", type: T.ShortText },
        { key: "team", type: T.Group },
        { key: "portrait", type: T.Files, parent: "team" },
      ]);
      const form = await openForm([block]);
      const sibling = await openForm([block]);
      const fileId = await customerFile(form);
      const portrait = field(form, "team").children[0].id;

      expect(await attach(contact, form, fileId, "name")).toEqual(VALIDATION);
      expect(
        await attachPortalOnboardingFile(contact, form.id, {
          fieldId: field(sibling, "logo").id,
          groupEntryId: null,
          fileId,
        }),
      ).toEqual(NOT_FOUND);
      expect(
        await attachPortalOnboardingFile(contact, form.id, {
          fieldId: portrait,
          groupEntryId: null,
          fileId,
        }),
      ).toEqual(VALIDATION);
      expect(
        await attach(contact, form, fileId, "logo", crypto.randomUUID()),
      ).toEqual(VALIDATION);
      expect(
        await attachPortalOnboardingFile(contact, form.id, {
          fieldId: field(form, "logo").id,
          groupEntryId: null,
          fileId: "not-a-uuid",
        }),
      ).toEqual(VALIDATION);
      expect(await storedLinks(form.id)).toEqual([]);
    });

    it("attaches to a files sub-field of one group entry", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([
          { key: "team", type: T.Group },
          { key: "portrait", type: T.Files, parent: "team" },
        ]),
      ]);
      const entryId = await f.groupEntry(form, field(form, "team").id, 0);
      const fileId = await customerFile(form);

      expect(
        await attachPortalOnboardingFile(contact, form.id, {
          fieldId: field(form, "team").children[0].id,
          groupEntryId: entryId,
          fileId,
        }),
      ).toMatchObject({
        ok: true,
        value: { groupEntryId: entryId, file: { id: fileId } },
      });
      expect(
        await f
          .database()
          .select({ id: onboardingGroupEntries.id })
          .from(onboardingGroupEntries)
          .where(eq(onboardingGroupEntries.id, entryId)),
      ).toHaveLength(1);
    });

    it("detaches a link, keeps the file and closes the gap in the order", async () => {
      const contact = await sessions.session(f.customerId, "Ada Lovelace");
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      const fileIds = [
        await customerFile(form),
        await customerFile(form),
        await customerFile(form),
      ];
      for (const fileId of fileIds) await attach(contact, form, fileId);
      const [, middle] = await storedLinks(form.id);

      expect(
        await detachPortalOnboardingFile(contact, {
          formId: form.id,
          answerFileId: middle.id,
        }),
      ).toMatchObject({ ok: true, value: { savedByName: "Ada Lovelace" } });

      expect(
        (await storedLinks(form.id)).map((link) => [
          link.file_id,
          link.position,
        ]),
      ).toEqual([
        [fileIds[0], 0],
        [fileIds[2], 1],
      ]);
      expect(
        await f
          .database()
          .select({ id: files.id })
          .from(files)
          .where(eq(files.id, fileIds[1])),
      ).toHaveLength(1);
    });

    it("lets a pre-filled file of another project be removed but not attached again", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      const carried = await customerFile(form, {
        project_id: f.siblingProjectId,
      });
      const linkId = crypto.randomUUID();
      await f
        .database()
        .insert(onboardingAnswerFiles)
        .values({
          id: linkId,
          form_id: form.id,
          field_id: field(form, "logo").id,
          group_entry_id: null,
          file_id: carried,
          position: 0,
        });

      expect(
        (await getPortalOnboardingForm(contact, form.id, Locale.De))
          ?.answerFiles,
      ).toMatchObject([{ id: linkId, file: { id: carried } }]);
      expect(
        await detachPortalOnboardingFile(contact, {
          formId: form.id,
          answerFileId: linkId,
        }),
      ).toMatchObject({ ok: true });
      expect(await attach(contact, form, carried)).toEqual(NOT_ATTACHABLE);
    });

    it("answers a link of another form like a missing one", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([{ key: "logo", type: T.Files }]);
      const form = await openForm([block]);
      const sibling = await openForm([block]);
      await attach(contact, sibling, await customerFile(sibling));
      const [foreign] = await storedLinks(sibling.id);

      expect(
        await detachPortalOnboardingFile(contact, {
          formId: form.id,
          answerFileId: foreign.id,
        }),
      ).toEqual(NOT_FOUND);
      expect(
        await detachPortalOnboardingFile(contact, {
          formId: form.id,
          answerFileId: "not-a-uuid",
        }),
      ).toEqual(NOT_FOUND);
      expect(await storedLinks(sibling.id)).toHaveLength(1);
    });

    it("gives another company, a contact without submit right and one without files.read nothing", async () => {
      const contact = await sessions.session(f.customerId);
      const stranger = await sessions.session(f.foreignCustomerId);
      const withPermissions = (permissions: Permission[]) =>
        createPortalActor({
          userId: contact.userId,
          membershipId: contact.membershipId,
          customerId: contact.customerId,
          personId: contact.personId,
          firstName: null,
          permissions: new Set(permissions),
          projectPermissions: new Map(),
        });
      const reader = withPermissions([
        Permission.PortalAccess,
        Permission.PortalOnboardingRead,
        Permission.PortalFilesRead,
      ]);
      const blindToFiles = withPermissions([
        Permission.PortalAccess,
        Permission.PortalOnboardingRead,
        Permission.PortalOnboardingSubmit,
      ]);
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      const attached = await customerFile(form);
      await attach(contact, form, attached);
      const [link] = await storedLinks(form.id);
      const other = await customerFile(form);

      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toMatchObject({ canSubmit: true, canAttach: true });
      expect(
        await getPortalOnboardingForm(blindToFiles, form.id, Locale.De),
      ).toMatchObject({ canSubmit: true, canAttach: false });

      for (const actor of [stranger, reader, blindToFiles]) {
        expect(await attach(actor, form, other)).toEqual(NOT_FOUND);
        expect(
          await detachPortalOnboardingFile(actor, {
            formId: form.id,
            answerFileId: link.id,
          }),
        ).toEqual(NOT_FOUND);
      }
      expect(await storedLinks(form.id)).toHaveLength(1);
    });

    it("locks attachments once the form is submitted", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      await attach(contact, form, await customerFile(form));
      const [link] = await storedLinks(form.id);
      await f.setFormStatus(form.id, OnboardingFormStatus.Submitted);

      expect(await attach(contact, form, await customerFile(form))).toEqual(
        LOCKED,
      );
      expect(
        await detachPortalOnboardingFile(contact, {
          formId: form.id,
          answerFileId: link.id,
        }),
      ).toEqual(LOCKED);
      expect(await storedLinks(form.id)).toHaveLength(1);
    });

    it("keeps a file that hangs on a form from being deleted internally", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([{ key: "logo", type: T.Files }]),
      ]);
      const fileId = await customerFile(form);
      await attach(contact, form, fileId);
      const [link] = await storedLinks(form.id);

      expect(await deleteFile(fileId, { version: 1 }, f.actor())).toEqual({
        ok: false,
        code: FileApiErrorCode.OnboardingBound,
      });
      expect(
        await f
          .database()
          .select({ id: files.id })
          .from(files)
          .where(and(eq(files.id, fileId), eq(files.status, FileStatus.Ready))),
      ).toHaveLength(1);

      await detachPortalOnboardingFile(contact, {
        formId: form.id,
        answerFileId: link.id,
      });
      expect(await deleteFile(fileId, { version: 1 }, f.actor())).toEqual({
        ok: true,
        value: { deleted: true },
      });
    });
  },
);
