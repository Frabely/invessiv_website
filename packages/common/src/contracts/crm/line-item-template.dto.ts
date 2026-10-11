import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";

/** A row of the maintainable, versioned global service catalog — never a project assignment. */
export interface LineItemTemplateDto {
  /** Id of the catalog entry. A project line item only keeps this as an optional origin reference. */
  id: string;
  /** Short catalog name shown in the picker when assigning a project line item. */
  title: string;
  /** Longer explanation of the service scope; empty string, never null, when nothing was filled in. */
  description: string;
  /** Net price in EUR cents — the catalog has no other currency. */
  priceCents: number;
  /** How the price applies: a one-off amount, a recurring charge, or an hourly rate. */
  pricingMode: ServicePricingMode;
  /** Billing cadence; set only when `pricingMode` is `recurring`, otherwise always null. */
  recurringInterval: BillingInterval | null;
  /** What assigning this entry does beyond creating the line item; `hours` and `feedback_round` fix pricing mode and project mode. */
  kind: LineItemKind;
  /** Whether the service extends an existing project or starts its own; preselects the target when a request is accepted. */
  projectMode: LineItemProjectMode;
  /** Released for portal requests. An archived entry is never offered, whatever this says. */
  portalRequestable: boolean;
  /** The only description customers ever see, never the internal one; required once `portalRequestable` is set, otherwise an empty string is valid. */
  portalDescription: string;
  /** Archived entries stay visible as provenance but drop out of pickers for new assignments. */
  status: LineItemTemplateStatus;
  /** Optimistic-concurrency counter; every update request must echo the value it read. */
  version: number;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}
