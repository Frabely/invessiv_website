import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customerHourPurchases,
  customers,
  feedbackRounds,
  lineItemTemplates,
  projectHourAllocations,
  projectLineItems,
  projects,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { createProjectLineItem } from "@/server/workspace/crm/command-handler/create-project-line-item.command-handler";
import { updateProjectLineItem } from "@/server/workspace/crm/command-handler/update-project-line-item.command-handler";
import { getCustomerHours } from "@/server/workspace/crm/query-handler/get-customer-hours.query-handler";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:project-line-item-kinds:";
const STEPS = ["Design", "Development", "Launch"];

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "project line item kinds PostgreSQL integration",
  () => {
    let db: Database;
    let ownerMemberId: string;
    let ownerUserId: string;
    let standardTemplate: string;
    let hoursTemplate: string;
    let roundTemplate: string;

    function actor(...permissions: Permission[]): WorkspaceActor {
      return {
        userId: ownerUserId,
        workspaceMemberId: ownerMemberId,
        permissions: new Set(permissions),
        customerPermissions: new Map(),
        projectPermissions: new Map(),
      };
    }

    async function createCustomer() {
      const id = randomUUID();
      await db.insert(customers).values({
        id,
        display_name: `${FIXTURE_PREFIX}customer:${id}`,
        status: CustomerStatus.Active,
        owner_member_id: ownerMemberId,
        version: 1,
      });
      return id;
    }

    async function createProject(
      customerId: string,
      overrides: Partial<typeof projects.$inferInsert> = {},
    ) {
      const id = randomUUID();
      await db.insert(projects).values({
        id,
        customer_id: customerId,
        owner_member_id: ownerMemberId,
        title: `${FIXTURE_PREFIX}project`,
        status: ProjectStatus.Active,
        phase: ProjectPhase.Development,
        process_steps: STEPS,
        current_process_step: "Development",
        workflow_key: ProjectWorkflowKey.StandardWebV1,
        billing_model: ProjectBillingModel.FixedPrice,
        included_feedback_rounds: 2,
        feedback_round_positions: [2, 2],
        version: 1,
        ...overrides,
      });
      return id;
    }

    async function createTemplate(kind: LineItemKind) {
      const id = randomUUID();
      await db.insert(lineItemTemplates).values({
        id,
        title: `${FIXTURE_PREFIX}${kind}`,
        description: "Katalogbeschreibung.",
        price_cents: 10000,
        pricing_mode:
          kind === LineItemKind.Hours
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

    function hoursInput(quantityMinutes: number | null) {
      return {
        sourceLineItemTemplateId: hoursTemplate,
        title: "Stundenkontingent",
        description: "",
        priceCents: 10000,
        pricingMode: ServicePricingMode.Rate,
        recurringInterval: null,
        quantityMinutes,
      };
    }

    function roundInput() {
      return {
        sourceLineItemTemplateId: roundTemplate,
        title: "Zusätzliche Feedbackrunde",
        description: "",
        priceCents: 15000,
        pricingMode: ServicePricingMode.OneTime,
        recurringInterval: null,
      };
    }

    async function countRows(customerId: string, projectId: string) {
      const [items, purchases, allocations] = await Promise.all([
        db
          .select({ id: projectLineItems.id })
          .from(projectLineItems)
          .where(eq(projectLineItems.project_id, projectId)),
        db
          .select({ id: customerHourPurchases.id })
          .from(customerHourPurchases)
          .where(eq(customerHourPurchases.customer_id, customerId)),
        db
          .select({ id: projectHourAllocations.id })
          .from(projectHourAllocations)
          .where(eq(projectHourAllocations.customer_id, customerId)),
      ]);
      return {
        items: items.length,
        purchases: purchases.length,
        allocations: allocations.length,
      };
    }

    async function readTrack(projectId: string) {
      const [row] = await db
        .select({
          positions: projects.feedback_round_positions,
          included: projects.included_feedback_rounds,
          currentStep: projects.current_process_step,
        })
        .from(projects)
        .where(eq(projects.id, projectId));
      return row;
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
      if (!databaseUrl) {
        throw new Error(
          "Development database URL is not configured for the line item kinds integration test.",
        );
      }
      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();

      ownerUserId = randomUUID();
      ownerMemberId = randomUUID();
      await db.insert(users).values({
        id: ownerUserId,
        clerk_user_id: `${FIXTURE_PREFIX}${ownerUserId}`,
        primary_email: `${FIXTURE_PREFIX}${ownerUserId}@example.test`,
        display_name: `${FIXTURE_PREFIX}owner`,
        active: true,
        version: 1,
      });
      await db.insert(workspaceMembers).values({
        id: ownerMemberId,
        user_id: ownerUserId,
        active: true,
        version: 1,
      });
      standardTemplate = await createTemplate(LineItemKind.Standard);
      hoursTemplate = await createTemplate(LineItemKind.Hours);
      roundTemplate = await createTemplate(LineItemKind.FeedbackRound);
    }, 60_000);

    afterAll(async () => {
      if (!db) return;
      const pattern = `${FIXTURE_PREFIX}%`;
      const fixtureCustomers = await db
        .select({ id: customers.id })
        .from(customers)
        .where(like(customers.display_name, pattern));
      const customerIds = fixtureCustomers.map((row) => row.id);
      if (customerIds.length > 0) {
        await db
          .delete(activities)
          .where(inArray(activities.customer_id, customerIds));
        // Line items, rounds and both hours ledgers cascade with their project or customer.
        await db
          .delete(projects)
          .where(inArray(projects.customer_id, customerIds));
        await db.delete(customers).where(inArray(customers.id, customerIds));
      }
      await db
        .delete(lineItemTemplates)
        .where(like(lineItemTemplates.title, pattern));
      await db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, ownerMemberId));
      await db.delete(users).where(eq(users.id, ownerUserId));
    }, 60_000);

    it("credits and allocates purchased hours together with the line item", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);
      const owner = actor(
        Permission.ProjectLineItemsWrite,
        Permission.HoursManage,
        Permission.HoursRead,
      );

      const created = await createProjectLineItem(
        projectId,
        hoursInput(300),
        owner,
      );

      expect(created).toMatchObject({
        ok: true,
        projectLineItem: {
          kind: LineItemKind.Hours,
          quantityMinutes: 300,
          status: ProjectLineItemStatus.Confirmed,
        },
      });
      if (!created.ok) return;
      const [purchase] = await db
        .select()
        .from(customerHourPurchases)
        .where(eq(customerHourPurchases.customer_id, customerId));
      expect(purchase).toMatchObject({
        source: HourPurchaseSource.ProjectLineItem,
        minutes: 300,
        idempotency_key: created.projectLineItem.id,
      });
      const [allocation] = await db
        .select()
        .from(projectHourAllocations)
        .where(eq(projectHourAllocations.customer_id, customerId));
      expect(allocation).toMatchObject({ project_id: projectId, minutes: 300 });
      expect(await countRows(customerId, projectId)).toEqual({
        items: 1,
        purchases: 1,
        allocations: 1,
      });

      const hours = await getCustomerHours(customerId, owner);
      expect(hours?.balance).toMatchObject({
        purchasedMinutes: 300,
        allocatedMinutes: 300,
        freeMinutes: 0,
      });
      const logged = await db
        .select({ id: activities.id })
        .from(activities)
        .where(eq(activities.customer_id, customerId));
      expect(logged).toHaveLength(2);
    });

    it("credits one purchase and allocation for concurrent retries of the same request", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);
      const owner = actor(
        Permission.ProjectLineItemsWrite,
        Permission.HoursManage,
      );
      const request = { ...hoursInput(300), idempotencyKey: randomUUID() };
      const results = await Promise.all([
        createProjectLineItem(projectId, request, owner),
        createProjectLineItem(projectId, request, owner),
      ]);
      expect(results.every((result) => result.ok)).toBe(true);
      expect(await countRows(customerId, projectId)).toEqual({
        items: 1,
        purchases: 1,
        allocations: 1,
      });
    });

    it("adds only one round for concurrent retries", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);
      const owner = actor(
        Permission.ProjectLineItemsWrite,
        Permission.ProjectsWrite,
      );
      const request = { ...roundInput(), idempotencyKey: randomUUID() };
      const results = await Promise.all([
        createProjectLineItem(projectId, request, owner),
        createProjectLineItem(projectId, request, owner),
      ]);
      expect(results.every((result) => result.ok)).toBe(true);
      expect((await readTrack(projectId))?.included).toBe(3);
      expect((await countRows(customerId, projectId)).items).toBe(1);
    });
    it("leaves purchased hours free when they are not allocated to the project", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId, {
        status: ProjectStatus.Archived,
      });
      const owner = actor(
        Permission.ProjectLineItemsWrite,
        Permission.HoursManage,
        Permission.HoursRead,
      );

      const created = await createProjectLineItem(
        projectId,
        { ...hoursInput(300), allocateHoursToProject: false },
        owner,
      );

      expect(created).toMatchObject({
        ok: true,
        projectLineItem: { quantityMinutes: 300 },
      });
      // No allocation, so even a closed project can carry the sale.
      expect(await countRows(customerId, projectId)).toEqual({
        items: 1,
        purchases: 1,
        allocations: 0,
      });
      const hours = await getCustomerHours(customerId, owner);
      expect(hours?.balance).toMatchObject({
        purchasedMinutes: 300,
        allocatedMinutes: 0,
        freeMinutes: 300,
      });
    });

    it("writes nothing when the actor may not manage hours", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);

      const result = await createProjectLineItem(
        projectId,
        hoursInput(300),
        actor(Permission.ProjectLineItemsWrite),
      );

      expect(result).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.EffectNotPermitted,
      });
      expect(await countRows(customerId, projectId)).toEqual({
        items: 0,
        purchases: 0,
        allocations: 0,
      });
    });

    it("refuses hours for an archived project", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId, {
        status: ProjectStatus.Archived,
      });

      const result = await createProjectLineItem(
        projectId,
        hoursInput(300),
        actor(Permission.ProjectLineItemsWrite, Permission.HoursManage),
      );

      expect(result).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.ProjectClosed,
      });
      expect(await countRows(customerId, projectId)).toEqual({
        items: 0,
        purchases: 0,
        allocations: 0,
      });
    });

    it("requires a quantity for hours and refuses one for a standard service", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);
      const owner = actor(
        Permission.ProjectLineItemsWrite,
        Permission.HoursManage,
      );

      expect(
        await createProjectLineItem(projectId, hoursInput(null), owner),
      ).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.ValidationError,
      });
      expect(
        await createProjectLineItem(projectId, hoursInput(20), owner),
      ).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.ValidationError,
      });
      expect(
        await createProjectLineItem(
          projectId,
          {
            sourceLineItemTemplateId: standardTemplate,
            title: "Unterseite",
            description: "",
            priceCents: 75000,
            pricingMode: ServicePricingMode.OneTime,
            recurringInterval: null,
            quantityMinutes: 60,
          },
          owner,
        ),
      ).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.ValidationError,
      });
      expect(await countRows(customerId, projectId)).toEqual({
        items: 0,
        purchases: 0,
        allocations: 0,
      });
    });

    it("keeps status and pricing mode of purchased hours fixed", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);
      const owner = actor(
        Permission.ProjectLineItemsWrite,
        Permission.HoursManage,
      );
      const created = await createProjectLineItem(
        projectId,
        hoursInput(60),
        owner,
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      const patch = {
        title: "Stundenkontingent",
        description: "Notiz",
        priceCents: 12000,
        pricingMode: ServicePricingMode.Rate,
        recurringInterval: null,
        version: created.projectLineItem.version,
      };

      expect(
        await updateProjectLineItem(
          created.projectLineItem.id,
          { ...patch, status: ProjectLineItemStatus.Rejected },
          owner,
        ),
      ).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.ValidationError,
      });
      expect(
        await updateProjectLineItem(
          created.projectLineItem.id,
          { ...patch, pricingMode: ServicePricingMode.OneTime },
          owner,
        ),
      ).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.ValidationError,
      });
      expect(
        await updateProjectLineItem(created.projectLineItem.id, patch, owner),
      ).toMatchObject({
        ok: true,
        projectLineItem: {
          priceCents: 12000,
          quantityMinutes: 60,
          status: ProjectLineItemStatus.Confirmed,
        },
      });
    });

    it("adds a round behind the last one while rounds are still ahead", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);

      const created = await createProjectLineItem(
        projectId,
        roundInput(),
        actor(Permission.ProjectLineItemsWrite, Permission.ProjectsWrite),
      );

      expect(created).toMatchObject({
        ok: true,
        projectLineItem: {
          kind: LineItemKind.FeedbackRound,
          status: ProjectLineItemStatus.Confirmed,
          quantityMinutes: null,
        },
      });
      expect(await readTrack(projectId)).toEqual({
        positions: [2, 2, 2],
        included: 3,
        currentStep: "Development",
      });
      const logged = await db
        .select({ metadata: activities.metadata })
        .from(activities)
        .where(eq(activities.project_id, projectId));
      expect(logged).toHaveLength(1);
      expect(logged[0].metadata).toMatchObject({ previous: 2, next: 3 });
    });

    it("adds a round behind the current step once the project moved past the rounds", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId, {
        current_process_step: "Launch",
      });

      const created = await createProjectLineItem(
        projectId,
        roundInput(),
        actor(Permission.ProjectLineItemsWrite, Permission.ProjectsWrite),
      );

      expect(created.ok).toBe(true);
      expect(await readTrack(projectId)).toMatchObject({
        positions: [2, 2, 3],
        included: 3,
      });
    });

    it("refuses a further round for an approved project and at the limit", async () => {
      const customerId = await createCustomer();
      const approvedProject = await createProject(customerId);
      await db.insert(feedbackRounds).values({
        id: randomUUID(),
        project_id: approvedProject,
        customer_id: customerId,
        round_number: 1,
        status: FeedbackRoundStatus.Approved,
        area_options: [],
        handed_over_by_member_id: ownerMemberId,
        handed_over_at: new Date(),
        approved_at: new Date(),
        version: 1,
      });
      const fullProject = await createProject(customerId, {
        included_feedback_rounds: 20,
        feedback_round_positions: Array.from({ length: 20 }, () => 2),
      });
      const owner = actor(
        Permission.ProjectLineItemsWrite,
        Permission.ProjectsWrite,
      );

      for (const projectId of [approvedProject, fullProject]) {
        expect(
          await createProjectLineItem(projectId, roundInput(), owner),
        ).toMatchObject({
          ok: false,
          code: ProjectLineItemErrorCode.FeedbackRoundNotAvailable,
        });
        expect((await countRows(customerId, projectId)).items).toBe(0);
      }
      expect((await readTrack(fullProject))?.positions).toHaveLength(20);
    });

    it("refuses a further round without write access to the project", async () => {
      const customerId = await createCustomer();
      const projectId = await createProject(customerId);

      expect(
        await createProjectLineItem(
          projectId,
          roundInput(),
          actor(Permission.ProjectLineItemsWrite),
        ),
      ).toMatchObject({
        ok: false,
        code: ProjectLineItemErrorCode.EffectNotPermitted,
      });
      expect((await readTrack(projectId))?.positions).toEqual([2, 2]);
    });
  },
);
