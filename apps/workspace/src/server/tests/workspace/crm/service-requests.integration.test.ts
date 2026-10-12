import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { LineItemKind as Kind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import type { AcceptServiceRequestRequestDto } from "@invessiv/common/contracts/crm/service-requests/accept-service-request-request.dto";
import {
  activities,
  conversations,
  messages,
  serviceRequests,
  lineItemTemplates,
  projectLineItems,
  projects,
  customerHourPurchases,
  feedbackRounds,
} from "@invessiv/db/record-configuration";
import { acceptServiceRequest } from "@/server/workspace/crm/command-handler/accept-service-request.command-handler";
import { changeServiceRequestStatus } from "@/server/workspace/crm/command-handler/change-service-request-status.command-handler";
import { listCustomerServiceRequests } from "@/server/workspace/crm/query-handler/list-customer-service-requests.query-handler";
import { SERVICE_REQUEST_INBOX_PAGE_SIZE } from "@/common/constants/crm/service-request-inbox-page-size";
import { listServiceRequestInbox } from "@/server/workspace/crm/query-handler/list-service-request-inbox.query-handler";
import { countOpenServiceRequests } from "@/server/workspace/crm/query-handler/count-open-service-requests.query-handler";
import {
  createProjectFormValues,
  toCreateProjectRequest,
} from "@/common/patterns/crm/project-form";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "service requests PostgreSQL integration",
  () => {
    const f = createFeedbackIntegrationFixture();
    const newTemplateTitle = `integration:service-requests:${f.customerId}:template`;
    const templateIds: string[] = [];
    const allPermissions = [
      Permission.ServiceRequestsRead,
      Permission.ServiceRequestsWrite,
      Permission.ProjectsRead,
      Permission.ProjectsWrite,
      Permission.ProjectLineItemsWrite,
      Permission.LineItemTemplatesWrite,
      Permission.HoursManage,
    ];
    const actor = (permissions = allPermissions) => f.member(permissions);
    const reader = () =>
      f.actor({
        permissions: new Set(),
        customerPermissions: new Map([
          [f.customerId, new Set([Permission.ServiceRequestsRead])],
        ]),
      });
    let standard: string;
    let hours: string;
    let round: string;

    async function template(kind: Kind) {
      const id = randomUUID();
      templateIds.push(id);
      await f
        .database()
        .insert(lineItemTemplates)
        .values({
          id,
          title: "Integration catalog service",
          description: "",
          price_cents: 10000,
          pricing_mode:
            kind === Kind.Hours
              ? ServicePricingMode.Rate
              : ServicePricingMode.OneTime,
          recurring_interval: null,
          status: LineItemTemplateStatus.Active,
          kind,
          project_mode: LineItemProjectMode.ExistingProject,
          portal_requestable: false,
          portal_description: "",
          version: 1,
        });
      return id;
    }
    async function request(
      overrides: Partial<typeof serviceRequests.$inferInsert> = {},
    ) {
      const id = randomUUID();
      await f
        .database()
        .insert(serviceRequests)
        .values({
          id,
          customer_id: f.customerId,
          requested_by_membership_id: f.membershipId,
          line_item_template_id: standard,
          kind: Kind.Standard,
          title: "Private requested service",
          note: "Private customer note",
          project_wish: Mode.Undecided,
          status: S.Requested,
          idempotency_key: id,
          version: 1,
          ...overrides,
        });
      return id;
    }
    function acceptance(
      projectId: string,
      templateId = standard,
      quantityMinutes: number | null = null,
    ): AcceptServiceRequestRequestDto {
      return {
        version: 1,
        acceptWithoutOffer: true,
        project: { mode: Mode.Existing, projectId },
        template: { mode: Mode.Existing, lineItemTemplateId: templateId },
        lineItem: {
          title: "Offered service",
          description: "",
          priceCents: 10000,
          pricingMode:
            templateId === hours
              ? ServicePricingMode.Rate
              : ServicePricingMode.OneTime,
          recurringInterval: null,
          status: ProjectLineItemStatus.Planned,
          quantityMinutes,
        },
      };
    }
    const newProject = () =>
      toCreateProjectRequest(
        createProjectFormValues(null, {
          steps: ["Onboarding", "Design", "Development", "Launch"],
          feedbackRoundPositions: [3, 3],
          currentProcessStep: "Onboarding",
        }),
      );
    function newAcceptance(): AcceptServiceRequestRequestDto {
      const input = acceptance(f.projectId);
      return {
        ...input,
        project: {
          mode: Mode.New,
          project: {
            ...newProject(),
            title: "Integration new request project",
          },
        },
        template: {
          mode: Mode.New,
          template: {
            title: newTemplateTitle,
            description: "",
            priceCents: 12000,
            pricingMode: ServicePricingMode.OneTime,
            recurringInterval: null,
            kind: Kind.Standard,
            projectMode: LineItemProjectMode.NewProject,
            portalRequestable: true,
            portalDescription: "Not published on acceptance",
          },
        },
      };
    }
    async function row(id: string) {
      const [current] = await f
        .database()
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, id));
      return current;
    }
    async function purchases() {
      return f
        .database()
        .select()
        .from(customerHourPurchases)
        .where(eq(customerHourPurchases.customer_id, f.customerId));
    }

    beforeAll(async () => {
      await f.setup();
      standard = await template(Kind.Standard);
      hours = await template(Kind.Hours);
      round = await template(Kind.FeedbackRound);
    }, 60_000);
    afterAll(async () => {
      await f
        .database()
        .delete(serviceRequests)
        .where(eq(serviceRequests.customer_id, f.customerId));
      // Newly created templates are isolated by exact fixture title.
      await f
        .database()
        .delete(lineItemTemplates)
        .where(eq(lineItemTemplates.title, newTemplateTitle));
      await f
        .database()
        .delete(lineItemTemplates)
        .where(inArray(lineItemTemplates.id, templateIds));
      await f.cleanup();
    }, 60_000);

    it("scopes inbox, customer list and counter independently of project read access", async () => {
      const id = await request({
        project_wish: Mode.Existing,
        requested_project_id: f.projectId,
      });
      expect(
        await listCustomerServiceRequests(f.foreignCustomerId, reader()),
      ).toEqual([]);
      const list = await listCustomerServiceRequests(f.customerId, reader());
      expect(list).toContainEqual(
        expect.objectContaining({
          id,
          requestedProjectTitle: null,
          requestedByName: expect.any(String),
        }),
      );
      expect(
        (await listServiceRequestInbox(true, reader())).items.map((r) => r.id),
      ).toContain(id);
      expect(await countOpenServiceRequests(reader())).toBe(1);
      const denied = f.actor({
        permissions: new Set(),
        customerPermissions: new Map([
          [
            f.foreignCustomerId,
            new Set([
              Permission.ServiceRequestsRead,
              Permission.ServiceRequestsWrite,
            ]),
          ],
        ]),
      });
      expect(await listServiceRequestInbox(false, denied)).toEqual({
        items: [],
        hasRequests: false,
        page: 1,
        perPage: SERVICE_REQUEST_INBOX_PAGE_SIZE,
        total: 0,
      });
      expect(await countOpenServiceRequests(denied)).toBe(0);
      expect(
        await changeServiceRequestStatus(
          id,
          { to: S.Offered, version: 1 },
          denied,
        ),
      ).toEqual({ ok: false, code: E.ServiceRequestNotFound });
      expect(
        await acceptServiceRequest(id, acceptance(f.projectId), denied),
      ).toEqual({ ok: false, code: E.ServiceRequestNotFound });
      expect(await listServiceRequestInbox(false, actor([]))).toEqual({
        items: [],
        hasRequests: false,
        page: 1,
        perPage: SERVICE_REQUEST_INBOX_PAGE_SIZE,
        total: 0,
      });
      expect(await countOpenServiceRequests(actor([]))).toBe(0);
    });

    it("accepts a catalog request with project references and one safe event and announcement", async () => {
      const id = await request();
      const projectId = await f.project();
      const result = await acceptServiceRequest(
        id,
        acceptance(projectId),
        actor(),
      );
      expect(result).toMatchObject({
        ok: true,
        request: {
          status: S.Accepted,
          version: 2,
          projectId,
          projectLineItemId: expect.any(String),
        },
      });
      const current = await row(id);
      const [item] = await f
        .database()
        .select()
        .from(projectLineItems)
        .where(eq(projectLineItems.id, current.project_line_item_id!));
      expect(item).toMatchObject({
        project_id: projectId,
        kind: Kind.Standard,
      });
      const events = await f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.customer_id, f.customerId),
            eq(activities.project_id, projectId),
          ),
        );
      expect(events).toHaveLength(1);
      expect(events[0].metadata).toEqual({
        entity: "service_request",
        service_request_id: id,
        previous_status: S.Requested,
        next_status: S.Accepted,
      });
      const notices = await f
        .database()
        .select({ key: messages.body, params: messages.metadata })
        .from(messages)
        .innerJoin(
          conversations,
          eq(conversations.id, messages.conversation_id),
        )
        .where(eq(conversations.customer_id, f.customerId));
      expect(
        notices.filter(
          (n) => n.key === SystemMessageKey.ServiceRequestAccepted,
        ),
      ).toHaveLength(1);
      expect(notices[0].params).toEqual({
        serviceTitle: "Private requested service",
      });
      expect(
        await acceptServiceRequest(id, acceptance(projectId), actor()),
      ).toEqual({ ok: false, code: E.InvalidTransition });
      expect(
        await changeServiceRequestStatus(
          id,
          { to: S.Declined, version: 1, reason: "Private decline reason" },
          actor(),
        ),
      ).toEqual({ ok: false, code: E.InvalidTransition });
    });

    it("refuses acceptance before an offer unless it is stated on purpose", async () => {
      const id = await request();
      const projectId = await f.project();
      const unconfirmed = {
        ...acceptance(projectId),
        acceptWithoutOffer: false,
      };
      expect(await acceptServiceRequest(id, unconfirmed, actor())).toEqual({
        ok: false,
        code: E.OfferRequired,
      });
      expect(await row(id)).toMatchObject({
        status: S.Requested,
        version: 1,
        project_id: null,
        project_line_item_id: null,
      });
      await changeServiceRequestStatus(
        id,
        { to: S.Offered, version: 1 },
        actor(),
      );
      expect(
        await acceptServiceRequest(id, { ...unconfirmed, version: 2 }, actor()),
      ).toMatchObject({ ok: true, request: { status: S.Accepted } });
    });
    it("creates a private template and a project with the customer's owner and two rounds", async () => {
      const id = await request({ line_item_template_id: null });
      const result = await acceptServiceRequest(id, newAcceptance(), actor());
      expect(result.ok).toBe(true);
      const current = await row(id);
      const project = await f.readProject(current.project_id!);
      expect(project).toMatchObject({
        owner_member_id: f.memberId,
        included_feedback_rounds: 2,
      });
      const [item] = await f
        .database()
        .select()
        .from(projectLineItems)
        .where(eq(projectLineItems.id, current.project_line_item_id!));
      const [created] = await f
        .database()
        .select()
        .from(lineItemTemplates)
        .where(eq(lineItemTemplates.id, item.source_line_item_template_id!));
      expect(created).toMatchObject({
        kind: Kind.Standard,
        portal_requestable: false,
      });
    });

    it("rolls back the new project and template when assignment rejects the quantity", async () => {
      const id = await request({ line_item_template_id: null });
      const beforeProjects = await f
        .database()
        .select()
        .from(projects)
        .where(eq(projects.customer_id, f.customerId));
      const beforeTemplates = await f
        .database()
        .select()
        .from(lineItemTemplates)
        .where(eq(lineItemTemplates.title, newTemplateTitle));
      const input = newAcceptance();
      input.lineItem.quantityMinutes = 60;
      expect(await acceptServiceRequest(id, input, actor())).toEqual({
        ok: false,
        code: E.ValidationError,
      });
      expect(await row(id)).toMatchObject({
        status: S.Requested,
        version: 1,
        project_id: null,
        project_line_item_id: null,
      });
      expect(
        await f
          .database()
          .select()
          .from(projects)
          .where(eq(projects.customer_id, f.customerId)),
      ).toHaveLength(beforeProjects.length);
      expect(
        await f
          .database()
          .select()
          .from(lineItemTemplates)
          .where(eq(lineItemTemplates.title, newTemplateTitle)),
      ).toHaveLength(beforeTemplates.length);
    });

    it("credits exactly one corrected purchase under parallel acceptance", async () => {
      const id = await request({
        kind: Kind.Hours,
        line_item_template_id: hours,
        requested_minutes: 300,
      });
      const projectId = await f.project();
      const before = await purchases();
      const input = acceptance(projectId, hours, 240);
      const results = await Promise.all([
        acceptServiceRequest(id, input, actor()),
        acceptServiceRequest(id, input, actor()),
      ]);
      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(results.filter((r) => !r.ok)).toEqual([
        { ok: false, code: E.InvalidTransition },
      ]);
      const after = await purchases();
      expect(after).toHaveLength(before.length + 1);
      expect(
        after.filter((p) => !before.some((b) => b.id === p.id))[0]?.minutes,
      ).toBe(240);
      const [item] = await f
        .database()
        .select()
        .from(projectLineItems)
        .where(eq(projectLineItems.project_id, projectId));
      expect(item).toMatchObject({
        quantity_minutes: 240,
        status: ProjectLineItemStatus.Confirmed,
      });
    });

    it("refuses hours without their effect permission and a feedback round after approval", async () => {
      const hoursId = await request({
        kind: Kind.Hours,
        line_item_template_id: hours,
        requested_minutes: 300,
      });
      const projectId = await f.project();
      const before = await purchases();
      expect(
        await acceptServiceRequest(
          hoursId,
          acceptance(projectId, hours, 240),
          actor([
            Permission.ServiceRequestsWrite,
            Permission.ProjectLineItemsWrite,
          ]),
        ),
      ).toEqual({ ok: false, code: E.EffectNotPermitted });
      expect(await purchases()).toHaveLength(before.length);
      expect(await row(hoursId)).toMatchObject({
        status: S.Requested,
        version: 1,
      });
      await f.database().insert(feedbackRounds).values({
        id: randomUUID(),
        project_id: projectId,
        customer_id: f.customerId,
        round_number: 1,
        status: FeedbackRoundStatus.Approved,
        area_options: [],
        handed_over_by_member_id: f.memberId,
        handed_over_at: new Date(),
        approved_at: new Date(),
        version: 1,
      });
      const roundId = await request({
        kind: Kind.FeedbackRound,
        line_item_template_id: round,
      });
      expect(
        await acceptServiceRequest(
          roundId,
          acceptance(projectId, round),
          actor(),
        ),
      ).toEqual({ ok: false, code: E.FeedbackRoundNotAvailable });
      expect(await row(roundId)).toMatchObject({
        status: S.Requested,
        version: 1,
      });
      expect((await f.readProject(projectId)).included_feedback_rounds).toBe(2);
    });

    it("returns current data on a stale version and requires a customer-visible decline reason", async () => {
      const id = await request();
      expect(
        await changeServiceRequestStatus(
          id,
          { to: S.Declined, version: 1, reason: " " },
          actor(),
        ),
      ).toEqual({ ok: false, code: E.ValidationError });
      expect(
        await changeServiceRequestStatus(
          id,
          { to: S.Offered, version: 1 },
          actor(),
        ),
      ).toMatchObject({
        ok: true,
        request: {
          status: S.Offered,
          version: 2,
          offeredAt: expect.any(String),
        },
      });
      expect(
        await acceptServiceRequest(id, acceptance(f.projectId), actor()),
      ).toMatchObject({
        ok: false,
        code: E.VersionConflict,
        conflict: { currentVersion: 2, current: { id, status: S.Offered } },
      });
      expect(
        await changeServiceRequestStatus(
          id,
          { to: S.Declined, version: 1, reason: "Private decline reason" },
          actor(),
        ),
      ).toMatchObject({
        ok: false,
        code: E.VersionConflict,
        conflict: { currentVersion: 2 },
      });
      expect(
        await changeServiceRequestStatus(
          id,
          { to: S.Declined, version: 2, reason: "Private decline reason" },
          actor(),
        ),
      ).toMatchObject({
        ok: true,
        request: {
          status: S.Declined,
          declineReason: "Private decline reason",
        },
      });
      const events = await f
        .database()
        .select()
        .from(activities)
        .where(eq(activities.customer_id, f.customerId));
      const matching = events.filter(
        (e) => e.metadata?.service_request_id === id,
      );
      expect(matching).toHaveLength(2);
      expect(JSON.stringify(matching.map((e) => e.metadata))).not.toMatch(
        /Private|reason|title|note/i,
      );
      expect(
        (await listServiceRequestInbox(true, reader())).items.some(
          (r) => r.id === id,
        ),
      ).toBe(false);
      expect(
        (await listServiceRequestInbox(false, reader())).items.some(
          (r) => r.id === id,
        ),
      ).toBe(true);
    });

    it("rejects cross-customer projects, kind mismatch, archived templates and forbidden creation", async () => {
      const id = await request();
      expect(
        await acceptServiceRequest(id, acceptance(f.foreignProjectId), actor()),
      ).toEqual({ ok: false, code: E.ProjectNotFound });
      expect(
        await acceptServiceRequest(
          id,
          acceptance(f.projectId, hours, 60),
          actor(),
        ),
      ).toEqual({ ok: false, code: E.KindMismatch });
      const archived = await template(Kind.Standard);
      await f
        .database()
        .update(lineItemTemplates)
        .set({ status: LineItemTemplateStatus.Archived })
        .where(eq(lineItemTemplates.id, archived));
      expect(
        await acceptServiceRequest(
          id,
          acceptance(f.projectId, archived),
          actor(),
        ),
      ).toEqual({ ok: false, code: E.TemplateNotAssignable });
      expect(
        await acceptServiceRequest(
          id,
          newAcceptance(),
          actor([Permission.ServiceRequestsWrite]),
        ),
      ).toEqual({ ok: false, code: E.EffectNotPermitted });
      expect(await row(id)).toMatchObject({ status: S.Requested, version: 1 });
    });

    it("accepts hours into free stock even when the chosen project is closed", async () => {
      const projectId = await f.project({ status: ProjectStatus.Archived });
      const id = await request({
        kind: Kind.Hours,
        line_item_template_id: hours,
        requested_minutes: 300,
      });
      const input = acceptance(projectId, hours, 240);
      input.lineItem.allocateHoursToProject = false;
      expect(await acceptServiceRequest(id, input, actor())).toMatchObject({
        ok: true,
        request: { status: S.Accepted },
      });
    });

    // Stays last: it fills the inbox beyond one page, which would push the rows of other tests off page one.
    it("pages the inbox in a stable order and clamps a page beyond the end", async () => {
      const perPage = SERVICE_REQUEST_INBOX_PAGE_SIZE;
      for (let index = 0; index <= perPage; index += 1) await request();

      const first = await listServiceRequestInbox(true, reader(), 1);
      expect(first).toMatchObject({ page: 1, perPage, hasRequests: true });
      expect(first.total).toBeGreaterThan(perPage);
      expect(first.items).toHaveLength(perPage);

      const lastPage = Math.ceil(first.total / perPage);
      const pages = [first];
      for (let page = 2; page <= lastPage; page += 1)
        pages.push(await listServiceRequestInbox(true, reader(), page));
      const ids = pages.flatMap((page) => page.items.map((item) => item.id));
      expect(ids).toHaveLength(first.total);
      expect(new Set(ids).size).toBe(first.total);

      const beyond = await listServiceRequestInbox(true, reader(), 999);
      expect(beyond.page).toBe(lastPage);
      expect(beyond.items.map((item) => item.id)).toEqual(
        pages[lastPage - 1].items.map((item) => item.id),
      );

      const all = await listServiceRequestInbox(false, reader(), 1);
      expect(all.total).toBeGreaterThan(first.total);
      expect(all.items).toHaveLength(perPage);
    });
  },
);
