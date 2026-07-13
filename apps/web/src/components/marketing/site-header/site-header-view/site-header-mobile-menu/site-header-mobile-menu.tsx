import type { MouseEvent, ReactNode } from "react";

import type { SiteHeaderNavigationItem } from "@/common/contracts/marketing/site-header-navigation-item";
import { SiteHeaderCta } from "../site-header-cta/site-header-cta";
import styles from "./site-header-mobile-menu.module.css";

type SiteHeaderMobileMenuProps = {
  ctaHref: string;
  ctaLabel: string;
  menuLabel: string;
  navigation: readonly SiteHeaderNavigationItem[];
  onLinkClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  themeSwitchSlot?: ReactNode;
};

export function SiteHeaderMobileMenu({
  ctaHref,
  ctaLabel,
  menuLabel,
  navigation,
  onLinkClick,
  themeSwitchSlot,
}: SiteHeaderMobileMenuProps) {
  return (
    <details className={styles.menu} data-site-header-mobile-menu="">
      <summary aria-label={menuLabel} className={styles.summary}>
        <span className="sr-only">{menuLabel}</span>
        <span aria-hidden="true" className={styles.icon}>
          <span className={styles.iconLine} />
          <span className={styles.iconLine} />
          <span className={styles.iconLine} />
        </span>
      </summary>
      <ul className={styles.list}>
        {themeSwitchSlot ? (
          <li className={styles.item}>{themeSwitchSlot}</li>
        ) : null}
        {navigation.map((item) => (
          <li className={styles.item} key={item.href}>
            <a className={styles.link} href={item.href} onClick={onLinkClick}>
              {item.label}
            </a>
          </li>
        ))}
        <li className={styles.item}>
          <SiteHeaderCta
            href={ctaHref}
            label={ctaLabel}
            onClick={onLinkClick}
            variant="menu"
          />
        </li>
      </ul>
    </details>
  );
}
