/**
 * Line item kind part of `db:smoke:crm` (Task 74): what Postgres itself must enforce for the kind,
 * project mode and portal release of a catalog entry and for the kind and quantity of a project
 * line item. Rules that need the project or the hours stock belong to the write path and are
 * covered by its integration tests. Templates carry the smoke name and are removed with the other
 * fixture rows; line items disappear with their smoke customer.
 */
import { randomUUID } from "node:crypto";

import { CustomerHourPurchasesConstraintName as P } from "@invessiv/db/constraint-names/crm/customer-hour-purchases-constraint-names";
import { LineItemTemplatesConstraintName as T } from "@invessiv/db/constraint-names/crm/line-item-templates-constraint-names";
import { ProjectLineItemsConstraintName as I } from "@invessiv/db/constraint-names/crm/project-line-items-constraint-names";
import type { CrmSmokeContext as SmokeContext } from "./contracts/crm-smoke-context";

type TemplateArgs = {
  kind?: string | null;
  projectMode?: string | null;
  pricingMode?: string;
  portalRequestable?: boolean | null;
  portalDescription?: string | null;
};

type ItemArgs = {
  kind?: string | null;
  pricingMode?: string;
  quantityMinutes?: number | null;
};

export async function runLineItemChecks(context: SmokeContext) {
  const { sql, memberId, name, expectRejected, expectAccepted } = context;
  const customerId = await context.insertCustomer(name("Line item customer"));
  const projectId = randomUUID();
  await sql`
    INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
                          current_process_step, workflow_key, billing_model, included_feedback_rounds, version)
    VALUES (${projectId}, ${customerId}, ${memberId}, ${name("Line item project")}, 'active', 'onboarding',
            ARRAY ['onboarding'], 'onboarding', 'standard_web_v1', 'fixed_price', 2, 1)
  `;

  const insertTemplate = (args: TemplateArgs) => sql`
    INSERT INTO line_item_templates (id, title, description, price_cents, pricing_mode, recurring_interval,
                                     status, version, kind, project_mode, portal_requestable, portal_description)
    VALUES (${randomUUID()}, ${name("Kind template")}, '', 10000, ${args.pricingMode ?? "one_time"}, NULL,
            'active', 1, ${args.kind === undefined ? "standard" : args.kind},
            ${args.projectMode === undefined ? "existing_project" : args.projectMode},
            ${args.portalRequestable === undefined ? false : args.portalRequestable},
            ${args.portalDescription === undefined ? "" : args.portalDescription})
  `;
  const insertItem = (args: ItemArgs) => sql`
    INSERT INTO project_line_items (id, project_id, source_line_item_template_id, title, description,
                                    price_cents, pricing_mode, recurring_interval, status, version, kind,
                                    quantity_minutes)
    VALUES (${randomUUID()}, ${projectId}, NULL, ${name("Kind item")}, '', 10000,
            ${args.pricingMode ?? "one_time"}, NULL, 'confirmed', 1,
            ${args.kind === undefined ? "standard" : args.kind},
            ${args.quantityMinutes === undefined ? null : args.quantityMinutes})
  `;
  const insertPurchase = (source: string) => sql`
    INSERT INTO customer_hour_purchases (id, customer_id, kind, source, minutes, purchased_on, note,
                                         idempotency_key, created_by_member_id)
    VALUES (${randomUUID()}, ${customerId}, 'purchase', ${source}, 60, CURRENT_DATE, '', ${randomUUID()},
            ${memberId})
  `;

  await expectAccepted("standard template is accepted", () =>
    insertTemplate({}),
  );
  await expectAccepted(
    "template written without the new columns is accepted",
    () =>
      insertTemplate({
        kind: null,
        projectMode: null,
        portalRequestable: null,
        portalDescription: null,
      }),
  );
  await expectAccepted("hours template at a rate is accepted", () =>
    insertTemplate({ kind: "hours", pricingMode: "rate" }),
  );
  await expectAccepted(
    "released template with a customer text is accepted",
    () =>
      insertTemplate({
        portalRequestable: true,
        portalDescription: "Customer text",
      }),
  );
  await expectAccepted("standard template for a new project is accepted", () =>
    insertTemplate({ projectMode: "new_project" }),
  );
  await expectRejected(
    "unknown template kind is rejected",
    () => insertTemplate({ kind: "bundle" }),
    T.KindCheck,
  );
  await expectRejected(
    "unknown project mode is rejected",
    () => insertTemplate({ projectMode: "any_project" }),
    T.ProjectModeCheck,
  );
  await expectRejected(
    "hours template without a rate is rejected",
    () => insertTemplate({ kind: "hours", pricingMode: "one_time" }),
    T.KindPricingModeCheck,
  );
  await expectRejected(
    "feedback round template at a rate is rejected",
    () => insertTemplate({ kind: "feedback_round", pricingMode: "rate" }),
    T.KindPricingModeCheck,
  );
  await expectRejected(
    "hours template for a new project is rejected",
    () =>
      insertTemplate({
        kind: "hours",
        pricingMode: "rate",
        projectMode: "new_project",
      }),
    T.KindProjectModeCheck,
  );
  await expectRejected(
    "feedback round template for a new project is rejected",
    () =>
      insertTemplate({ kind: "feedback_round", projectMode: "new_project" }),
    T.KindProjectModeCheck,
  );
  await expectRejected(
    "released template without a customer text is rejected",
    () => insertTemplate({ portalRequestable: true, portalDescription: "  " }),
    T.PortalDescriptionCheck,
  );
  await expectRejected(
    "released template with a missing customer text is rejected",
    () => insertTemplate({ portalRequestable: true, portalDescription: null }),
    T.PortalDescriptionCheck,
  );

  await expectAccepted(
    "standard line item without a quantity is accepted",
    () => insertItem({}),
  );
  await expectAccepted("line item written without a kind is accepted", () =>
    insertItem({ kind: null }),
  );
  await expectAccepted("hours line item with a quantity is accepted", () =>
    insertItem({ kind: "hours", pricingMode: "rate", quantityMinutes: 300 }),
  );
  await expectRejected(
    "unknown line item kind is rejected",
    () => insertItem({ kind: "bundle" }),
    I.KindCheck,
  );
  await expectRejected(
    "quantity on a standard line item is rejected",
    () => insertItem({ quantityMinutes: 60 }),
    I.KindQuantityCheck,
  );
  await expectRejected(
    "quantity on a line item without a kind is rejected",
    () => insertItem({ kind: null, quantityMinutes: 60 }),
    I.KindQuantityCheck,
  );
  await expectRejected(
    "hours line item without a quantity is rejected",
    () => insertItem({ kind: "hours", pricingMode: "rate" }),
    I.KindQuantityCheck,
  );
  await expectRejected(
    "quantity off the booking step is rejected",
    () =>
      insertItem({ kind: "hours", pricingMode: "rate", quantityMinutes: 20 }),
    I.QuantityMinutesCheck,
  );
  await expectRejected(
    "quantity of zero is rejected",
    () =>
      insertItem({ kind: "hours", pricingMode: "rate", quantityMinutes: 0 }),
    I.QuantityMinutesCheck,
  );

  await expectAccepted("purchase credited with a line item is accepted", () =>
    insertPurchase("project_line_item"),
  );
  await expectRejected(
    "unknown purchase source is rejected",
    () => insertPurchase("foo"),
    P.SourceCheck,
  );
}
