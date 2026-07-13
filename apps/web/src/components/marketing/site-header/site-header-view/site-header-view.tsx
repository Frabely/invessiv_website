import type { MouseEvent, ReactNode } from "react";

import type { SiteHeaderContent } from "@/common/contracts/marketing/site-header-content";
import type { SiteHeaderNavigationItem } from "@/common/contracts/marketing/site-header-navigation-item";
import { SiteHeaderBrand } from "./site-header-brand/site-header-brand";
import { SiteHeaderCta } from "./site-header-cta/site-header-cta";
import { SiteHeaderMobileMenu } from "./site-header-mobile-menu/site-header-mobile-menu";
import { SiteHeaderNavigation } from "./site-header-navigation/site-header-navigation";
import styles from "./site-header-view.module.css";

type SiteHeaderViewProps = {
  brandHref: string;
  content: SiteHeaderContent;
  ctaHref: string;
  desktopLocaleSwitchSlot: ReactNode;
  desktopThemeSwitchSlot?: ReactNode;
  isMinimalHeader?: boolean;
  isScrolled?: boolean;
  mobileLocaleSwitchSlot: ReactNode;
  mobileNavigation: readonly SiteHeaderNavigationItem[];
  mobileThemeSwitchSlot?: ReactNode;
  navigation: readonly SiteHeaderNavigationItem[];
  onMobileMenuLinkClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  readingProgressSlot?: ReactNode;
};

export function SiteHeaderView({
  brandHref,
  content,
  ctaHref,
  desktopLocaleSwitchSlot,
  desktopThemeSwitchSlot,
  isMinimalHeader = false,
  isScrolled = false,
  mobileLocaleSwitchSlot,
  mobileNavigation,
  mobileThemeSwitchSlot,
  navigation,
  onMobileMenuLinkClick,
  readingProgressSlot,
}: SiteHeaderViewProps) {
  const headerClassName = isScrolled
    ? `${styles.header} ${styles.scrolled}`
    : styles.header;

  return (
    <header className={headerClassName} data-site-header="">
      {isMinimalHeader ? null : readingProgressSlot}
      <div className={styles.inner} data-site-header-inner="">
        <SiteHeaderBrand
          brandHref={brandHref}
          brandLabel={content.brandLabel}
        />

        {isMinimalHeader ? null : (
          <SiteHeaderNavigation
            ariaLabel={content.navAriaLabel}
            items={navigation}
          />
        )}

        <div
          aria-label={isMinimalHeader ? undefined : content.actionsAriaLabel}
          className={styles.actions}
          role={isMinimalHeader ? undefined : "group"}
        >
          {isMinimalHeader ? null : desktopThemeSwitchSlot}
          {desktopLocaleSwitchSlot}
          {isMinimalHeader ? null : (
            <SiteHeaderCta href={ctaHref} label={content.ctaLabel} />
          )}
        </div>

        <div className={styles.mobileActions}>
          {mobileLocaleSwitchSlot}
          {isMinimalHeader ? null : (
            <>
              <SiteHeaderCta
                href={ctaHref}
                label={content.ctaLabel}
                variant="mobile"
              />
              <SiteHeaderMobileMenu
                ctaHref={ctaHref}
                ctaLabel={content.ctaLabel}
                menuLabel={content.mobileMenuLabel}
                navigation={mobileNavigation}
                onLinkClick={onMobileMenuLinkClick}
                themeSwitchSlot={mobileThemeSwitchSlot}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
