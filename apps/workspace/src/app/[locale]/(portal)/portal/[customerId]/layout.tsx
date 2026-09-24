import type { ReactNode } from "react";
import { listPermittedPortalNavItems } from "@/common/patterns/portal/list-permitted-portal-nav-items";
import { CustomerSwitcher } from "@/components/portal/customer-switcher/customer-switcher";
import { PortalShell } from "@/components/portal/portal-shell/portal-shell";
import type { Locale } from "@/config/i18n";
import { getPortalShellDictionary } from "@/i18n/dictionaries/portal";
import { portalPathFor } from "@/lib/auth/routes";
import { requirePortalActor } from "@/server/portal/auth/require-portal-actor";
import { listPortalMembershipsForUserId } from "@/server/portal/query-handler/list-portal-memberships-for-user-id.query-handler";

type PortalCustomerLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string; customerId: string }>;
};

/**
 * The one place a `PortalActor` is resolved for a page render. Filters `PORTAL_NAV_ITEMS` through
 * `listPermittedPortalNavItems` — empty today, so `nav` renders `null`, but the first portal
 * module only has to append its entry, not touch this file.
 */
export default async function PortalCustomerLayout({
  children,
  params,
}: PortalCustomerLayoutProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  // Postgres compares uuids case-insensitively, so an uppercase URL still authorizes; normalizing
  // first keeps `actor.customerId` matching the lowercase form every other portal path renders.
  const actor = await requirePortalActor(
    activeLocale,
    customerId.toLowerCase(),
  );
  const companies = await listPortalMembershipsForUserId(actor.userId);
  const content = getPortalShellDictionary(activeLocale);
  const visibleNavItems = listPermittedPortalNavItems(actor.permissions);

  return (
    <PortalShell
      content={content}
      locale={activeLocale}
      nav={
        visibleNavItems.length > 0 ? (
          <>
            {visibleNavItems.map((item) => (
              <a
                href={portalPathFor(
                  activeLocale,
                  actor.customerId,
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
      switcher={
        <CustomerSwitcher
          activeCustomerId={actor.customerId}
          companies={companies}
          content={content.switcher}
          locale={activeLocale}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
