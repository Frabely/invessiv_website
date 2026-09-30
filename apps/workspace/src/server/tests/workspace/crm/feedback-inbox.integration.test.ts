import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { feedbackRounds } from "@invessiv/db/record-configuration";
import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";
import { submitPortalFeedbackRound } from "@/server/portal/command-handler/submit-portal-feedback-round.command-handler";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import { markFeedbackRoundRead } from "@/server/workspace/crm/command-handler/mark-feedback-round-read.command-handler";
import { countUnreadFeedbackRounds } from "@/server/workspace/crm/query-handler/count-unread-feedback-rounds.query-handler";
import { listFeedbackInbox } from "@/server/workspace/crm/query-handler/list-feedback-inbox.query-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

const NO_FILTERS = { status: null, unreadOnly: false, customerId: null };

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "feedback inbox PostgreSQL integration",
  () => {
    const f = createFeedbackIntegrationFixture();

    /** A member who may read exactly one project; the queue of the whole database stays out of view. */
    function boundTo(projectId: string, customerId = f.customerId) {
      return f.actor({
        permissions: new Set(),
        projectPermissions: new Map([
          [
            projectId,
            {
              customerId,
              permissions: new Set([Permission.ProjectsRead]),
            },
          ],
        ]),
      });
    }

    async function handedOverRound(projectId: string) {
      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: [] },
        f.member(),
      );
      if (!handed.ok) throw new Error("Expected a handed-over round");
      return handed.round.id;
    }

    async function submittedRound(bodies = ["  Logo größer  ", "Farbe"]) {
      const projectId = await f.project();
      const roundId = await handedOverRound(projectId);
      await savePortalFeedbackDraft(f.contact(), roundId, {
        version: 1,
        items: bodies.map((body) => ({
          id: crypto.randomUUID(),
          areaLabel: null,
          kind: null,
          body,
        })),
      });
      const submitted = await submitPortalFeedbackRound(f.contact(), roundId, {
        version: 2,
      });
      if (!submitted.ok) throw new Error("Expected a submitted round");
      return { projectId, roundId };
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("lists a submitted round as new with counts and the first item's text", async () => {
      const { projectId, roundId } = await submittedRound();
      const actor = boundTo(projectId);

      const inbox = await listFeedbackInbox(NO_FILTERS, actor);
      expect(inbox.items).toEqual([
        expect.objectContaining({
          id: roundId,
          projectId,
          customerId: f.customerId,
          status: FeedbackRoundStatus.Submitted,
          itemCount: 2,
          fileCount: 0,
          excerpt: "Logo größer",
          unread: true,
        }),
      ]);
      expect(inbox.customers.map((customer) => customer.id)).toEqual([
        f.customerId,
      ]);
      expect(await countUnreadFeedbackRounds(actor)).toBe(1);
    });

    it("stamps read once, keeps status and version, and lowers the counter", async () => {
      const { projectId, roundId } = await submittedRound();
      const actor = boundTo(projectId);
      const before = await f.readRound(roundId);

      expect(await markFeedbackRoundRead(roundId, actor)).toEqual({
        ok: true,
        marked: true,
      });
      const first = await f.readRound(roundId);
      expect(first.read_at).not.toBeNull();
      expect(first.status).toBe(FeedbackRoundStatus.Submitted);
      expect(first.version).toBe(before.version);

      expect(await markFeedbackRoundRead(roundId, actor)).toEqual({
        ok: true,
        marked: false,
      });
      expect((await f.readRound(roundId)).read_at).toEqual(first.read_at);
      expect(await countUnreadFeedbackRounds(actor)).toBe(0);
      const [listed] = (await listFeedbackInbox(NO_FILTERS, actor)).items;
      expect(listed).toMatchObject({ id: roundId, unread: false });
    });

    it("never stamps a round that is still with the customer", async () => {
      const projectId = await f.project();
      const roundId = await handedOverRound(projectId);

      expect(await markFeedbackRoundRead(roundId, boundTo(projectId))).toEqual({
        ok: true,
        marked: false,
      });
      expect((await f.readRound(roundId)).read_at).toBeNull();
    });

    it("keeps open and completed rounds out of the inbox", async () => {
      const openProject = await f.project();
      await handedOverRound(openProject);
      expect(
        (await listFeedbackInbox(NO_FILTERS, boundTo(openProject))).items,
      ).toEqual([]);

      const { projectId, roundId } = await submittedRound();
      await f
        .database()
        .update(feedbackRounds)
        .set({
          status: FeedbackRoundStatus.Completed,
          completed_at: new Date(),
          completed_by_member_id: f.memberId,
        })
        .where(eq(feedbackRounds.id, roundId));
      const actor = boundTo(projectId);
      expect((await listFeedbackInbox(NO_FILTERS, actor)).items).toEqual([]);
      expect(await countUnreadFeedbackRounds(actor)).toBe(0);
    });

    it("hides rounds outside a bound role, in the list, the counter and the stamp", async () => {
      const { roundId } = await submittedRound();
      const sibling = boundTo(f.siblingProjectId);
      const foreign = f.actor({
        permissions: new Set(),
        customerPermissions: new Map([
          [f.foreignCustomerId, new Set([Permission.ProjectsRead])],
        ]),
      });

      for (const actor of [sibling, foreign]) {
        const inbox = await listFeedbackInbox(NO_FILTERS, actor);
        expect(inbox.items.map((item) => item.id)).not.toContain(roundId);
        expect(inbox.customers.map((c) => c.id)).not.toContain(f.customerId);
        expect(await markFeedbackRoundRead(roundId, actor)).toEqual({
          ok: false,
          code: E.RoundNotFound,
        });
      }
      expect(await countUnreadFeedbackRounds(sibling)).toBe(0);
      expect((await f.readRound(roundId)).read_at).toBeNull();
    });

    it("filters by status, unread and customer without losing the customer options", async () => {
      const { projectId, roundId } = await submittedRound();
      const actor = boundTo(projectId);

      expect(
        (
          await listFeedbackInbox(
            { ...NO_FILTERS, status: FeedbackRoundStatus.InProgress },
            actor,
          )
        ).items,
      ).toEqual([]);
      expect(
        (await listFeedbackInbox({ ...NO_FILTERS, unreadOnly: true }, actor))
          .items[0]?.id,
      ).toBe(roundId);

      const otherCustomer = await listFeedbackInbox(
        { ...NO_FILTERS, customerId: f.foreignCustomerId },
        actor,
      );
      expect(otherCustomer.items).toEqual([]);
      expect(otherCustomer.customers.map((c) => c.id)).toEqual([f.customerId]);

      await markFeedbackRoundRead(roundId, actor);
      expect(
        (await listFeedbackInbox({ ...NO_FILTERS, unreadOnly: true }, actor))
          .items,
      ).toEqual([]);
    });

    it("rejects malformed ids as not found", async () => {
      expect(await markFeedbackRoundRead("not-a-uuid", f.member())).toEqual({
        ok: false,
        code: E.RoundNotFound,
      });
    });
  },
);
