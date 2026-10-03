import type { ReactNode } from "react";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { CustomerSwitcher } from "@/components/portal/customer-switcher/customer-switcher";
import { PortalOwnerBanner } from "@/components/portal/portal-owner-banner/portal-owner-banner";
import { PortalShell } from "@/components/portal/portal-shell/portal-shell";
import { ProjectSwitcher } from "@/components/portal/project-switcher/project-switcher";
import type { Locale } from "@/config/i18n";
import { getPortalShellDictionary } from "@/i18n/dictionaries/portal";
import { portalPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalCustomerDisplayName } from "@/server/portal/query-handler/get-portal-customer-display-name.query-handler";
import { listPortalMembershipsForUserId } from "@/server/portal/query-handler/list-portal-memberships-for-user-id.query-handler";
import { listPortalCurrentProjects } from "@/server/portal/query-handler/list-portal-current-projects.query-handler";

type PortalCustomerLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string; customerId: string }>;
};

/**
 * Resolves the portal reader for this render. The owner's read-only view has no memberships to
 * switch between: it shows only the company name, plus a banner.
 */
export default async function PortalCustomerLayout({
  children,
  params,
}: PortalCustomerLayoutProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  // Postgres compares uuids case-insensitively, so an uppercase URL still authorizes; normalizing
  // first keeps `reader.customerId` matching the lowercase form every other portal path renders.
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  const content = getPortalShellDictionary(activeLocale);
  const isOwnerView = isPortalOwnerView(reader);
  const greetingName = isOwnerView ? null : reader.firstName;
  const ownerCompanyName = isOwnerView
    ? ((await getPortalCustomerDisplayName(reader)) ?? "")
    : null;
  const memberships =
    ownerCompanyName === null
      ? await listPortalMembershipsForUserId(reader.userId)
      : [{ customerId: reader.customerId, displayName: ownerCompanyName }];
  const currentProjects = await listPortalCurrentProjects(reader);

  return (
    <PortalShell
      content={content}
      homeHref={portalPathFor(activeLocale, reader.customerId)}
      greeting={
        greetingName
          ? formatMessage(content.header.greeting, { name: greetingName })
          : null
      }
      projectSwitcher={
        <ProjectSwitcher
          dashboardHref={portalPathFor(activeLocale, reader.customerId)}
          label={content.projectSwitcher.label}
          projects={currentProjects}
        />
      }
      notice={
        isOwnerView ? (
          <PortalOwnerBanner
            cockpitHref={buildCustomerCockpitHref(
              workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm),
              reader.customerId,
            )}
            companyName={ownerCompanyName ?? ""}
            content={content.ownerView}
          />
        ) : null
      }
      switcher={
        <CustomerSwitcher
          activeCustomerId={reader.customerId}
          companies={memberships}
          content={content.switcher}
          locale={activeLocale}
          homeHref={portalPathFor(activeLocale, reader.customerId)}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
