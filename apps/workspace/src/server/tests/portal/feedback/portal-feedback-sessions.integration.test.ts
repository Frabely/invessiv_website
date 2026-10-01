import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode as E } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { messages, tasks } from "@invessiv/db/record-configuration";
import { approvePortalFeedback } from "@/server/portal/command-handler/approve-portal-feedback.command-handler";
import { attachPortalFeedbackFile } from "@/server/portal/command-handler/attach-portal-feedback-file.command-handler";
import { createPortalFileLink } from "@/server/portal/command-handler/create-portal-file-link.command-handler";
import { detachPortalFeedbackFile } from "@/server/portal/command-handler/detach-portal-feedback-file.command-handler";
import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";
import { submitPortalFeedbackRound } from "@/server/portal/command-handler/submit-portal-feedback-round.command-handler";
import { getPortalProjectFeedback } from "@/server/portal/query-handler/get-portal-project-feedback.query-handler";
import { messageService } from "@/server/shared/services/message/message-service";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal feedback with real portal sessions",
  () => {
    const f = createFeedbackIntegrationFixture();
    const PREFIX = `integration:feedback-sessions:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );
    const session = (customerId: string) => sessions.session(customerId);

    async function handOver(projectId: string) {
      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: ["Startseite"] },
        f.member(),
      );
      if (!handed.ok) throw new Error("Expected a handed-over round");
      return handed.round.id;
    }

    async function chatKeys() {
      const rows = await f
        .database()
        .select({ body: messages.body })
        .from(messages)
        .where(eq(messages.customer_id, f.customerId));
      return rows.map((row) => row.body);
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it("runs handover, drafts of two contacts, conflict and submission", async () => {
      const contactA = await session(f.customerId);
      const contactB = await session(f.customerId);
      const projectId = await f.project();
      const roundId = await handOver(projectId);

      const first = crypto.randomUUID();
      const items = [
        { id: first, areaLabel: "Startseite", kind: null, body: "Logo größer" },
        {
          id: crypto.randomUUID(),
          areaLabel: null,
          kind: null,
          body: "Farben",
        },
      ];
      expect(
        await savePortalFeedbackDraft(contactA, roundId, { version: 1, items }),
      ).toMatchObject({ ok: true, value: { version: 2 } });
      const link = await createPortalFileLink(contactA, {
        displayName: "Screenshot",
        url: "https://example.com/screenshot",
      });
      expect(
        link.ok &&
          (await attachPortalFeedbackFile(
            contactA,
            { roundId, itemId: first },
            { fileId: link.value.id },
          )),
      ).toMatchObject({ ok: true });

      expect(
        await savePortalFeedbackDraft(contactB, roundId, {
          version: 1,
          items: [],
        }),
      ).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: { current: { items: [{ id: first }, {}] } },
      });

      expect(
        await submitPortalFeedbackRound(contactA, roundId, { version: 2 }),
      ).toMatchObject({
        ok: true,
        value: { round: { status: FeedbackRoundStatus.Submitted } },
      });
      const roundTasks = await f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.feedback_round_id, roundId));
      expect(roundTasks).toHaveLength(1);
      expect(await chatKeys()).toContain(
        SystemMessageKey.FeedbackRoundSubmitted,
      );
    });

    it("approves an empty round and closes further handovers", async () => {
      const contact = await session(f.customerId);
      const projectId = await f.project();
      const roundId = await handOver(projectId);
      expect(
        await approvePortalFeedback(contact, roundId, {
          version: 1,
          confirmFinal: true,
        }),
      ).toMatchObject({
        ok: true,
        value: { status: FeedbackRoundStatus.Approved },
      });
      expect((await f.readProject(projectId)).current_process_step).toBe(
        "Launch",
      );
      expect(
        await handOverFeedbackRound(projectId, { areaOptions: [] }, f.member()),
      ).toEqual({
        ok: false,
        code: FeedbackRoundErrorCode.ProjectAlreadyApproved,
      });
      expect(await chatKeys()).toContain(SystemMessageKey.FeedbackApproved);
    });

    it("gives a contact of another company nothing, even with guessed ids", async () => {
      const owner = await session(f.customerId);
      const stranger = await session(f.foreignCustomerId);
      const projectId = await f.project();
      const roundId = await handOver(projectId);
      const itemId = crypto.randomUUID();
      await savePortalFeedbackDraft(owner, roundId, {
        version: 1,
        items: [{ id: itemId, areaLabel: null, kind: null, body: "intern" }],
      });
      const link = await createPortalFileLink(owner, {
        displayName: "Datei",
        url: "https://example.com/file",
      });
      const fileId = link.ok ? link.value.id : "";
      await attachPortalFeedbackFile(owner, { roundId, itemId }, { fileId });

      const notFound = { ok: false, code: E.NotFound };
      expect(await getPortalProjectFeedback(stranger, projectId)).toBeNull();
      expect(
        await savePortalFeedbackDraft(stranger, roundId, {
          version: 2,
          items: [],
        }),
      ).toEqual(notFound);
      expect(
        await submitPortalFeedbackRound(stranger, roundId, { version: 2 }),
      ).toEqual(notFound);
      expect(
        await attachPortalFeedbackFile(
          stranger,
          { roundId, itemId },
          { fileId },
        ),
      ).toEqual(notFound);
      expect(
        await detachPortalFeedbackFile(stranger, { roundId, itemId, fileId }),
      ).toEqual(notFound);
    });

    it("keeps the write when the chat notice fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const contact = await session(f.customerId);
      const projectId = await f.project();
      const failure = vi
        .spyOn(messageService, "appendSystemMessage")
        .mockRejectedValue(new Error("chat down"));

      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: [] },
        f.member(),
      );
      expect(handed).toMatchObject({ ok: true });
      const roundId = handed.ok ? handed.round.id : "";
      await savePortalFeedbackDraft(contact, roundId, {
        version: 1,
        items: [
          { id: crypto.randomUUID(), areaLabel: null, kind: null, body: "x" },
        ],
      });
      expect(
        await submitPortalFeedbackRound(contact, roundId, { version: 2 }),
      ).toMatchObject({ ok: true, value: { alreadySubmitted: false } });
      expect((await f.readRound(roundId)).status).toBe(
        FeedbackRoundStatus.Submitted,
      );
      expect(failure).toHaveBeenCalledTimes(2);
      failure.mockRestore();
    });
  },
);
