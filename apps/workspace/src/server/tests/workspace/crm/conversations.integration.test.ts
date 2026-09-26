import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  conversationReads,
  conversations,
  customerContactAssignments,
  customers,
  messages,
  people,
  portalMembershipRoles,
  portalMemberships,
  rolePermissions,
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { markPortalConversationRead } from "@/server/portal/command-handler/mark-portal-conversation-read.command-handler";
import { sendCustomerMessage } from "@/server/portal/command-handler/send-customer-message.command-handler";
import { getPortalConversation } from "@/server/portal/query-handler/get-portal-conversation.query-handler";
import { resolvePortalActor } from "@/server/portal/query-handler/resolve-portal-actor.query-handler";
import { markConversationRead } from "@/server/workspace/crm/command-handler/mark-conversation-read.command-handler";
import { redactMessage } from "@/server/workspace/crm/command-handler/redact-message.command-handler";
import { sendInternalMessage } from "@/server/workspace/crm/command-handler/send-internal-message.command-handler";
import { updateConversationOwner } from "@/server/workspace/crm/command-handler/update-conversation-owner.command-handler";
import { getCustomerConversation } from "@/server/workspace/crm/query-handler/get-customer-conversation.query-handler";
import { listConversations } from "@/server/workspace/crm/query-handler/list-conversations.query-handler";
import { countUnreadConversations } from "@/server/workspace/crm/query-handler/count-unread-conversations.query-handler";
import { messageService } from "@/server/shared/services/message/message-service";
import { GET as getPortalConversationRoute } from "@/app/api/portal/[customerId]/conversation/route";
import { POST as sendPortalMessageRoute } from "@/app/api/portal/[customerId]/conversation/messages/route";
import { POST as markPortalReadRoute } from "@/app/api/portal/[customerId]/conversation/read/route";

vi.mock("server-only", () => ({}));
const clerkAuthMock = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth: clerkAuthMock }));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const PREFIX = "integration:conversations:";
type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "customer conversations PostgreSQL integration",
  () => {
    let db: Database;
    const ownerUserId = randomUUID();
    const ownerMemberId = randomUUID();
    const otherUserId = randomUUID();
    const otherMemberId = randomUUID();
    const portalUserId = randomUUID();
    const portalClerkId = `${PREFIX}${portalUserId}`;
    const personId = randomUUID();
    const customerA = randomUUID();
    const customerB = randomUUID();
    const membershipId = randomUUID();
    const accessOnlyRoleId = randomUUID();

    const internalActor = (
      memberId = ownerMemberId,
      userId = ownerUserId,
    ): WorkspaceActor => ({
      userId,
      workspaceMemberId: memberId,
      permissions: new Set([Permission.ChatRead, Permission.ChatWrite]),
      customerPermissions: new Map(),
      projectPermissions: new Map(),
    });

    async function expectPortalConversationRoutesToReturnNotFound(
      customerId: string,
    ) {
      clerkAuthMock.mockResolvedValue({ userId: portalClerkId });
      const context = { params: Promise.resolve({ customerId }) };
      const url = `http://localhost/api/portal/${customerId}/conversation`;
      const readResponse = await getPortalConversationRoute(
        new NextRequest(url),
        context,
      );
      const sendResponse = await sendPortalMessageRoute(
        new NextRequest(`${url}/messages`, {
          method: HttpMethod.Post,
          body: JSON.stringify({ body: "Message access probe" }),
          headers: { [HttpHeaderName.ContentType]: MediaType.Json },
        }),
        context,
      );
      const markReadResponse = await markPortalReadRoute(
        new NextRequest(`${url}/read`, { method: HttpMethod.Post }),
        context,
      );
      expect(readResponse.status).toBe(HttpResponseCode.NotFound);
      expect(sendResponse.status).toBe(HttpResponseCode.NotFound);
      expect(markReadResponse.status).toBe(HttpResponseCode.NotFound);
    }

    beforeAll(async () => {
      const workspaceRoot = findWorkspaceRoot(process.cwd());
      const loaded = loadDotenv({
        path: path.join(workspaceRoot, ".env.development.local"),
        quiet: true,
      });
      const databaseUrl =
        process.env.DATABASE_URL_DEVELOPMENT?.trim() ||
        loaded.parsed?.DATABASE_URL?.trim();
      if (!databaseUrl)
        throw new Error("Development database URL is not configured.");
      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();
      await db.insert(users).values([
        {
          id: ownerUserId,
          clerk_user_id: `${PREFIX}${ownerUserId}`,
          primary_email: `${ownerUserId}@example.test`,
          display_name: "Owner member",
          active: true,
          version: 1,
        },
        {
          id: otherUserId,
          clerk_user_id: `${PREFIX}${otherUserId}`,
          primary_email: `${otherUserId}@example.test`,
          display_name: "Other member",
          active: true,
          version: 1,
        },
        {
          id: portalUserId,
          clerk_user_id: portalClerkId,
          primary_email: `${portalUserId}@example.test`,
          display_name: "Portal contact",
          active: true,
          version: 1,
        },
      ]);
      await db.insert(workspaceMembers).values([
        { id: ownerMemberId, user_id: ownerUserId, active: true, version: 1 },
        { id: otherMemberId, user_id: otherUserId, active: true, version: 1 },
      ]);
      await db.insert(workspaceMemberRoles).values([
        {
          workspace_member_id: ownerMemberId,
          role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceOwner].id,
          role_realm: AuthRealm.Workspace,
          assigned_by_user_id: ownerUserId,
          assigned_at: new Date(),
        },
        {
          workspace_member_id: otherMemberId,
          role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceMember].id,
          role_realm: AuthRealm.Workspace,
          assigned_by_user_id: ownerUserId,
          assigned_at: new Date(),
        },
      ]);
      await db.insert(people).values({
        id: personId,
        display_name: "Portal contact",
        preferred_locale: "de",
        version: 1,
      });
      await db.insert(customers).values(
        [customerA, customerB].map((id) => ({
          id,
          display_name: `${PREFIX}${id}`,
          status: CustomerStatus.Active,
          owner_member_id: ownerMemberId,
          version: 1,
        })),
      );
      await db.insert(customerContactAssignments).values({
        id: randomUUID(),
        customer_id: customerA,
        person_id: personId,
        is_primary: true,
        version: 1,
      });
      await db.insert(portalMemberships).values({
        id: membershipId,
        customer_id: customerA,
        person_id: personId,
        user_id: portalUserId,
        activated_at: new Date(),
        email_notifications_enabled: true,
        version: 1,
      });
      await db.insert(portalMembershipRoles).values({
        portal_membership_id: membershipId,
        role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.PortalStandard].id,
        role_realm: AuthRealm.Portal,
        assigned_by_member_id: ownerMemberId,
        assigned_at: new Date(),
      });
    }, 60_000);

    afterAll(async () => {
      if (!db) return;
      await db
        .delete(activities)
        .where(inArray(activities.customer_id, [customerA, customerB]));
      await db.delete(conversationReads).where(
        inArray(
          conversationReads.conversation_id,
          db
            .select({ id: conversations.id })
            .from(conversations)
            .where(inArray(conversations.customer_id, [customerA, customerB])),
        ),
      );
      await db
        .delete(conversations)
        .where(inArray(conversations.customer_id, [customerA, customerB]));
      await db
        .delete(portalMemberships)
        .where(eq(portalMemberships.id, membershipId));
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.role_id, accessOnlyRoleId));
      await db.delete(roles).where(eq(roles.id, accessOnlyRoleId));
      await db
        .delete(customerContactAssignments)
        .where(eq(customerContactAssignments.customer_id, customerA));
      await db
        .delete(customers)
        .where(inArray(customers.id, [customerA, customerB]));
      await db.delete(people).where(eq(people.id, personId));
      await db
        .delete(workspaceMemberRoles)
        .where(
          inArray(workspaceMemberRoles.workspace_member_id, [
            ownerMemberId,
            otherMemberId,
          ]),
        );
      await db
        .delete(workspaceMembers)
        .where(inArray(workspaceMembers.id, [ownerMemberId, otherMemberId]));
      await db
        .delete(users)
        .where(inArray(users.id, [ownerUserId, otherUserId, portalUserId]));
    }, 60_000);

    it("can replay the additive migration twice without changing the schema", async () => {
      const workspaceRoot = findWorkspaceRoot(process.cwd());
      const migration = await readFile(
        path.join(
          workspaceRoot,
          "packages/db/migrations/0040_create_conversations.sql",
        ),
        "utf8",
      );
      const statements = migration
        .split(/^-->\s*statement-breakpoint\s*$/gm)
        .map((statement) => statement.trim())
        .filter(Boolean);
      await db.transaction(async (tx) => {
        for (const statement of statements)
          await tx.execute(sql.raw(statement));
        for (const statement of statements)
          await tx.execute(sql.raw(statement));
      });
      expect(statements.length).toBeGreaterThan(10);
    });

    it("creates one conversation concurrently and rejects a foreign customer session", async () => {
      const [first, second] = await Promise.all([
        getCustomerConversation(customerA, internalActor(), null),
        getCustomerConversation(customerA, internalActor(), null),
      ]);
      expect(first?.id).toBe(second?.id);
      const rows = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.customer_id, customerA));
      expect(rows).toHaveLength(1);
      const allowed = await resolvePortalActor(portalClerkId, customerA);
      const denied = await resolvePortalActor(portalClerkId, customerB);
      expect(allowed.ok).toBe(true);
      expect(denied.ok).toBe(false);
      await expectPortalConversationRoutesToReturnNotFound(customerB);
      expect(
        await db
          .select()
          .from(conversations)
          .where(eq(conversations.customer_id, customerB)),
      ).toHaveLength(0);
    });

    it("rejects a real membership without message permissions on every portal route", async () => {
      await db.insert(roles).values({
        id: accessOnlyRoleId,
        realm: AuthRealm.Portal,
        system_key: null,
        name: `${PREFIX}access-only-${accessOnlyRoleId}`,
        description: "Integration role with portal access only.",
        is_system: false,
        active: true,
        scope_assignable: false,
        version: 1,
      });
      await db.insert(rolePermissions).values({
        role_id: accessOnlyRoleId,
        realm: AuthRealm.Portal,
        role_is_system: false,
        role_scope_assignable: false,
        permission_key: Permission.PortalAccess,
        permission_delegable: true,
        permission_scope_assignable: false,
      });
      try {
        await db
          .delete(portalMembershipRoles)
          .where(eq(portalMembershipRoles.portal_membership_id, membershipId));
        await db.insert(portalMembershipRoles).values({
          portal_membership_id: membershipId,
          role_id: accessOnlyRoleId,
          role_realm: AuthRealm.Portal,
          assigned_by_member_id: ownerMemberId,
          assigned_at: new Date(),
        });
        await expectPortalConversationRoutesToReturnNotFound(customerA);
      } finally {
        await db
          .delete(portalMembershipRoles)
          .where(eq(portalMembershipRoles.portal_membership_id, membershipId));
        await db.insert(portalMembershipRoles).values({
          portal_membership_id: membershipId,
          role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.PortalStandard].id,
          role_realm: AuthRealm.Portal,
          assigned_by_member_id: ownerMemberId,
          assigned_at: new Date(),
        });
        await db
          .delete(rolePermissions)
          .where(eq(rolePermissions.role_id, accessOnlyRoleId));
        await db.delete(roles).where(eq(roles.id, accessOnlyRoleId));
      }
    });

    it("shares messages while keeping read positions per member and preserving redaction audit", async () => {
      const resolution = await resolvePortalActor(portalClerkId, customerA);
      if (!resolution.ok) throw new Error("Expected portal membership.");
      const portalActor = resolution.actor;
      const internal = await sendInternalMessage(
        customerA,
        "  First draft is ready.  ",
        internalActor(),
      );
      expect(internal.ok).toBe(true);
      const portalBefore = await getPortalConversation(portalActor, null);
      expect(portalBefore?.unreadCount).toBe(1);
      const sent = await sendCustomerMessage(portalActor, "  Thank you.  ");
      expect(sent.ok).toBe(true);
      const scopedReader: WorkspaceActor = {
        ...internalActor(),
        permissions: new Set(),
        customerPermissions: new Map([
          [customerA, new Set([Permission.ChatRead])],
        ]),
      };
      expect(
        (await getCustomerConversation(customerA, internalActor(), null))
          ?.unreadCount,
      ).toBe(1);
      expect(
        (await listConversations(internalActor())).find(
          (item) => item.customerId === customerA,
        )?.unreadCount,
      ).toBe(1);
      expect(await countUnreadConversations(scopedReader)).toBe(1);
      expect(
        (
          await getCustomerConversation(
            customerA,
            internalActor(otherMemberId, otherUserId),
            null,
          )
        )?.unreadCount,
      ).toBe(1);
      await db.transaction((tx) =>
        messageService.appendSystemMessage(
          tx,
          customerA,
          "project.phase.changed",
          {
            phase: "build",
          },
        ),
      );
      expect(
        (await getCustomerConversation(customerA, internalActor(), null))
          ?.unreadCount,
      ).toBe(1);
      expect(await markConversationRead(customerA, internalActor())).toEqual({
        ok: true,
      });
      expect(
        (await getCustomerConversation(customerA, internalActor(), null))
          ?.unreadCount,
      ).toBe(0);
      expect(await countUnreadConversations(scopedReader)).toBe(0);
      expect(
        (
          await getCustomerConversation(
            customerA,
            internalActor(otherMemberId, otherUserId),
            null,
          )
        )?.unreadCount,
      ).toBe(1);
      expect(await markPortalConversationRead(portalActor)).toEqual({
        ok: true,
      });
      if (!sent.ok) throw new Error("Expected customer message.");
      expect(
        await redactMessage(
          sent.message.id,
          internalActor(otherMemberId, otherUserId),
        ),
      ).toEqual({ ok: false, code: "FORBIDDEN" });
      expect(await redactMessage(sent.message.id, internalActor())).toEqual({
        ok: true,
      });
      const [stored] = await db
        .select({ body: messages.body, redactedAt: messages.redacted_at })
        .from(messages)
        .where(eq(messages.id, sent.message.id));
      expect(stored.body).toBeNull();
      expect(stored.redactedAt).not.toBeNull();
      expect(
        (await getPortalConversation(portalActor, null))?.messages.find(
          (message) => message.id === sent.message.id,
        )?.body,
      ).toBeNull();
      const audit = await db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.customer_id, customerA),
            eq(activities.type, ActivityType.FieldChange),
          ),
        );
      expect(audit).not.toHaveLength(0);
    });

    it("does not expose a foreign customer through internal handlers", async () => {
      const scoped: WorkspaceActor = {
        ...internalActor(),
        permissions: new Set(),
        customerPermissions: new Map([
          [customerA, new Set([Permission.ChatRead, Permission.ChatWrite])],
        ]),
      };
      expect(await getCustomerConversation(customerB, scoped, null)).toBeNull();
      expect(
        await sendInternalMessage(customerB, "wrong company", scoped),
      ).toEqual({ ok: false, code: "NOT_FOUND" });
      expect(await markConversationRead(customerB, scoped)).toEqual({
        ok: false,
        code: "NOT_FOUND",
      });
      expect(
        await updateConversationOwner(
          customerB,
          { ownerMemberId: otherMemberId, version: 1 },
          scoped,
        ),
      ).toEqual({ ok: false, code: "NOT_FOUND" });
      const [foreignMessage] = await db
        .select({ id: messages.id })
        .from(messages)
        .where(
          and(
            eq(messages.customer_id, customerA),
            eq(messages.type, MessageType.Text),
            isNull(messages.redacted_at),
          ),
        )
        .limit(1);
      const customerBOnly: WorkspaceActor = {
        ...scoped,
        customerPermissions: new Map([
          [customerB, new Set([Permission.ChatRead, Permission.ChatWrite])],
        ]),
      };
      expect(await redactMessage(foreignMessage.id, customerBOnly)).toEqual({
        ok: false,
        code: "NOT_FOUND",
      });
    });

    it("pages equal timestamps without gaps and rejects stale owner changes", async () => {
      const [conversation] = await db
        .select({ id: conversations.id, version: conversations.version })
        .from(conversations)
        .where(eq(conversations.customer_id, customerA));
      const createdAt = new Date("2026-09-20T08:00:00.000Z");
      await db.insert(messages).values(
        Array.from({ length: 55 }, (_, index) => ({
          id: randomUUID(),
          conversation_id: conversation.id,
          customer_id: customerA,
          type: MessageType.Text,
          body: `History ${index}`,
          metadata: null,
          sender_side: MessageSenderSide.Internal,
          sender_member_id: ownerMemberId,
          sender_portal_membership_id: null,
          sender_display_name: "Owner member",
          created_at: createdAt,
        })),
      );
      await db.insert(messages).values(
        Array.from({ length: 55 }, (_, index) => ({
          id: randomUUID(),
          conversation_id: conversation.id,
          customer_id: customerA,
          type: MessageType.Text,
          body: `Recent ${index}`,
          metadata: null,
          sender_side: MessageSenderSide.Internal,
          sender_member_id: ownerMemberId,
          sender_portal_membership_id: null,
          sender_display_name: "Owner member",
        })),
      );
      const ids: string[] = [];
      let cursor: string | null = null;
      for (let pageNumber = 0; pageNumber < 5; pageNumber += 1) {
        const page = await getCustomerConversation(
          customerA,
          internalActor(),
          cursor,
        );
        expect(page).not.toBeNull();
        if (pageNumber === 0) expect(page?.messages).toHaveLength(50);
        ids.push(...(page?.messages ?? []).map((message) => message.id));
        cursor = page?.nextCursor ?? null;
        if (!cursor) break;
      }
      const stored = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.customer_id, customerA));
      expect(ids).toHaveLength(stored.length);
      expect(new Set(ids).size).toBe(ids.length);
      expect(
        await getCustomerConversation(
          customerA,
          internalActor(),
          "not-a-cursor",
        ),
      ).toBeNull();
      const reassigned = await updateConversationOwner(
        customerA,
        { ownerMemberId: otherMemberId, version: conversation.version },
        internalActor(),
      );
      expect(reassigned.ok).toBe(true);
      const stale = await updateConversationOwner(
        customerA,
        { ownerMemberId: ownerMemberId, version: conversation.version },
        internalActor(),
      );
      expect(stale.ok).toBe(false);
      if (!stale.ok) expect(stale.code).toBe("VERSION_CONFLICT");
      await db
        .update(workspaceMembers)
        .set({ active: false })
        .where(eq(workspaceMembers.id, otherMemberId));
      const inactive = await updateConversationOwner(
        customerA,
        { ownerMemberId: otherMemberId, version: conversation.version + 1 },
        internalActor(),
      );
      expect(inactive).toEqual({ ok: false, code: "VALIDATION_ERROR" });
    });
  },
);
