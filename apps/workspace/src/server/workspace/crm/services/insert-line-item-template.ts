import "server-only";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { CreateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/create-line-item-template-request.dto";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { lineItemTemplates } from "@invessiv/db/record-configuration";
export async function insertLineItemTemplate(
  executor: Pick<ContactDatabaseTransaction, "insert">,
  data: CreateLineItemTemplateRequestDto,
) {
  const [row] = await executor
    .insert(lineItemTemplates)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      price_cents: data.priceCents,
      pricing_mode: data.pricingMode,
      recurring_interval: data.recurringInterval,
      kind: data.kind,
      project_mode: data.projectMode,
      portal_requestable: data.portalRequestable,
      portal_description: data.portalDescription,
      status: LineItemTemplateStatus.Active,
      version: 1,
    })
    .returning();

  return row;
}
