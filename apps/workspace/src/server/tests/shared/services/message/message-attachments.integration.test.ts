import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { sendMessageInputSchema } from "@invessiv/common/contracts/crm/send-message.input";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import {
  activities,
  files,
  messageFiles,
  projects,
} from "@invessiv/db/record-configuration";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { sendCustomerMessage } from "@/server/portal/command-handler/send-customer-message.command-handler";
import { getPortalConversation } from "@/server/portal/query-handler/get-portal-conversation.query-handler";
import { createFileLink } from "@/server/workspace/crm/command-handler/create-file-link.command-handler";
import { deleteFile } from "@/server/workspace/crm/command-handler/delete-file.command-handler";
import { sendInternalMessage } from "@/server/workspace/crm/command-handler/send-internal-message.command-handler";
import { getCustomerConversation } from "@/server/workspace/crm/query-handler/get-customer-conversation.query-handler";
import { listCustomerFiles } from "@/server/workspace/crm/query-handler/list-customer-files.query-handler";
import { createFileTestFixture } from "../../files/file-test-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "chat attachments PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    const chatPermissions = [
      Permission.ChatRead,
      Permission.ChatWrite,
      Permission.FilesRead,
      Permission.FilesWrite,
      Permission.FilesDelete,
    ];

    function member(permissions: Permission[] = chatPermissions) {
      return f.actor({ permissions: new Set(permissions) });
    }

    function contact() {
      return createPortalActor({
        userId: member().userId,
        membershipId: f.membershipId,
        customerId: f.customerId,
        // The sender name is read from the person behind the membership.
        personId: f.personId,
        firstName: null,
        permissions: new Set([
          Permission.PortalAccess,
          Permission.PortalMessagesRead,
          Permission.PortalMessagesWrite,
          Permission.PortalFilesRead,
          Permission.PortalFilesWrite,
        ]),
        projectPermissions: new Map(),
      });
    }

    async function link(
      overrides: Partial<{
        visibleToCustomer: boolean;
        projectId: string | null;
        customerId: string;
      }> = {},
    ) {
      const customerId = overrides.customerId ?? f.customerId;
      const created = await createFileLink(
        customerId,
        {
          displayName: "Brand guide",
          // Unique per entry, so a leak check cannot match another test's link.
          url: `https://example.com/${crypto.randomUUID()}`,
          projectId:
            overrides.projectId === undefined
              ? customerId === f.customerId
                ? f.projectId
                : f.foreignProjectId
              : overrides.projectId,
          visibleToCustomer: overrides.visibleToCustomer ?? true,
        },
        member(),
      );
      if (!created.ok) throw new Error("Expected link fixture");
      return created.value;
    }

    async function fileRow(id: string) {
      const [row] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, id));
      return row;
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("lets a contact attach a released entry and refuses hidden or foreign ones", async () => {
      const shared = await link();
      const hidden = await link({ visibleToCustomer: false });
      const foreign = await link({ customerId: f.foreignCustomerId });

      const sent = await sendCustomerMessage(
        contact(),
        sendMessageInputSchema.parse({
          body: "",
          clientMessageId: crypto.randomUUID(),
          attachmentFileIds: [shared.id],
        }),
      );
      expect(sent).toMatchObject({
        ok: true,
        message: {
          body: "",
          attachments: [
            {
              position: 0,
              available: true,
              fileId: shared.id,
              url: shared.url,
            },
          ],
        },
      });

      for (const id of [hidden.id, foreign.id, crypto.randomUUID()])
        expect(
          await sendCustomerMessage(
            contact(),
            sendMessageInputSchema.parse({
              body: "see attached",
              clientMessageId: crypto.randomUUID(),
              attachmentFileIds: [id],
            }),
          ),
        ).toMatchObject({ ok: false, code: MessageErrorCode.NotFound });
      expect(await fileRow(hidden.id)).toMatchObject({
        visible_to_customer: false,
      });
    });

    it("hides the name once the release is withdrawn", async () => {
      const entry = await link();
      const sent = await sendCustomerMessage(
        contact(),
        sendMessageInputSchema.parse({
          body: "logo",
          clientMessageId: crypto.randomUUID(),
          attachmentFileIds: [entry.id],
        }),
      );
      if (!sent.ok) throw new Error("Expected send");
      await f
        .database()
        .update(files)
        .set({ visible_to_customer: false })
        .where(eq(files.id, entry.id));

      const portal = await getPortalConversation(contact(), null);
      const seen = portal.ok
        ? portal.conversation.messages.find(
            (message) => message.id === sent.message.id,
          )
        : undefined;
      expect(seen?.attachments).toEqual([
        {
          position: 0,
          available: false,
          fileId: null,
          displayName: null,
          assetKind: null,
          url: null,
        },
      ]);
      expect(JSON.stringify(portal)).not.toContain(entry.url);

      const internal = await getCustomerConversation(
        f.customerId,
        member(),
        null,
      );
      expect(
        internal.ok &&
          internal.conversation.messages.find(
            (message) => message.id === sent.message.id,
          )?.attachments[0],
      ).toMatchObject({ available: true, fileId: entry.id });
    });

    it("releases an internal entry only with confirmation and once", async () => {
      const hidden = await link({ visibleToCustomer: false });
      const input = {
        body: "Draft for you",
        clientMessageId: crypto.randomUUID(),
        attachmentFileIds: [hidden.id],
      };

      expect(
        await sendInternalMessage(
          f.customerId,
          sendMessageInputSchema.parse(input),
          member(),
        ),
      ).toMatchObject({
        ok: false,
        code: MessageErrorCode.AttachmentReleaseRequired,
      });
      expect(await fileRow(hidden.id)).toMatchObject({
        visible_to_customer: false,
      });

      const confirmed = { ...input, releaseHiddenAttachments: true };
      const first = await sendInternalMessage(
        f.customerId,
        sendMessageInputSchema.parse(confirmed),
        member(),
      );
      const retry = await sendInternalMessage(
        f.customerId,
        sendMessageInputSchema.parse(confirmed),
        member(),
      );
      expect(first).toMatchObject({ ok: true });
      expect(retry.ok && first.ok && retry.message.id).toBe(
        first.ok ? first.message.id : null,
      );
      expect(await fileRow(hidden.id)).toMatchObject({
        visible_to_customer: true,
      });
      const releases = await f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.customer_id, f.customerId),
            eq(activities.type, ActivityType.FieldChange),
          ),
        );
      expect(
        releases.filter(
          (activity) =>
            activity.metadata?.file_id === hidden.id &&
            JSON.stringify(activity.metadata).includes("visible_to_customer"),
        ),
      ).toHaveLength(1);

      expect(
        await sendInternalMessage(
          f.customerId,
          sendMessageInputSchema.parse({ ...confirmed, attachmentFileIds: [] }),
          member(),
        ),
      ).toMatchObject({ ok: false, code: MessageErrorCode.ValidationError });
    });

    it("refuses what the customer could never open or the member may not release", async () => {
      const archivedProjectId = crypto.randomUUID();
      const [project] = await f
        .database()
        .select()
        .from(projects)
        .where(eq(projects.id, f.projectId));
      await f
        .database()
        .insert(projects)
        .values({
          ...project,
          id: archivedProjectId,
          status: ProjectStatus.Archived,
        });
      const archived = await link({ projectId: archivedProjectId });
      expect(
        await sendInternalMessage(
          f.customerId,
          sendMessageInputSchema.parse({
            body: "old draft",
            clientMessageId: crypto.randomUUID(),
            attachmentFileIds: [archived.id],
          }),
          member(),
        ),
      ).toMatchObject({
        ok: false,
        code: MessageErrorCode.AttachmentUnavailable,
      });
      const listed = async (shareable: boolean) => {
        const result = await listCustomerFiles(
          f.customerId,
          { projectId: archivedProjectId, shareable },
          member(),
        );
        if (!result.ok) throw new Error("Expected file list");
        return result.value.files.map((file) => file.id);
      };
      expect(await listed(false)).toContain(archived.id);
      expect(await listed(true)).not.toContain(archived.id);

      const hidden = await link({ visibleToCustomer: false });
      const foreign = await link({ customerId: f.foreignCustomerId });
      const readOnly = member([
        Permission.ChatRead,
        Permission.ChatWrite,
        Permission.FilesRead,
      ]);
      for (const [id, actor] of [
        [hidden.id, readOnly],
        [foreign.id, member()],
      ] as const)
        expect(
          await sendInternalMessage(
            f.customerId,
            sendMessageInputSchema.parse({
              body: "x",
              clientMessageId: crypto.randomUUID(),
              attachmentFileIds: [id],
              releaseHiddenAttachments: true,
            }),
            actor,
          ),
        ).toMatchObject({ ok: false, code: MessageErrorCode.NotFound });
      expect(await fileRow(hidden.id)).toMatchObject({
        visible_to_customer: false,
      });
    });

    it("answers an internal retry with the delivered message after its attachment became unavailable", async () => {
      const shared = await link();
      const input = sendMessageInputSchema.parse({
        body: "Here it is",
        clientMessageId: crypto.randomUUID(),
        attachmentFileIds: [shared.id],
      });
      const first = await sendInternalMessage(f.customerId, input, member());
      if (!first.ok) throw new Error("Expected the first send to succeed");
      await f
        .database()
        .update(files)
        .set({ orphaned_at: new Date() })
        .where(eq(files.id, shared.id));

      expect(
        await sendInternalMessage(f.customerId, input, member()),
      ).toMatchObject({
        ok: true,
        message: {
          id: first.message.id,
          attachments: [{ position: 0, available: false }],
        },
      });
    });

    it("drops the reference when the file is deleted and keeps the message", async () => {
      const entry = await link();
      const sent = await sendInternalMessage(
        f.customerId,
        sendMessageInputSchema.parse({
          body: "",
          clientMessageId: crypto.randomUUID(),
          attachmentFileIds: [entry.id],
        }),
        member(),
      );
      if (!sent.ok) throw new Error("Expected send");
      expect(
        await deleteFile(entry.id, { version: entry.version }, member()),
      ).toMatchObject({ ok: true });
      const references = await f
        .database()
        .select()
        .from(messageFiles)
        .where(eq(messageFiles.message_id, sent.message.id));
      expect(references).toHaveLength(0);
      const internal = await getCustomerConversation(
        f.customerId,
        member(),
        null,
      );
      expect(
        internal.ok &&
          internal.conversation.messages.find(
            (message) => message.id === sent.message.id,
          ),
      ).toMatchObject({ body: "", attachments: [] });
    });
  },
);
