import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import type { Locale } from "@/config/i18n";
import type { PortalPickerDictionary } from "@/i18n/dictionaries/portal";
import { portalPathFor } from "@/lib/auth/routes";
import styles from "./portal-company-picker.module.css";

type PortalCompanyPickerProps = {
  companies: readonly PortalMembershipOptionDto[];
  content: PortalPickerDictionary;
  locale: Locale;
};

/**
 * Shown only when more than one active membership exists — the caller resolves the single-company
 * case straight to that company, so there is never a silent default to pick from here.
 */
export function PortalCompanyPicker({
  companies,
  content,
  locale,
}: PortalCompanyPickerProps) {
  return (
    <div className={styles.shell}>
      <h1 className={styles.title}>{content.title}</h1>
      <p className={styles.description}>{content.description}</p>
      <ul aria-label={content.listAriaLabel} className={styles.list}>
        {companies.map((company) => (
          <li key={company.customerId}>
            <a
              className={styles.option}
              href={portalPathFor(locale, company.customerId)}
            >
              {company.displayName}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
