import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";

export interface UpdateLineItemTemplateRequestDto {
  /** Short catalog name shown in the picker when assigning a project line item. */
  title: string;
  /** Longer explanation of the service scope; an empty string is valid. */
  description: string;
  /** Net price in EUR cents. */
  priceCents: number;
  /** How the price applies: a one-off amount, a recurring charge, or an hourly rate. */
  pricingMode: ServicePricingMode;
  /** Required exactly when `pricingMode` is `recurring`; must stay null otherwise. */
  recurringInterval: BillingInterval | null;
  /** What assigning this entry does beyond creating the line item; `hours` and `feedback_round` fix pricing mode and project mode. */
  kind: LineItemKind;
  /** Whether the service extends an existing project or starts its own; preselects the target when a request is accepted. */
  projectMode: LineItemProjectMode;
  /** Released for portal requests. An archived entry is never offered, whatever this says. */
  portalRequestable: boolean;
  /** The only description customers ever see, never the internal one; required once `portalRequestable` is set, otherwise an empty string is valid. */
  portalDescription: string;
  /** Archiving hides the template from new-assignment pickers without deleting it. */
  status: LineItemTemplateStatus;
  /** Value the client last read; a stale value answers with a 409 version conflict. */
  version: number;
}
