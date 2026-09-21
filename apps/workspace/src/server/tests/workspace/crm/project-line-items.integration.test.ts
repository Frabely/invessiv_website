import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customers,
  projectLineItems,
  projects,
  lineItemTemplates,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { createProjectLineItem } from "@/server/workspace/crm/command-handler/create-project-line-item.command-handler";
import { updateProjectLineItem } from "@/server/workspace/crm/command-handler/update-project-line-item.command-handler";
import { listProjectLineItems } from "@/server/workspace/crm/query-handler/list-project-line-items.query-handler";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:project-line-items:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "project line items PostgreSQL integration",
  () => {
    let db: Database;
    let ownerMemberId: string;
    let ownerUserId: string;
    let customerAlpha: string;
    let customerBeta: string;
    let projectAlphaSite: string;
    let projectAlphaShop: string;
    let projectBetaSite: string;
    let activeTemplate: string;
    let archivedTemplate: string;

    function actor(overrides: Partial<WorkspaceActor> = {}): WorkspaceActor {
      return {
        userId: ownerUserId,
        workspaceMemberId: ownerMemberId,
        permissions: new Set(),
        customerPermissions: new Map(),
        projectPermissions: new Map(),
        ...overrides,
      };
    }

    function customerBoundActor(
      customerId: string,
      ...permissions: Permission[]
    ): WorkspaceActor {
      return actor({
        customerPermissions: new Map([[customerId, new Set(permissions)]]),
      });
    }

    function projectBoundActor(
      projectId: string,
      customerId: string,
      ...permissions: Permission[]
    ): WorkspaceActor {
      return actor({
        projectPermissions: new Map([
          [projectId, { customerId, permissions: new Set(permissions) }],
        ]),
      });
    }

    function assignmentInput(overrides: Record<string, unknown> = {}) {
      return {
        sourceLineItemTemplateId: activeTemplate,
        title: "Landingpage",
        description: "Einseitige Website.",
        priceCents: 200000,
        pricingMode: ServicePricingMode.OneTime,
        recurringInterval: null,
        ...overrides,
      };
    }

    async function createCustomer(label: string) {
      const id = randomUUID();
      await db.insert(customers).values({
        id,
        display_name: `${FIXTURE_PREFIX}customer:${label}`,
        status: CustomerStatus.Active,
        owner_member_id: ownerMemberId,
        version: 1,
      });
      return id;
    }

    async function createProject(customerId: string, title: string) {
      const id = randomUUID();
      await db.insert(projects).values({
        id,
        customer_id: customerId,
        owner_member_id: ownerMemberId,
        title: `${FIXTURE_PREFIX}${title}`,
        status: ProjectStatus.Active,
        phase: ProjectPhase.Onboarding,
        process_steps: [ProjectPhase.Onboarding],
        current_process_step: ProjectPhase.Onboarding,
        workflow_key: ProjectWorkflowKey.StandardWebV1,
        billing_model: ProjectBillingModel.FixedPrice,
        included_feedback_rounds: 2,
        version: 1,
      });
      return id;
    }

    async function createTemplate(
      title: string,
      status: (typeof LineItemTemplateStatus)[keyof typeof LineItemTemplateStatus],
    ) {
      const id = randomUUID();
      await db.insert(lineItemTemplates).values({
        id,
        title: `${FIXTURE_PREFIX}${title}`,
        description: "Katalogbeschreibung.",
        price_cents: 200000,
        pricing_mode: ServicePricingMode.OneTime,
        recurring_interval: null,
        status,
        version: 1,
      });
      return id;
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
          "Development database URL is not configured for the project line items integration test.",
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

      customerAlpha = await createCustomer("alpha");
      customerBeta = await createCustomer("beta");
      projectAlphaSite = await createProject(customerAlpha, "alpha site");
      projectAlphaShop = await createProject(customerAlpha, "alpha shop");
      projectBetaSite = await createProject(customerBeta, "beta site");
      activeTemplate = await createTemplate(
        "active",
        LineItemTemplateStatus.Active,
      );
      archivedTemplate = await createTemplate(
        "archived",
        LineItemTemplateStatus.Archived,
      );
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
        // `project_line_items` cascades with its project, so deleting projects is enough.
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

    it("keeps the stored snapshot when its origin template changes afterwards", async () => {
      const created = await createProjectLineItem(
        projectAlphaSite,
        assignmentInput({
          priceCents: 180000,
          title: "Landingpage Paketpreis",
        }),
        actor({ permissions: new Set([Permission.ProjectLineItemsWrite]) }),
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      await db
        .update(lineItemTemplates)
        .set({
          title: `${FIXTURE_PREFIX}active renamed`,
          price_cents: 999000,
          pricing_mode: ServicePricingMode.Recurring,
          recurring_interval: BillingInterval.Monthly,
          version: 2,
        })
        .where(eq(lineItemTemplates.id, activeTemplate));

      const [stored] = await db
        .select()
        .from(projectLineItems)
        .where(eq(projectLineItems.id, created.projectLineItem.id));

      expect(stored).toMatchObject({
        title: "Landingpage Paketpreis",
        price_cents: 180000,
        pricing_mode: ServicePricingMode.OneTime,
        recurring_interval: null,
        source_line_item_template_id: activeTemplate,
        version: 1,
      });
    });

    it("refuses an archived template as a source for a new assignment", async () => {
      const result = await createProjectLineItem(
        projectAlphaSite,
        assignmentInput({ sourceLineItemTemplateId: archivedTemplate }),
        actor({ permissions: new Set([Permission.ProjectLineItemsWrite]) }),
      );

      expect(result).toEqual({
        ok: false,
        code: ProjectLineItemErrorCode.LineItemTemplateNotAssignable,
      });
    });

    it("lets a customer binding reach every project of that customer", async () => {
      const writer = customerBoundActor(
        customerAlpha,
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
      );

      const onShop = await createProjectLineItem(
        projectAlphaShop,
        assignmentInput({ title: "Shop-Leistung" }),
        writer,
      );

      expect(onShop.ok).toBe(true);
      await expect(
        listProjectLineItems(projectAlphaShop, writer),
      ).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: "Shop-Leistung" }),
        ]),
      );
      await expect(
        listProjectLineItems(projectAlphaSite, writer),
      ).resolves.not.toBeNull();
    });

    it("does not let a customer binding reach another customer", async () => {
      const writer = customerBoundActor(
        customerAlpha,
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
      );

      const result = await createProjectLineItem(
        projectBetaSite,
        assignmentInput(),
        writer,
      );

      expect(result).toEqual({
        ok: false,
        code: ProjectLineItemErrorCode.ProjectNotFound,
      });
      await expect(
        listProjectLineItems(projectBetaSite, writer),
      ).resolves.toBeNull();
    });

    it("does not let a project binding reach a sibling project of the same customer", async () => {
      const writer = projectBoundActor(
        projectAlphaSite,
        customerAlpha,
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
      );

      const result = await createProjectLineItem(
        projectAlphaShop,
        assignmentInput(),
        writer,
      );

      expect(result).toEqual({
        ok: false,
        code: ProjectLineItemErrorCode.ProjectNotFound,
      });
      await expect(
        listProjectLineItems(projectAlphaShop, writer),
      ).resolves.toBeNull();
      await expect(
        listProjectLineItems(projectAlphaSite, writer),
      ).resolves.not.toBeNull();
    });

    it("answers not-found when editing a service of a project outside the binding", async () => {
      const owner = actor({
        permissions: new Set([Permission.ProjectLineItemsWrite]),
      });
      const created = await createProjectLineItem(
        projectBetaSite,
        assignmentInput({ title: "Beta-Leistung" }),
        owner,
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const foreign = customerBoundActor(
        customerAlpha,
        Permission.ProjectLineItemsWrite,
      );
      const result = await updateProjectLineItem(
        created.projectLineItem.id,
        {
          title: "Übernommen",
          description: "",
          priceCents: 1,
          pricingMode: ServicePricingMode.OneTime,
          recurringInterval: null,
          version: created.projectLineItem.version,
        },
        foreign,
      );

      expect(result).toEqual({
        ok: false,
        code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
      });
    });

    it("increments the version on a successful edit and rejects a stale one", async () => {
      const owner = actor({
        permissions: new Set([Permission.ProjectLineItemsWrite]),
      });
      const created = await createProjectLineItem(
        projectAlphaSite,
        assignmentInput({ title: "Versionierte Leistung" }),
        owner,
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const patch = {
        title: "Versionierte Leistung v2",
        description: "",
        priceCents: 150000,
        pricingMode: ServicePricingMode.OneTime,
        recurringInterval: null,
        version: created.projectLineItem.version,
      };
      const first = await updateProjectLineItem(
        created.projectLineItem.id,
        patch,
        owner,
      );
      expect(first.ok && first.projectLineItem.version).toBe(2);

      const stale = await updateProjectLineItem(
        created.projectLineItem.id,
        patch,
        owner,
      );
      expect(stale.ok).toBe(false);
      expect(stale).toMatchObject({ conflict: { currentVersion: 2 } });
    });
  },
);
