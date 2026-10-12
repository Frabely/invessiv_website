import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import { lineItemTemplates } from "@invessiv/db/record-configuration";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/common/constants/testing/portal-e2e-prefix";
/**
 * Catalog entries released for the portal: one per kind and one that starts its own project. The
 * prices are set on purpose, so a test can prove that none of them reaches the portal.
 */
export async function insertServiceCatalogFixture(
  tx: ContactDatabaseTransaction,
  ids: {
    serviceStandard: string;
    serviceHours: string;
    serviceFeedbackRound: string;
    serviceNewProject: string;
  },
) {
  const entries = [
    [ids.serviceStandard, "Unterseite", LineItemKind.Standard],
    [ids.serviceHours, "Stundenpaket", LineItemKind.Hours],
    [ids.serviceFeedbackRound, "Zusatzrunde", LineItemKind.FeedbackRound],
    [ids.serviceNewProject, "Landingpage", LineItemKind.Standard],
  ] as const;
  await tx.insert(lineItemTemplates).values(
    entries.map(([id, title, kind]) => ({
      id,
      title: `${PREFIX} ${title}`,
      description: "E2E internal scope",
      price_cents: 98700,
      pricing_mode:
        kind === LineItemKind.Hours
          ? ServicePricingMode.Rate
          : ServicePricingMode.OneTime,
      recurring_interval: null,
      status: LineItemTemplateStatus.Active,
      kind,
      project_mode:
        id === ids.serviceNewProject
          ? LineItemProjectMode.NewProject
          : LineItemProjectMode.ExistingProject,
      portal_requestable: true,
      portal_description: `${title} für dein Projekt.`,
      version: 1,
    })),
  );
}
