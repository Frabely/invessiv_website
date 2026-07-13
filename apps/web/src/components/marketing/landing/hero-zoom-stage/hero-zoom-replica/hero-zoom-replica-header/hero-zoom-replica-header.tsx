import Image from "next/image";

import { SiteHeaderAsset } from "@/common/constants/marketing/site-header-assets";
import type { SiteHeaderContent } from "@/common/contracts/marketing/site-header-content";
import type { SiteHeaderNavigationItem } from "@/common/contracts/marketing/site-header-navigation-item";
import type { Locale } from "@/config/i18n";
import styles from "./hero-zoom-replica-header.module.css";

type HeroZoomReplicaHeaderProps = {
  locale: Locale;
  navigation: readonly SiteHeaderNavigationItem[];
  uiContent: SiteHeaderContent;
};

export function HeroZoomReplicaHeader({
  locale,
  navigation,
  uiContent,
}: HeroZoomReplicaHeaderProps) {
  return (
    <div className={styles.header} data-hero-zoom-replica-header-bar="">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            alt=""
            aria-hidden="true"
            height={26}
            src={SiteHeaderAsset.BrandIcon}
            width={26}
          />
          <span>{uiContent.brandLabel}</span>
        </div>

        <div className={styles.navigation}>
          <ul className={styles.navigationList}>
            {navigation.map((item) => (
              <li key={item.href}>
                <span className={styles.navigationLabel}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actions}>
          <div className={styles.locale}>
            <span aria-hidden="true" className={styles.localeIcon}>
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                <path d="M3 12h18" />
                <path d="M12 3a15.5 15.5 0 0 1 0 18" />
                <path d="M12 3a15.5 15.5 0 0 0 0 18" />
              </svg>
            </span>
            <span>{locale.toUpperCase()}</span>
          </div>
          <span className={styles.cta}>{uiContent.ctaLabel}</span>
        </div>
      </div>
    </div>
  );
}
