import { eq, inArray } from "drizzle-orm";
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
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { TimeEntryListLimits } from "@invessiv/common/constants/crm/time-entry-list-limits";
import { PortalHoursErrorCode as E } from "@invessiv/common/constants/portal/portal-hours-error-codes";
import type { CreateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/create-time-entry-request.dto";
import {
  customerHourPurchases,
  projectHourAllocations,
  projectTimeEntries,
  projects,
  tasks,
} from "@invessiv/db/record-configuration";
import { businessToday } from "@/common/patterns/time/business-today";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { getPortalHours } from "@/server/portal/query-handler/get-portal-hours.query-handler";
import { listPortalTimeEntries } from "@/server/portal/query-handler/list-portal-time-entries.query-handler";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { createHourAllocation } from "@/server/workspace/crm/command-handler/create-hour-allocation.command-handler";
import { createHourPurchase } from "@/server/workspace/crm/command-handler/create-hour-purchase.command-handler";
import { createTimeEntry } from "@/server/workspace/crm/command-handler/create-time-entry.command-handler";
import { getCustomerHours } from "@/server/workspace/crm/query-handler/get-customer-hours.query-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

const FORBIDDEN_KEYS = [
  "memberId",
  "performedByMemberId",
  "createdByMemberId",
  "version",
  "hourlyRate",
  "budget",
];
const HOURS_ONLY = [Permission.PortalAccess, Permission.PortalHoursRead];
const WITH_ENTRIES = [...HOURS_ONLY, Permission.PortalHoursEntriesRead];

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal hours with real portal sessions",
  () => {
    const f = createFeedbackIntegrationFixture();
    const PREFIX = `integration:portal-hours:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );
    const customerIds = [f.customerId, f.foreignCustomerId];
    const today = businessToday();
    const projectA = f.projectId;
    const projectB = f.siblingProjectId;

    const member = () =>
      f.actor({
        permissions: new Set([
          Permission.HoursRead,
          Permission.HoursWrite,
          Permission.HoursManage,
        ]),
      });

    async function stock(
      customerId: string,
      minutes: number,
      kind: HourPurchaseKind = HourPurchaseKind.Purchase,
    ) {
      const result = await createHourPurchase(
        customerId,
        {
          idempotencyKey: crypto.randomUUID(),
          kind,
          minutes,
          purchasedOn: today,
          note: "Betreuung",
        },
        member(),
      );
      if (!result.ok) throw new Error("Expected the purchase");
    }

    async function allocate(
      customerId: string,
      projectId: string,
      minutes: number,
    ) {
      const result = await createHourAllocation(
        customerId,
        {
          idempotencyKey: crypto.randomUUID(),
          projectId,
          minutes,
          note: "internal allocation note",
        },
        member(),
      );
      if (!result.ok) throw new Error("Expected the allocation");
    }

    async function book(
      projectId: string,
      overrides: Partial<CreateTimeEntryRequestDto> = {},
    ) {
      const result = await createTimeEntry(
        projectId,
        {
          performedOn: today,
          durationMinutes: 60,
          description: "Umbau Hero-Section",
          billable: true,
          taskId: null,
          ...overrides,
        },
        member(),
      );
      if (!result.ok) throw new Error("Expected the time entry");
    }

    async function task(projectId: string, visibleToCustomer: boolean) {
      const id = crypto.randomUUID();
      await f
        .database()
        .insert(tasks)
        .values({
          id,
          project_id: projectId,
          title: visibleToCustomer ? "Sichtbare Aufgabe" : "Interne Aufgabe",
          description: "",
          status: TaskStatus.Open,
          action_side: TaskActionSide.Internal,
          visible_to_customer: visibleToCustomer,
          assignee_member_id: f.memberId,
          version: 1,
        });
      return id;
    }

    const setProjectStatus = (projectId: string, status: ProjectStatus) =>
      f
        .database()
        .update(projects)
        .set({ status })
        .where(eq(projects.id, projectId));

    /** The worked example of the folder README: 10:00 bought, 5:00 each, 2:30 and 6:00 booked. */
    async function workedExample() {
      await stock(f.customerId, 600);
      await allocate(f.customerId, projectA, 300);
      await allocate(f.customerId, projectB, 300);
      await book(projectA, { durationMinutes: 150 });
      await book(projectB, { durationMinutes: 360 });
    }

    async function entriesOf(
      reader: Parameters<typeof listPortalTimeEntries>[0],
      query: Parameters<typeof listPortalTimeEntries>[1] = {},
    ) {
      const result = await listPortalTimeEntries(reader, query);
      if (!result.ok) throw new Error("Expected a page of time entries");
      return result.page;
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    beforeEach(async () => {
      const db = f.database();
      await db
        .delete(projectTimeEntries)
        .where(inArray(projectTimeEntries.customer_id, customerIds));
      await db
        .delete(projectHourAllocations)
        .where(inArray(projectHourAllocations.customer_id, customerIds));
      await db
        .delete(customerHourPurchases)
        .where(inArray(customerHourPurchases.customer_id, customerIds));
      await db
        .update(projects)
        .set({ status: ProjectStatus.Active })
        .where(inArray(projects.customer_id, customerIds));
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it("shows the worked example to a contact with the standard role", async () => {
      await workedExample();
      const contact = await sessions.session(f.customerId);

      const hours = await getPortalHours(contact);

      expect(hours?.balance).toEqual({
        purchasedMinutes: 600,
        usedMinutes: 510,
        remainingMinutes: 90,
        unassignedMinutes: 0,
      });
      expect(
        hours?.projects.find((project) => project.projectId === projectA),
      ).toMatchObject({ allocatedMinutes: 300, remainingMinutes: 150 });
      expect(
        hours?.projects.find((project) => project.projectId === projectB),
      ).toMatchObject({ usedMinutes: 360, remainingMinutes: -60 });
      expect(hours?.earlierProjects).toBeNull();
      expect(hours?.purchases).toEqual([
        {
          purchasedOn: today,
          minutes: 600,
          isCorrection: false,
          note: "Betreuung",
        },
      ]);
      expect(hours?.canReadEntries).toBe(true);
    });

    it("adds up to the same sums as the cockpit", async () => {
      await workedExample();
      await book(projectA, { durationMinutes: 45, billable: false });
      const contact = await sessions.session(f.customerId);

      const portal = await getPortalHours(contact);
      const cockpit = await getCustomerHours(f.customerId, member());

      expect(portal?.balance).toEqual({
        purchasedMinutes: cockpit?.balance?.purchasedMinutes,
        usedMinutes: cockpit?.balance?.usedMinutes,
        remainingMinutes: cockpit?.balance?.remainingMinutes,
        unassignedMinutes: cockpit?.balance?.freeMinutes,
      });
      for (const project of portal?.projects ?? []) {
        expect(project).toMatchObject({
          allocatedMinutes: cockpit?.projects.find(
            (candidate) => candidate.projectId === project.projectId,
          )?.allocatedMinutes,
          usedMinutes: cockpit?.projects.find(
            (candidate) => candidate.projectId === project.projectId,
          )?.usedMinutes,
        });
      }
    });

    it("folds an archived project into the earlier projects and keeps it in the balance", async () => {
      await stock(f.customerId, 600);
      await allocate(f.customerId, projectA, 300);
      await allocate(f.customerId, projectB, 180);
      await book(projectA, { durationMinutes: 60 });
      await book(projectB, { durationMinutes: 120 });
      await setProjectStatus(projectB, ProjectStatus.Archived);
      const contact = await sessions.session(f.customerId);

      const hours = await getPortalHours(contact);

      expect(hours?.projects.map((project) => project.projectId)).toEqual([
        projectA,
      ]);
      expect(hours?.earlierProjects).toEqual({
        allocatedMinutes: 180,
        usedMinutes: 120,
        remainingMinutes: 60,
        openMinutes: 60,
        overMinutes: 0,
      });
      expect(hours?.balance).toMatchObject({
        usedMinutes: 180,
        remainingMinutes: 420,
        unassignedMinutes: 120,
      });

      const page = await entriesOf(contact);
      expect(page.entries.map((entry) => entry.projectId).sort()).toEqual(
        [projectA, null].sort(),
      );
      expect(
        await listPortalTimeEntries(contact, { projectId: projectB }),
      ).toEqual({ ok: false, code: E.Validation });
    });

    it("keeps two companies apart for the balance and the entry list", async () => {
      await workedExample();
      await stock(f.foreignCustomerId, 120);
      await allocate(f.foreignCustomerId, f.foreignProjectId, 60);
      await book(f.foreignProjectId, {
        durationMinutes: 15,
        description: "Fremde Buchung",
      });
      const own = await sessions.session(f.customerId);
      const foreign = await sessions.session(f.foreignCustomerId);

      expect((await getPortalHours(foreign))?.balance).toEqual({
        purchasedMinutes: 120,
        usedMinutes: 15,
        remainingMinutes: 105,
        unassignedMinutes: 60,
      });
      expect((await getPortalHours(own))?.balance.purchasedMinutes).toBe(600);

      expect(
        await listPortalTimeEntries(own, { projectId: f.foreignProjectId }),
      ).toEqual({ ok: false, code: E.Validation });
      const ownPage = await entriesOf(own);
      expect(ownPage.entries).toHaveLength(2);
      expect(ownPage.entries.map((entry) => entry.description)).not.toContain(
        "Fremde Buchung",
      );
      expect(
        (await entriesOf(foreign)).entries.map((entry) => entry.description),
      ).toEqual(["Fremde Buchung"]);
    });

    it("answers nothing without portal.hours.read and no list without the detail right", async () => {
      await workedExample();

      expect(await getPortalHours(f.contact([Permission.PortalAccess]))).toBe(
        null,
      );

      const summaryOnly = f.contact(HOURS_ONLY);
      expect(await getPortalHours(summaryOnly)).toMatchObject({
        balance: { remainingMinutes: 90 },
        canReadEntries: false,
      });
      expect(await listPortalTimeEntries(summaryOnly, {})).toEqual({
        ok: false,
        code: E.NotFound,
      });
    });

    it("names a task only when it is customer-visible and the reader may read tasks", async () => {
      await stock(f.customerId, 600);
      const visibleTask = await task(projectA, true);
      const internalTask = await task(projectA, false);
      await book(projectA, { taskId: visibleTask, description: "sichtbar" });
      await book(projectA, { taskId: internalTask, description: "intern" });

      const withTasks = await entriesOf(
        f.contact([...WITH_ENTRIES, Permission.PortalTasksRead]),
      );
      expect(
        withTasks.entries.find((entry) => entry.description === "sichtbar")
          ?.taskTitle,
      ).toBe("Sichtbare Aufgabe");
      expect(
        withTasks.entries.find((entry) => entry.description === "intern")
          ?.taskTitle,
      ).toBeNull();

      const withoutTasks = await entriesOf(f.contact(WITH_ENTRIES));
      expect(withoutTasks.entries.map((entry) => entry.taskTitle)).toEqual([
        null,
        null,
      ]);
    });

    it("shows a goodwill entry as not billable without touching the used minutes", async () => {
      await stock(f.customerId, 600);
      await book(projectA, { durationMinutes: 60 });
      await book(projectA, {
        durationMinutes: 30,
        billable: false,
        description: "Kulanz",
      });
      const contact = f.contact(WITH_ENTRIES);

      expect((await getPortalHours(contact))?.balance.usedMinutes).toBe(60);
      expect(
        (await entriesOf(contact)).entries.find(
          (entry) => entry.description === "Kulanz",
        ),
      ).toMatchObject({ billable: false, durationMinutes: 30 });
    });

    it("counts a customer with only goodwill entries or a fully corrected purchase as content", async () => {
      await book(projectA, { billable: false });
      expect(await getPortalHours(f.contact(HOURS_ONLY))).not.toBeNull();

      await f
        .database()
        .delete(projectTimeEntries)
        .where(eq(projectTimeEntries.customer_id, f.customerId));
      await stock(f.customerId, 60);
      await stock(f.customerId, -60, HourPurchaseKind.Correction);
      expect(await getPortalHours(f.contact(HOURS_ONLY))).toMatchObject({
        balance: { purchasedMinutes: 0 },
        purchases: [{ isCorrection: true }, { isCorrection: false }],
      });
    });

    it("serializes no member id, version, rate or budget", async () => {
      await workedExample();
      const contact = await sessions.session(f.customerId);

      const serialized =
        JSON.stringify(await getPortalHours(contact)) +
        JSON.stringify(await entriesOf(contact));

      for (const key of FORBIDDEN_KEYS)
        expect(serialized).not.toContain(`"${key}"`);
      expect(serialized).not.toContain(f.memberId);
      expect(serialized).not.toContain("internal allocation note");
    });

    it("lets the owner view read the balance and the entries", async () => {
      await workedExample();
      const owner = createPortalOwnerView({
        userId: f.actor().userId,
        customerId: f.customerId,
        permissions: new Set(PORTAL_READ_PERMISSION_VALUES),
      });

      expect(await getPortalHours(owner)).toMatchObject({
        balance: { remainingMinutes: 90 },
        canReadEntries: true,
      });
      expect((await entriesOf(owner)).entries).toHaveLength(2);
    });

    it("answers null for a customer without any purchase or time entry", async () => {
      const contact = await sessions.session(f.customerId);

      expect(await getPortalHours(contact)).toBeNull();
      expect(await entriesOf(contact)).toEqual({
        entries: [],
        nextCursor: null,
      });
    });

    it("pages by cursor, filters by project and rejects an unreadable cursor", async () => {
      await stock(f.customerId, 600);
      const db = f.database();
      const total = TimeEntryListLimits.PageSize + 2;
      await db.insert(projectTimeEntries).values(
        Array.from({ length: total }, (_, index) => ({
          id: crypto.randomUUID(),
          customer_id: f.customerId,
          project_id: index === 0 ? projectB : projectA,
          task_id: null,
          performed_on: today,
          duration_minutes: 15,
          description: `Buchung ${index}`,
          billable: true,
          performed_by_member_id: f.memberId,
          version: 1,
        })),
      );
      const contact = f.contact(WITH_ENTRIES);

      const first = await entriesOf(contact);
      expect(first.entries).toHaveLength(TimeEntryListLimits.PageSize);
      expect(first.nextCursor).not.toBeNull();
      const second = await entriesOf(contact, {
        cursor: first.nextCursor ?? undefined,
      });
      expect(second.entries).toHaveLength(2);
      expect(second.nextCursor).toBeNull();
      expect(
        new Set([...first.entries, ...second.entries].map((entry) => entry.id))
          .size,
      ).toBe(total);

      expect(
        (await entriesOf(contact, { projectId: projectB })).entries,
      ).toHaveLength(1);
      expect(await listPortalTimeEntries(contact, { cursor: "nope" })).toEqual({
        ok: false,
        code: E.Validation,
      });
      expect(
        await listPortalTimeEntries(contact, { projectId: "not-a-uuid" }),
      ).toEqual({ ok: false, code: E.Validation });
    });
  },
);
