import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PORTAL_READ_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { LineItemKind as Kind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { PortalServiceRequestErrorCode as E } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import { PortalServiceRequestLimits } from "@invessiv/common/constants/portal/portal-service-request-limits";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import {
  activities,
  conversations,
  feedbackRounds,
  lineItemTemplates,
  messages,
  serviceRequests,
} from "@invessiv/db/record-configuration";
import {
  createPortalActor,
  type PortalActor,
} from "@/server/portal/auth/portal-actor";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { createPortalServiceRequest } from "@/server/portal/command-handler/create-portal-service-request.command-handler";
import { withdrawPortalServiceRequest } from "@/server/portal/command-handler/withdraw-portal-service-request.command-handler";
import { getPortalServices } from "@/server/portal/query-handler/get-portal-services.query-handler";
import { portalServiceRequestService } from "@/server/portal/services/service-requests/portal-service-request-service";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

const FORBIDDEN_KEYS = [
  "priceCents",
  "pricingMode",
  "recurringInterval",
  "version",
  "membershipId",
  "decidedByMemberId",
];

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal service requests with real portal sessions",
  () => {
    const f = createFeedbackIntegrationFixture();
    const PREFIX = `integration:portal-service-requests:${randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );
    const customerIds = [f.customerId, f.foreignCustomerId];
    const templateIds: string[] = [];
    let standard: string;
    let hours: string;
    let round: string;
    let contactA: PortalActor;
    let contactB: PortalActor;

    async function template(
      kind: Kind,
      overrides: Partial<typeof lineItemTemplates.$inferInsert> = {},
    ) {
      const id = randomUUID();
      templateIds.push(id);
      await f
        .database()
        .insert(lineItemTemplates)
        .values({
          id,
          title: `${PREFIX}${kind}`,
          description: "Internal scope, never shown",
          price_cents: 12500,
          pricing_mode:
            kind === Kind.Hours
              ? ServicePricingMode.Rate
              : ServicePricingMode.OneTime,
          recurring_interval: null,
          status: LineItemTemplateStatus.Active,
          kind,
          project_mode: LineItemProjectMode.ExistingProject,
          portal_requestable: true,
          portal_description: "Text for customers",
          version: 1,
          ...overrides,
        });
      return id;
    }

    function input(
      overrides: Partial<CreatePortalServiceRequestDto> = {},
    ): CreatePortalServiceRequestDto {
      return {
        idempotencyKey: randomUUID(),
        lineItemTemplateId: standard,
        title: null,
        note: "",
        requestedMinutes: null,
        projectWish: Wish.Existing,
        projectId: f.projectId,
        ...overrides,
      };
    }

    const freeText = (overrides: Partial<CreatePortalServiceRequestDto> = {}) =>
      input({
        lineItemTemplateId: null,
        title: "Second landing page",
        note: "For the summer offer",
        projectWish: Wish.New,
        projectId: null,
        ...overrides,
      });

    async function created(
      actor: PortalActor,
      request: CreatePortalServiceRequestDto,
    ): Promise<string> {
      const result = await createPortalServiceRequest(actor, request);
      if (!result.ok) throw new Error(`Expected a request, got ${result.code}`);
      return result.requestId;
    }

    /** Only this run's catalog entries: the development database may hold released ones too. */
    async function ownCatalog(reader: Parameters<typeof getPortalServices>[0]) {
      const services = await getPortalServices(reader);
      return (services?.services ?? []).filter((service) =>
        templateIds.includes(service.id),
      );
    }

    const rowsOf = (customerId: string) =>
      f
        .database()
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.customer_id, customerId));

    const noticesOf = (customerId: string, key: SystemMessageKey) =>
      f
        .database()
        .select({ key: messages.body, params: messages.metadata })
        .from(messages)
        .innerJoin(
          conversations,
          eq(conversations.id, messages.conversation_id),
        )
        .where(
          and(
            eq(conversations.customer_id, customerId),
            eq(messages.body, key),
          ),
        );

    beforeAll(async () => {
      await f.setup();
      standard = await template(Kind.Standard);
      hours = await template(Kind.Hours);
      round = await template(Kind.FeedbackRound);
      contactA = await sessions.session(f.customerId);
      contactB = await sessions.session(f.foreignCustomerId);
    }, 60_000);

    beforeEach(async () => {
      const db = f.database();
      await db
        .delete(serviceRequests)
        .where(inArray(serviceRequests.customer_id, customerIds));
      await db
        .delete(messages)
        .where(
          inArray(
            messages.conversation_id,
            db
              .select({ id: conversations.id })
              .from(conversations)
              .where(inArray(conversations.customer_id, customerIds)),
          ),
        );
      await db
        .delete(activities)
        .where(inArray(activities.customer_id, customerIds));
    }, 60_000);

    afterAll(async () => {
      const db = f.database();
      await db
        .delete(serviceRequests)
        .where(inArray(serviceRequests.customer_id, customerIds));
      if (templateIds.length > 0)
        await db
          .delete(lineItemTemplates)
          .where(inArray(lineItemTemplates.id, templateIds));
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it("offers only active, released catalog entries and drops an archived one at once", async () => {
      const hidden = await template(Kind.Standard, {
        portal_requestable: false,
      });
      const archived = await template(Kind.Standard);

      expect(
        (await ownCatalog(contactA)).map((service) => service.id).sort(),
      ).toEqual([standard, hours, round, archived].sort());

      await f
        .database()
        .update(lineItemTemplates)
        .set({ status: LineItemTemplateStatus.Archived })
        .where(eq(lineItemTemplates.id, archived));

      const ids = (await ownCatalog(contactA)).map((service) => service.id);
      expect(ids).not.toContain(archived);
      expect(ids).not.toContain(hidden);
      expect(
        await createPortalServiceRequest(
          contactA,
          input({ lineItemTemplateId: archived }),
        ),
      ).toEqual({ ok: false, code: E.NotFound });
    });

    it("never serialises a price, a version or a person", async () => {
      await created(contactA, input({ note: "Please by June" }));

      const services = await getPortalServices(contactA);
      const serialised = JSON.stringify(services);

      for (const key of FORBIDDEN_KEYS)
        expect(serialised).not.toContain(`"${key}"`);
      expect(serialised).not.toContain("Internal scope, never shown");
      expect(services?.requests).toHaveLength(1);
      expect(services?.requests[0]).toMatchObject({
        title: `${PREFIX}${Kind.Standard}`,
        note: "Please by June",
        status: S.Requested,
        projectWish: Wish.Existing,
        canWithdraw: true,
      });
      expect(services?.requests[0]?.projectTitle).toEqual(expect.any(String));
    });

    it("takes title and kind from the catalog and announces the request once", async () => {
      const id = await created(contactA, input());

      const [row] = await rowsOf(f.customerId);
      expect(row).toMatchObject({
        id,
        customer_id: f.customerId,
        line_item_template_id: standard,
        kind: Kind.Standard,
        title: `${PREFIX}${Kind.Standard}`,
        status: S.Requested,
        requested_project_id: f.projectId,
        requested_by_membership_id: contactA.membershipId,
        version: 1,
      });
      const events = await f
        .database()
        .select()
        .from(activities)
        .where(eq(activities.customer_id, f.customerId));
      expect(events).toHaveLength(1);
      expect(events[0]!.metadata).toEqual({
        entity: "service_request",
        service_request_id: id,
        previous_status: null,
        next_status: S.Requested,
      });
      const notices = await noticesOf(
        f.customerId,
        SystemMessageKey.ServiceRequested,
      );
      expect(notices).toHaveLength(1);
      expect(notices[0]!.params).toEqual({
        serviceTitle: `${PREFIX}${Kind.Standard}`,
      });
    });

    it("keeps companies apart for reading, requesting and withdrawing", async () => {
      const ofA = await created(contactA, input());

      expect((await getPortalServices(contactB))?.requests).toEqual([]);
      expect(
        (await getPortalServices(contactB))?.projects.map(
          (project) => project.id,
        ),
      ).not.toContain(f.projectId);
      expect(
        await createPortalServiceRequest(
          contactB,
          input({ projectId: f.projectId }),
        ),
      ).toEqual({ ok: false, code: E.Validation });
      expect(await withdrawPortalServiceRequest(contactB, ofA)).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await rowsOf(f.foreignCustomerId)).toEqual([]);
      expect((await rowsOf(f.customerId))[0]?.status).toBe(S.Requested);
    });

    it("demands the request right for writing and the read right for reading", async () => {
      const readOnly = f.contact([
        Permission.PortalAccess,
        Permission.PortalServicesRead,
      ]);
      const none = f.contact([Permission.PortalAccess]);
      const ofA = await created(contactA, input());

      expect(await createPortalServiceRequest(readOnly, input())).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await withdrawPortalServiceRequest(readOnly, ofA)).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await getPortalServices(none)).toBeNull();
      expect(await getPortalServices(readOnly)).toMatchObject({
        canRequest: false,
        requests: [{ id: ofA, canWithdraw: false }],
      });
    });

    it("rejects unknown fields instead of ignoring them", async () => {
      for (const extra of [
        { customerId: f.foreignCustomerId },
        { priceCents: 1 },
        { kind: Kind.Hours },
      ])
        expect(
          await createPortalServiceRequest(contactA, {
            ...input(),
            ...extra,
          } as CreatePortalServiceRequestDto),
        ).toEqual({ ok: false, code: E.Validation });
      expect(await rowsOf(f.customerId)).toEqual([]);
    });

    it("answers a repeated idempotency key with the request it created", async () => {
      const request = input();

      const first = await created(contactA, request);
      const second = await created(contactA, request);

      expect(second).toBe(first);
      expect(await rowsOf(f.customerId)).toHaveLength(1);
      expect(
        await noticesOf(f.customerId, SystemMessageKey.ServiceRequested),
      ).toHaveLength(1);
      expect(
        await createPortalServiceRequest(
          contactB,
          freeText({ idempotencyKey: request.idempotencyKey }),
        ),
      ).toEqual({ ok: false, code: E.Validation });
    });

    it("rejects a concurrent foreign idempotency key without an insert error or a second event", async () => {
      const idempotencyKey = randomUUID();
      let release!: () => void;
      const bothPrechecksFinished = new Promise<void>((resolve) => {
        release = resolve;
      });
      const selectable = portalServiceRequestService.selectableProjects;
      let arrivals = 0;
      // Force both transactions past the initially empty key lookup before either can insert.
      const barrier = vi
        .spyOn(portalServiceRequestService, "selectableProjects")
        .mockImplementation(async (...args) => {
          arrivals += 1;
          if (arrivals === 2) release();
          await bothPrechecksFinished;
          return selectable(...args);
        });
      try {
        const results = await Promise.all([
          createPortalServiceRequest(contactA, freeText({ idempotencyKey })),
          createPortalServiceRequest(contactB, freeText({ idempotencyKey })),
        ]);
        expect(results.filter((result) => result.ok)).toHaveLength(1);
        expect(results.filter((result) => !result.ok)).toEqual([
          { ok: false, code: E.Validation },
        ]);
        expect([
          ...(await rowsOf(f.customerId)),
          ...(await rowsOf(f.foreignCustomerId)),
        ]).toHaveLength(1);
        expect([
          ...(await noticesOf(f.customerId, SystemMessageKey.ServiceRequested)),
          ...(await noticesOf(
            f.foreignCustomerId,
            SystemMessageKey.ServiceRequested,
          )),
        ]).toHaveLength(1);
        const events = await f
          .database()
          .select()
          .from(activities)
          .where(inArray(activities.customer_id, customerIds));
        expect(events).toHaveLength(1);
      } finally {
        release();
        barrier.mockRestore();
      }
    });

    it("keeps old requested and offered requests visible beyond the closed history cap", async () => {
      const oldRound = await created(
        contactA,
        input({ lineItemTemplateId: round }),
      );
      const offered = await created(contactA, freeText());
      const oldDate = new Date("2026-01-01T00:00:00.000Z");
      await f
        .database()
        .update(serviceRequests)
        .set({ created_at: oldDate })
        .where(eq(serviceRequests.id, oldRound));
      await f
        .database()
        .update(serviceRequests)
        .set({ created_at: oldDate, status: S.Offered, offered_at: oldDate })
        .where(eq(serviceRequests.id, offered));
      const [base] = await rowsOf(f.customerId);
      if (!base) throw new Error("Missing history fixture base");
      const closed = Array.from(
        { length: PortalServiceRequestLimits.HistoryShown + 1 },
        (_, index) => ({
          ...base,
          id: randomUUID(),
          idempotency_key: randomUUID(),
          status: S.Withdrawn,
          offered_at: null,
          decided_at: oldDate,
          created_at: new Date(oldDate.getTime() + (index + 1) * 1000),
        }),
      );
      await f.database().insert(serviceRequests).values(closed);

      const services = await getPortalServices(contactA);
      expect(services?.requests).toHaveLength(
        PortalServiceRequestLimits.HistoryShown + 2,
      );
      expect(services?.requests.map((request) => request.id)).not.toContain(
        closed[0]!.id,
      );
      expect(
        services?.requests.find((request) => request.id === oldRound),
      ).toMatchObject({ status: S.Requested, canWithdraw: true });
      expect(
        services?.requests.find((request) => request.id === offered),
      ).toMatchObject({ status: S.Offered, canWithdraw: true });
      expect(services?.requests[0]?.id).toBe(closed.at(-1)!.id);
      expect((await getPortalServices(contactB))?.requests).toEqual([]);
      expect(
        await withdrawPortalServiceRequest(contactA, oldRound),
      ).toMatchObject({ ok: true });
      expect(
        (await ownCatalog(contactA)).find((service) => service.id === round)
          ?.projectIds,
      ).toContain(f.projectId);
    });

    it("stops at the bound on open requests and frees a slot on withdrawal", async () => {
      let last = "";
      for (
        let index = 0;
        index < PortalServiceRequestLimits.OpenPerCustomer;
        index += 1
      )
        last = await created(contactA, freeText());

      expect(await createPortalServiceRequest(contactA, freeText())).toEqual({
        ok: false,
        code: E.LimitReached,
      });

      await withdrawPortalServiceRequest(contactA, last);
      expect((await createPortalServiceRequest(contactA, freeText())).ok).toBe(
        true,
      );
    }, 60_000);

    it("requires an amount in whole steps for hours and forbids one elsewhere", async () => {
      const forHours = (requestedMinutes: number | null) =>
        input({
          lineItemTemplateId: hours,
          requestedMinutes,
          projectWish: Wish.Undecided,
          projectId: null,
        });

      for (const request of [
        forHours(null),
        forHours(20),
        forHours(PortalServiceRequestLimits.MaxRequestedMinutes + 60),
        input({ requestedMinutes: 300 }),
        freeText({ requestedMinutes: 300 }),
      ])
        expect(await createPortalServiceRequest(contactA, request)).toEqual({
          ok: false,
          code: E.Validation,
        });

      await created(contactA, forHours(300));
      expect((await rowsOf(f.customerId))[0]).toMatchObject({
        kind: Kind.Hours,
        requested_minutes: 300,
        project_wish: Wish.Undecided,
        requested_project_id: null,
      });
    });

    it("accepts only the project answers the service allows", async () => {
      for (const request of [
        // A catalog entry on an existing project is neither a new venture nor undecided.
        input({ projectWish: Wish.New, projectId: null }),
        input({ projectWish: Wish.Undecided, projectId: null }),
        // A catalog entry takes its title from the catalog.
        input({ title: "My own title" }),
        // Free text needs a title and a description.
        freeText({ title: null }),
        freeText({ note: "" }),
        // `existing` and a project belong together.
        freeText({ projectWish: Wish.Existing, projectId: null }),
        freeText({ projectWish: Wish.New, projectId: f.projectId }),
        freeText({ projectWish: Wish.Existing, projectId: randomUUID() }),
      ])
        expect(await createPortalServiceRequest(contactA, request)).toEqual({
          ok: false,
          code: E.Validation,
        });

      await created(contactA, freeText({ projectWish: Wish.Undecided }));
      await created(
        contactA,
        freeText({ projectWish: Wish.Existing, projectId: f.projectId }),
      );
      const rows = await rowsOf(f.customerId);
      expect(rows).toHaveLength(2);
      expect(rows.every((row) => row.kind === Kind.Standard)).toBe(true);
      expect(rows.every((row) => row.line_item_template_id === null)).toBe(
        true,
      );
    });

    it("offers a further round once per project and never on an approved one", async () => {
      const open = await f.project();
      const approved = await f.project();
      await f.database().insert(feedbackRounds).values({
        id: randomUUID(),
        project_id: approved,
        customer_id: f.customerId,
        round_number: 1,
        status: FeedbackRoundStatus.Approved,
        area_options: [],
        handed_over_by_member_id: f.memberId,
        handed_over_at: new Date(),
        approved_at: new Date(),
        version: 1,
      });
      const roundFor = (projectId: string) =>
        input({ lineItemTemplateId: round, projectId });
      const offered = async () =>
        (await ownCatalog(contactA)).find((service) => service.id === round)
          ?.projectIds ?? [];

      expect(await offered()).toContain(open);
      expect(await offered()).not.toContain(approved);
      expect(
        await createPortalServiceRequest(contactA, roundFor(approved)),
      ).toEqual({ ok: false, code: E.Validation });
      expect(
        await createPortalServiceRequest(
          contactA,
          input({
            lineItemTemplateId: round,
            projectWish: Wish.Undecided,
            projectId: null,
          }),
        ),
      ).toEqual({ ok: false, code: E.Validation });

      await created(contactA, roundFor(open));

      expect(await offered()).not.toContain(open);
      expect(
        await createPortalServiceRequest(contactA, roundFor(open)),
      ).toEqual({ ok: false, code: E.DuplicateOpen });
    });

    it("names no archived project and takes none for hours", async () => {
      const archived = await f.project({ status: ProjectStatus.Archived });

      const services = await getPortalServices(contactA);
      expect(services?.projects.map((project) => project.id)).not.toContain(
        archived,
      );
      expect(
        await createPortalServiceRequest(
          contactA,
          input({
            lineItemTemplateId: hours,
            requestedMinutes: 300,
            projectId: archived,
          }),
        ),
      ).toEqual({ ok: false, code: E.Validation });
    });

    it("withdraws from requested only, and a second time without a second event", async () => {
      const id = await created(contactA, input());

      expect(await withdrawPortalServiceRequest(contactA, id)).toEqual({
        ok: true,
        alreadyWithdrawn: false,
      });
      expect(await withdrawPortalServiceRequest(contactA, id)).toEqual({
        ok: true,
        alreadyWithdrawn: true,
      });

      const [row] = await rowsOf(f.customerId);
      expect(row).toMatchObject({ status: S.Withdrawn, version: 2 });
      expect(row!.decided_at).toBeInstanceOf(Date);
      expect(
        await noticesOf(f.customerId, SystemMessageKey.ServiceRequestWithdrawn),
      ).toHaveLength(1);
      expect((await getPortalServices(contactA))?.requests[0]).toMatchObject({
        status: S.Withdrawn,
        canWithdraw: false,
      });
    });

    it("lets the customer turn an offer down and locks a decided request", async () => {
      const offered = await created(contactA, input());
      await f
        .database()
        .update(serviceRequests)
        .set({ status: S.Offered, offered_at: new Date() })
        .where(eq(serviceRequests.id, offered));
      expect(await withdrawPortalServiceRequest(contactA, offered)).toEqual({
        ok: true,
        alreadyWithdrawn: false,
      });
      const id = await created(contactA, input());
      await f
        .database()
        .update(serviceRequests)
        .set({
          status: S.Declined,
          decline_reason: "Not offered",
          decided_at: new Date(),
          decided_by_member_id: f.memberId,
        })
        .where(eq(serviceRequests.id, id));

      expect(await withdrawPortalServiceRequest(contactA, id)).toEqual({
        ok: false,
        code: E.Locked,
      });
      expect(
        await withdrawPortalServiceRequest(contactA, randomUUID()),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(
        await withdrawPortalServiceRequest(contactA, "not-a-uuid"),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(
        (await rowsOf(f.customerId)).find((row) => row.id === id)?.status,
      ).toBe(S.Declined);
    });

    it("names no project to a contact without the project read permission", async () => {
      const withoutProjects = createPortalActor({
        ...contactA,
        permissions: new Set([
          Permission.PortalAccess,
          Permission.PortalServicesRead,
          Permission.PortalServicesRequest,
        ]),
      });

      const services = await getPortalServices(withoutProjects);

      expect(services?.projects).toEqual([]);
      expect(
        services?.services.find((service) => service.id === standard)
          ?.projectIds,
      ).toEqual([]);
      expect(
        services?.requests.every((request) => request.projectTitle === null),
      ).toBe(true);
      expect(
        await createPortalServiceRequest(withoutProjects, input()),
      ).toEqual({ ok: false, code: E.Validation });
    });

    it("lets the owner view read catalog and requests without the right to request", async () => {
      const id = await created(contactA, input());
      const owner = createPortalOwnerView({
        userId: f.actor().userId,
        customerId: f.customerId,
        permissions: new Set(PORTAL_READ_PERMISSION_VALUES),
      });

      const services = await getPortalServices(owner);

      expect(services?.canRequest).toBe(false);
      expect(services?.requests).toMatchObject([{ id, canWithdraw: false }]);
      expect(services?.services.map((service) => service.id)).toEqual(
        expect.arrayContaining([standard, hours]),
      );
    });
  },
);
