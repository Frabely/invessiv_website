import { randomUUID } from "node:crypto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  serviceRequests,
  lineItemTemplates,
  projectLineItems,
} from "@invessiv/db/record-configuration";
import { inArray } from "drizzle-orm";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
export async function seedServiceRequests(
  tx: ContactDatabaseTransaction,
  input: {
    customerId: string;
    projectId: string;
    membershipId: string;
    memberId: string;
    templateIds: string[];
  },
) {
  const templates = await tx
    .select()
    .from(lineItemTemplates)
    .where(inArray(lineItemTemplates.id, input.templateIds));
  const standard = templates.find((t) => t.kind === LineItemKind.Standard);
  const hours = templates.find((t) => t.kind === LineItemKind.Hours);
  const round = templates.find((t) => t.kind === LineItemKind.FeedbackRound);
  if (!standard || !hours || !round)
    throw new Error("Service request fixtures require all three catalog kinds");
  const itemId = randomUUID();
  await tx.insert(projectLineItems).values({
    id: itemId,
    project_id: input.projectId,
    source_line_item_template_id: standard.id,
    kind: LineItemKind.Standard,
    title: standard.title,
    description: standard.description,
    price_cents: standard.price_cents,
    pricing_mode: standard.pricing_mode,
    recurring_interval: standard.recurring_interval,
    status: ProjectLineItemStatus.Confirmed,
    quantity_minutes: null,
    version: 1,
  });
  const now = new Date();
  const examples = [
    {
      status: S.Requested,
      template: hours,
      title: hours.title,
      note: "Wir brauchen etwa fünf Stunden für die nächsten Änderungen.",
    },
    {
      status: S.Offered,
      template: round,
      title: round.title,
      note: "Können wir noch eine weitere Feedbackrunde einplanen?",
    },
    {
      status: S.Accepted,
      template: standard,
      title: standard.title,
      note: "Bitte den Workshop für unser Team einplanen.",
    },
    {
      status: S.Declined,
      template: null,
      title: "Zweite Website",
      note: "Wir möchten eine zweite Website prüfen.",
    },
    {
      status: S.Withdrawn,
      template: null,
      title: "Newsletter-Vorlage",
      note: "Das Thema stellen wir vorerst zurück.",
    },
  ];
  await tx.insert(serviceRequests).values(
    examples.map((example) => ({
      id: randomUUID(),
      customer_id: input.customerId,
      line_item_template_id: example.template?.id ?? null,
      kind: example.template?.kind ?? LineItemKind.Standard,
      title: example.title,
      note: example.note,
      requested_minutes:
        example.template?.kind === LineItemKind.Hours ? 300 : null,
      project_wish: example.template ? Wish.Existing : Wish.Undecided,
      requested_project_id: example.template ? input.projectId : null,
      requested_by_membership_id: input.membershipId,
      status: example.status,
      decline_reason:
        example.status === S.Declined
          ? "Wir bieten dieses Vorhaben derzeit nicht an."
          : null,
      offered_at: example.status === S.Offered ? now : null,
      offered_price_cents:
        example.status === S.Offered
          ? (example.template?.price_cents ?? null)
          : null,
      offered_minutes: null,
      decided_at: [S.Accepted, S.Declined, S.Withdrawn].some(
        (status) => status === example.status,
      )
        ? now
        : null,
      decided_by_member_id: [S.Accepted, S.Declined].some(
        (status) => status === example.status,
      )
        ? input.memberId
        : null,
      project_id: example.status === S.Accepted ? input.projectId : null,
      project_line_item_id: example.status === S.Accepted ? itemId : null,
      idempotency_key: randomUUID(),
      version: 1,
    })),
  );
}
