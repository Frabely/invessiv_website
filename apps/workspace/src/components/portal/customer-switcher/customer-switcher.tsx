"use client";

import { useRef } from "react";
import {
  QuaternaryCta,
  SecondaryCtaLink,
  useDismissibleDetails,
} from "@invessiv/ui";
import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import type { Locale } from "@/config/i18n";
import type { PortalCompanySwitcherDictionary } from "@/common/contracts/portal/portal-company-switcher-dictionary";
import { portalPathFor } from "@/lib/auth/routes";
import styles from "./customer-switcher.module.css";

type CustomerSwitcherProps = {
  activeCustomerId: string;
  companies: readonly PortalMembershipOptionDto[];
  content: PortalCompanySwitcherDictionary;
  locale: Locale;
  homeHref?: string;
};

/**
 * A company switch is a plain link, never client state: two tabs on two different companies keep
 * working independently, and there is nothing to resynchronise between them.
 */
export function CustomerSwitcher({
  activeCustomerId,
  companies,
  content,
  locale,
  homeHref,
}: CustomerSwitcherProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useDismissibleDetails(detailsRef);
  const activeCompany = companies.find(
    (company) => company.customerId === activeCustomerId,
  );
  const activeName = activeCompany?.displayName ?? "";
  const overviewHref = homeHref ?? portalPathFor(locale, activeCustomerId);

  if (companies.length <= 1) {
    return (
      <a className={styles.current} href={overviewHref}>
        {activeName}
      </a>
    );
  }

  return (
    <div className={styles.root}>
      <a className={styles.current} href={overviewHref}>
        {activeName}
      </a>
      <details ref={detailsRef}>
        <QuaternaryCta as="summary" className={styles.summary}>
          <span className="sr-only">{content.menuLabel}: </span>
          <span aria-hidden="true">▾</span>
        </QuaternaryCta>
        <div
          aria-label={content.groupLabel}
          className={styles.popover}
          role="group"
        >
          {companies.map((company) => {
            const isActive = company.customerId === activeCustomerId;
            return (
              <span className={styles.option} key={company.customerId}>
                {isActive ? (
                  <span className={styles.optionActive}>
                    {company.displayName}
                    <span className={styles.currentBadge}>
                      {content.currentBadge}
                    </span>
                  </span>
                ) : (
                  <SecondaryCtaLink
                    className={styles.optionLink}
                    href={portalPathFor(locale, company.customerId)}
                  >
                    {company.displayName}
                  </SecondaryCtaLink>
                )}
              </span>
            );
          })}
        </div>
      </details>
    </div>
  );
}
