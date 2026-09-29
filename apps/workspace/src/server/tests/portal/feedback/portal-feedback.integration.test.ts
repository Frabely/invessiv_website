import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PORTAL_READ_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode as E } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackDraftItemDto } from "@invessiv/common/contracts/portal/portal-feedback-draft-item.dto";
import { files, messages, tasks } from "@invessiv/db/record-configuration";
import { createInMemoryStorage } from "@invessiv/storage/testing";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { approvePortalFeedback } from "@/server/portal/command-handler/approve-portal-feedback.command-handler";
import { attachPortalFeedbackFile } from "@/server/portal/command-handler/attach-portal-feedback-file.command-handler";
import { createPortalFileLink } from "@/server/portal/command-handler/create-portal-file-link.command-handler";
import { createPortalFileUpload } from "@/server/portal/command-handler/create-portal-file-upload.command-handler";
import { detachPortalFeedbackFile } from "@/server/portal/command-handler/detach-portal-feedback-file.command-handler";
import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";
import { submitPortalFeedbackRound } from "@/server/portal/command-handler/submit-portal-feedback-round.command-handler";
import { getPortalProjectFeedback } from "@/server/portal/query-handler/get-portal-project-feedback.query-handler";
import { storageService } from "@/server/shared/files/storage-service";
import { createFileLink } from "@/server/workspace/crm/command-handler/create-file-link.command-handler";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal feedback PostgreSQL integration",
  () => {
    const f = createFeedbackIntegrationFixture();
    const memory = createInMemoryStorage();
    const AREAS = ["Startseite", "Über uns"];

    async function openRound() {
      const projectId = await f.project();
      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: AREAS },
        f.member(),
      );
      if (!handed.ok) throw new Error("Expected a handed-over round");
      return { projectId, roundId: handed.round.id };
    }

    const item = (
      body: string,
      overrides: Partial<PortalFeedbackDraftItemDto> = {},
    ): PortalFeedbackDraftItemDto => ({
      id: crypto.randomUUID(),
      areaLabel: null,
      kind: null,
      body,
      ...overrides,
    });

    async function save(
      roundId: string,
      items: PortalFeedbackDraftItemDto[],
      version = 1,
    ) {
      return savePortalFeedbackDraft(f.contact(), roundId, { version, items });
    }

    async function customerLink(projectId: string | null = null) {
      const created = await createPortalFileLink(f.contact(), {
        displayName: "Screenshot",
        url: `https://example.com/${crypto.randomUUID()}`,
        projectId,
      });
      if (!created.ok) throw new Error("Expected a customer link");
      return created.value.id;
    }

    async function internalLink(visibleToCustomer: boolean) {
      const created = await createFileLink(
        f.customerId,
        {
          displayName: "Entwurf",
          url: "https://example.com/draft",
          projectId: null,
          visibleToCustomer,
        },
        f.actor(),
      );
      if (!created.ok) throw new Error("Expected an internal link");
      return created.value.id;
    }

    async function readFile(id: string) {
      const [row] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, id));
      return row;
    }

    async function roundTasks(roundId: string) {
      return f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.feedback_round_id, roundId));
    }

    beforeAll(async () => {
      await f.setup();
      vi.spyOn(storageService, "getAdapter").mockReturnValue(memory.adapter);
    }, 60_000);

    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
    }, 60_000);

    it("saves the draft raw, in order, and reads it back on the page", async () => {
      const { projectId, roundId } = await openRound();
      const body = "<script>alert(1)</script> **Überschrift** ändern 🙂";
      const saved = await save(roundId, [
        item(body, { areaLabel: "Über uns", kind: "bug" }),
        item(""),
      ]);
      expect(saved).toMatchObject({
        ok: true,
        value: {
          version: 2,
          items: [
            { position: 0, body, areaLabel: "Über uns", kind: "bug" },
            { position: 1, body: "" },
          ],
        },
      });
      const page = await getPortalProjectFeedback(f.contact(), projectId);
      expect(page).toMatchObject({
        quota: { included: 2, used: 1, activeRoundNumber: 1 },
        activeRound: { id: roundId, items: [{ body }, { body: "" }] },
        history: [],
        canSubmit: true,
      });
    });

    it("lets one of two parallel saves win and returns the current draft to the other", async () => {
      const { roundId } = await openRound();
      const results = await Promise.all([
        save(roundId, [item("A")]),
        save(roundId, [item("B")]),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      const loser = results.find((result) => !result.ok);
      expect(loser).toMatchObject({
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: { currentVersion: 2, current: { items: [{ position: 0 }] } },
      });
    });

    it("rejects unknown areas and item ids of another round", async () => {
      const { roundId } = await openRound();
      expect(await save(roundId, [item("x", { areaLabel: "Shop" })])).toEqual({
        ok: false,
        code: E.Validation,
      });
      const other = await openRound();
      const taken = item("fremd");
      await save(other.roundId, [taken]);
      expect(await save(roundId, [taken])).toEqual({
        ok: false,
        code: E.Validation,
      });
    });

    it("attaches own files within the limits and refuses everything else", async () => {
      const { projectId, roundId } = await openRound();
      const first = item("Mit Datei");
      const second = item("Zweiter Punkt");
      await save(roundId, [first, second]);
      const attach = (itemId: string, fileId: string) =>
        attachPortalFeedbackFile(f.contact(), { roundId, itemId }, { fileId });

      const own = await customerLink();
      expect(await attach(first.id, own)).toMatchObject({
        ok: true,
        value: { fileId: own },
      });
      expect(await readFile(own)).toMatchObject({
        project_id: projectId,
        feedback_round_id: roundId,
        feedback_item_id: first.id,
      });
      expect(await attach(first.id, own)).toMatchObject({ ok: true });
      expect(await attach(second.id, own)).toEqual({
        ok: false,
        code: E.NotAttachable,
      });

      expect(await attach(first.id, await internalLink(false))).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await attach(first.id, await internalLink(true))).toEqual({
        ok: false,
        code: E.NotAttachable,
      });
      const pending = await createPortalFileUpload(f.contact(), {
        displayName: "logo.txt",
        sizeBytes: 4,
      });
      expect(
        pending.ok && (await attach(first.id, pending.value.file.id)),
      ).toEqual({ ok: false, code: E.NotAttachable });
      expect(
        await attach(first.id, await customerLink(f.siblingProjectId)),
      ).toEqual({ ok: false, code: E.NotAttachable });

      for (let index = 1; index < FEEDBACK_LIMITS.filesPerItem; index += 1)
        expect(await attach(first.id, await customerLink())).toMatchObject({
          ok: true,
        });
      expect(await attach(first.id, await customerLink())).toEqual({
        ok: false,
        code: E.AttachmentLimit,
      });
    }, 30_000);

    it("unhooks files by detaching and by removing their item", async () => {
      const { roundId } = await openRound();
      const kept = item("bleibt");
      const removed = item("fliegt raus");
      await save(roundId, [kept, removed]);
      const keptFile = await customerLink();
      const removedFile = await customerLink();
      await attachPortalFeedbackFile(
        f.contact(),
        { roundId, itemId: kept.id },
        { fileId: keptFile },
      );
      await attachPortalFeedbackFile(
        f.contact(),
        { roundId, itemId: removed.id },
        { fileId: removedFile },
      );

      expect(
        await detachPortalFeedbackFile(f.contact(), {
          roundId,
          itemId: kept.id,
          fileId: keptFile,
        }),
      ).toMatchObject({ ok: true, value: { fileId: keptFile } });
      expect(await save(roundId, [kept], 2)).toMatchObject({ ok: true });
      for (const id of [keptFile, removedFile])
        expect(await readFile(id)).toMatchObject({
          feedback_round_id: null,
          feedback_item_id: null,
          orphaned_at: null,
        });
    });

    it("submits once, opens one task and locks the round", async () => {
      const { roundId } = await openRound();
      expect(
        await submitPortalFeedbackRound(f.contact(), roundId, { version: 1 }),
      ).toEqual({ ok: false, code: E.ItemsRequired });
      const empty = item("  ");
      await save(roundId, [item("gut"), empty]);
      expect(
        await submitPortalFeedbackRound(f.contact(), roundId, { version: 2 }),
      ).toEqual({ ok: false, code: E.ItemTextRequired, itemIds: [empty.id] });
      const filled = item("Logo größer");
      const file = await customerLink();
      await save(roundId, [filled], 2);
      await attachPortalFeedbackFile(
        f.contact(),
        { roundId, itemId: filled.id },
        { fileId: file },
      );

      expect(
        await submitPortalFeedbackRound(f.contact(), roundId, { version: 3 }),
      ).toMatchObject({
        ok: true,
        value: {
          alreadySubmitted: false,
          round: { status: FeedbackRoundStatus.Submitted },
        },
      });
      expect(
        await submitPortalFeedbackRound(f.contact(), roundId, { version: 3 }),
      ).toMatchObject({ ok: true, value: { alreadySubmitted: true } });
      expect(await roundTasks(roundId)).toHaveLength(1);
      const notices = await f
        .database()
        .select({ body: messages.body })
        .from(messages)
        .where(eq(messages.customer_id, f.customerId));
      expect(notices.map((notice) => notice.body)).toContain(
        SystemMessageKey.FeedbackRoundSubmitted,
      );

      const locked = { ok: false, code: E.Locked };
      expect(await save(roundId, [filled], 4)).toEqual(locked);
      expect(
        await attachPortalFeedbackFile(
          f.contact(),
          { roundId, itemId: filled.id },
          { fileId: await customerLink() },
        ),
      ).toEqual(locked);
      expect(
        await detachPortalFeedbackFile(f.contact(), {
          roundId,
          itemId: filled.id,
          fileId: file,
        }),
      ).toEqual(locked);
      expect(
        await approvePortalFeedback(f.contact(), roundId, {
          version: 4,
          confirmFinal: true,
        }),
      ).toEqual(locked);
    });

    it("never leaves half a state when submit and save race", async () => {
      const { roundId } = await openRound();
      await save(roundId, [item("erste Fassung")]);
      const [saved, submitted] = await Promise.all([
        save(roundId, [item("zweite Fassung")], 2),
        submitPortalFeedbackRound(f.contact(), roundId, { version: 2 }),
      ]);
      expect(saved.ok !== submitted.ok).toBe(true);
      const loser = saved.ok ? submitted : saved;
      expect([ConcurrencyErrorCode.VersionConflict, E.Locked]).toContain(
        !loser.ok && loser.code,
      );
    });

    it("approves an empty round only with confirmation and moves the track behind it", async () => {
      const { projectId, roundId } = await openRound();
      const before = await f.readProject(projectId);
      expect(
        await approvePortalFeedback(f.contact(), roundId, {
          version: 1,
          confirmFinal: false,
        }),
      ).toEqual({ ok: false, code: E.ConfirmationRequired });

      await save(roundId, [item("doch was")]);
      expect(
        await approvePortalFeedback(f.contact(), roundId, {
          version: 2,
          confirmFinal: true,
        }),
      ).toEqual({ ok: false, code: E.ItemsPresent });
      await save(roundId, [], 2);

      expect(
        await approvePortalFeedback(f.contact(), roundId, {
          version: 3,
          confirmFinal: true,
        }),
      ).toMatchObject({
        ok: true,
        value: { status: FeedbackRoundStatus.Approved },
      });
      const after = await f.readProject(projectId);
      expect(after.current_process_step).toBe("Launch");
      expect(after.phase).toBe(before.phase);
      expect(
        await handOverFeedbackRound(projectId, { areaOptions: [] }, f.member()),
      ).toEqual({
        ok: false,
        code: FeedbackRoundErrorCode.ProjectAlreadyApproved,
      });
      expect(
        await getPortalProjectFeedback(f.contact(), projectId),
      ).toMatchObject({
        quota: { remaining: 0, approvedRoundNumber: 1 },
        activeRound: null,
        history: [{ id: roundId, status: FeedbackRoundStatus.Approved }],
      });
    });

    it("lets the owner view read but never submit", async () => {
      const { projectId } = await openRound();
      const owner = createPortalOwnerView({
        userId: f.actor().userId,
        customerId: f.customerId,
        permissions: new Set(PORTAL_READ_PERMISSION_VALUES),
      });
      expect(await getPortalProjectFeedback(owner, projectId)).toMatchObject({
        canSubmit: false,
        activeRound: { roundNumber: 1 },
      });
    });

    it("hides everything without the feedback permissions or for another company", async () => {
      const { projectId, roundId } = await openRound();
      const reader = f.contact([
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
        Permission.PortalFeedbackSubmit,
      ]);
      expect(await getPortalProjectFeedback(reader, projectId)).toBeNull();
      expect(
        await savePortalFeedbackDraft(reader, roundId, {
          version: 1,
          items: [],
        }),
      ).toEqual({ ok: false, code: E.NotFound });

      const viewer = f.contact([
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
        Permission.PortalFeedbackRead,
      ]);
      expect(await getPortalProjectFeedback(viewer, projectId)).toMatchObject({
        canSubmit: false,
      });
      expect(
        await submitPortalFeedbackRound(viewer, roundId, { version: 1 }),
      ).toEqual({ ok: false, code: E.NotFound });

      const stranger = f.contact(undefined, f.foreignCustomerId);
      expect(await getPortalProjectFeedback(stranger, projectId)).toBeNull();
      expect(
        await approvePortalFeedback(stranger, roundId, {
          version: 1,
          confirmFinal: true,
        }),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(
        await detachPortalFeedbackFile(stranger, {
          roundId,
          itemId: crypto.randomUUID(),
          fileId: crypto.randomUUID(),
        }),
      ).toEqual({ ok: false, code: E.NotFound });
    });
  },
);
