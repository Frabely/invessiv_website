import type { ReactNode } from "react";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { listPermittedPortalNavItems } from "@/common/patterns/portal/list-permitted-portal-nav-items";
import { CustomerSwitcher } from "@/components/portal/customer-switcher/customer-switcher";
import { PortalOwnerBanner } from "@/components/portal/portal-owner-banner/portal-owner-banner";
import { PortalShell } from "@/components/portal/portal-shell/portal-shell";
import type { Locale } from "@/config/i18n";
import { getPortalShellDictionary } from "@/i18n/dictionaries/portal";
import { portalPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { formatMessage } from "@/lib/i18n/format-message";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalCustomerDisplayName } from "@/server/portal/query-handler/get-portal-customer-display-name.query-handler";
import { getPortalGreetingName } from "@/server/portal/query-handler/get-portal-greeting-name.query-handler";
import { listPortalMembershipsForUserId } from "@/server/portal/query-handler/list-portal-memberships-for-user-id.query-handler";

type PortalCustomerLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string; customerId: string }>;
};

/**
 * Resolves the portal reader for this render. Filters `PORTAL_NAV_ITEMS` through
 * `listPermittedPortalNavItems`, so a portal module only has to append its entry. The owner's
 * read-only view has no memberships to switch between: it shows only the name, plus a banner.
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
  const visibleNavItems = listPermittedPortalNavItems(reader.permissions);
  const isOwnerView = isPortalOwnerView(reader);
  const greetingName = await getPortalGreetingName(reader);
  const ownerCompanyName = isOwnerView
    ? ((await getPortalCustomerDisplayName(reader)) ?? "")
    : null;

  return (
    <PortalShell
      content={content}
      greeting={
        greetingName
          ? formatMessage(content.header.greeting, { name: greetingName })
          : null
      }
      locale={activeLocale}
      nav={
        visibleNavItems.length > 0 ? (
          <>
            {visibleNavItems.map((item) => (
              <a
                href={portalPathFor(
                  activeLocale,
                  reader.customerId,
                  item.section,
                )}
                key={item.section}
              >
                {content.nav.items[item.labelKey]}
              </a>
            ))}
          </>
        ) : null
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
          companies={
            ownerCompanyName === null
              ? await listPortalMembershipsForUserId(reader.userId)
              : // The owner has no memberships to switch between; only the name is shown.
                [
                  {
                    customerId: reader.customerId,
                    displayName: ownerCompanyName,
                  },
                ]
          }
          content={content.switcher}
          locale={activeLocale}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
