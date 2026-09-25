import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import type { Locale } from "@/config/i18n";
import type { PortalShellDictionary } from "@/i18n/dictionaries/portal";
import { portalPathFor } from "@/lib/auth/routes";
import styles from "./customer-switcher.module.css";

type CustomerSwitcherProps = {
  activeCustomerId: string;
  companies: readonly PortalMembershipOptionDto[];
  content: PortalShellDictionary["switcher"];
  locale: Locale;
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
}: CustomerSwitcherProps) {
  const activeCompany = companies.find(
    (company) => company.customerId === activeCustomerId,
  );
  const activeName = activeCompany?.displayName ?? "";

  if (companies.length <= 1) {
    return <span className={styles.current}>{activeName}</span>;
  }

  return (
    <details className={styles.root}>
      <summary className={styles.summary}>
        {/* The visible company name stays the accessible name (WCAG 2.5.3); this only adds
            context for assistive tech, it never replaces it. */}
        <span className="sr-only">{content.menuLabel}: </span>
        <span className={styles.current}>{activeName}</span>
      </summary>
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
                <a
                  className={styles.optionLink}
                  href={portalPathFor(locale, company.customerId)}
                >
                  {company.displayName}
                </a>
              )}
            </span>
          );
        })}
      </div>
    </details>
  );
}
