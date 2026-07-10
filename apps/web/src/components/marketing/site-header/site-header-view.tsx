import Image from "next/image";
import type { MouseEvent, ReactNode } from "react";

import buttonStyles from "@/components/shared/button/button.module.css";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { LocaleSwitch } from "@/components/shared/locale-switch/locale-switch";
import { ThemeSwitch } from "@/components/shared/theme-switch/theme-switch";
import localeSwitchStyles from "@/components/shared/locale-switch/locale-switch.module.css";
import type { Locale } from "@/config/i18n";
import type { NavigationItem } from "@/config/navigation/home";
import type { Theme } from "@/lib/theme/theme";
import styles from "./site-header.module.css";

type SiteHeaderViewMode = "interactive" | "decorative";

type SiteHeaderViewContent = {
  actionsAriaLabel: string;
  brandLabel: string;
  brandLogoAlt: string;
  ctaLabel: string;
  labelsByHref: Record<string, string>;
  localeMenuLabel: string;
  localeSwitchLabel: string;
  mobileMenuLabel: string;
  navAriaLabel: string;
};

type SiteHeaderViewProps = {
  brandHref: string;
  ctaHref: string;
  isMinimalHeader?: boolean;
  isScrolled?: boolean;
  locale: Locale;
  mode?: SiteHeaderViewMode;
  navigation?: readonly NavigationItem[];
  onLocaleSelect?: (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  onMobileMenuLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onThemeToggle?: () => void;
  readingProgressSlot?: ReactNode;
  showThemeSwitch?: boolean;
  theme?: Theme;
  themeSwitchCopy?: {
    actionLabel: string;
  };
  uiContent: SiteHeaderViewContent;
};

function getLabelKey(href: string) {
  const hashIndex = href.indexOf("#");

  return hashIndex >= 0 ? href.slice(hashIndex) : href;
}

function StaticLocaleSwitch({
  locale,
  uiContent,
  variant = "desktop",
}: {
  locale: Locale;
  uiContent: SiteHeaderViewContent;
  variant?: "desktop" | "mobile";
}) {
  return (
    <div
      className={`${localeSwitchStyles.root} ${localeSwitchStyles[variant]}`}
    >
      <span className={localeSwitchStyles.summary}>
        <span aria-hidden="true" className={localeSwitchStyles.icon}>
          <svg fill="none" viewBox="0 0 24 24">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
            <path d="M3 12h18" />
            <path d="M12 3a15.5 15.5 0 0 1 0 18" />
            <path d="M12 3a15.5 15.5 0 0 0 0 18" />
          </svg>
        </span>
        <span className={localeSwitchStyles.code}>{locale.toUpperCase()}</span>
      </span>
      <span className="sr-only">{uiContent.localeSwitchLabel}</span>
    </div>
  );
}

function HeaderBrand({
  brandHref,
  mode,
  uiContent,
}: {
  brandHref: string;
  mode: SiteHeaderViewMode;
  uiContent: SiteHeaderViewContent;
}) {
  const children = (
    <>
      <Image
        src="/brand/icon.png"
        alt={mode === "interactive" ? uiContent.brandLogoAlt : ""}
        width={26}
        height={26}
        priority={mode === "interactive"}
        aria-hidden={mode === "decorative" ? "true" : undefined}
      />
      <span>{uiContent.brandLabel}</span>
    </>
  );

  if (mode === "decorative") {
    return (
      <span className={`${styles.brand} site-header__brand`}>{children}</span>
    );
  }

  return (
    <a className={`${styles.brand} site-header__brand`} href={brandHref}>
      {children}
    </a>
  );
}

function HeaderLocaleSwitch({
  locale,
  mode,
  onLocaleSelect,
  uiContent,
  variant = "desktop",
}: {
  locale: Locale;
  mode: SiteHeaderViewMode;
  onLocaleSelect?: SiteHeaderViewProps["onLocaleSelect"];
  uiContent: SiteHeaderViewContent;
  variant?: "desktop" | "mobile";
}) {
  if (mode === "decorative" || !onLocaleSelect) {
    return (
      <StaticLocaleSwitch
        locale={locale}
        uiContent={uiContent}
        variant={variant}
      />
    );
  }

  return (
    <LocaleSwitch
      locale={locale}
      localeMenuLabel={uiContent.localeMenuLabel}
      localeSwitchLabel={uiContent.localeSwitchLabel}
      onSelectAction={onLocaleSelect}
      variant={variant}
    />
  );
}

function DesktopNavigation({
  mode,
  navigation,
  uiContent,
}: {
  mode: SiteHeaderViewMode;
  navigation: readonly NavigationItem[];
  uiContent: SiteHeaderViewContent;
}) {
  return (
    <nav aria-label={uiContent.navAriaLabel} className={styles.desktopNav}>
      <ul className={styles.navList}>
        {navigation.map((item) => (
          <li key={item.href}>
            {mode === "decorative" ? (
              <span className={styles.navLink}>
                {uiContent.labelsByHref[getLabelKey(item.href)] ?? item.href}
              </span>
            ) : (
              <a className={styles.navLink} href={item.href}>
                {uiContent.labelsByHref[getLabelKey(item.href)] ?? item.href}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DesktopCta({
  ctaHref,
  mode,
  uiContent,
}: {
  ctaHref: string;
  mode: SiteHeaderViewMode;
  uiContent: SiteHeaderViewContent;
}) {
  if (mode === "decorative") {
    return (
      <span
        className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.navCta}`}
      >
        {uiContent.ctaLabel}
      </span>
    );
  }

  return (
    <PrimaryCtaLink
      className={styles.navCta}
      href={ctaHref}
      data-analytics-event="cta_click"
      data-analytics-location="nav"
      data-analytics-variant="primary"
      data-analytics-target="form"
    >
      {uiContent.ctaLabel}
    </PrimaryCtaLink>
  );
}

function MobileCta({
  ctaHref,
  mode,
  uiContent,
}: {
  ctaHref: string;
  mode: SiteHeaderViewMode;
  uiContent: SiteHeaderViewContent;
}) {
  const children = (
    <>
      <span aria-hidden="true" className={styles.mobileCtaIcon}>
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M7.5 19.5 3 21l1.5-4.5" />
          <path d="M7.5 19.5a9 9 0 1 0-3-6.72" />
          <circle cx="9.75" cy="12" fill="currentColor" r="0.9" stroke="none" />
          <circle
            cx="12.75"
            cy="12"
            fill="currentColor"
            r="0.9"
            stroke="none"
          />
          <circle
            cx="15.75"
            cy="12"
            fill="currentColor"
            r="0.9"
            stroke="none"
          />
        </svg>
      </span>
      <span className="sr-only">{uiContent.ctaLabel}</span>
    </>
  );

  if (mode === "decorative") {
    return (
      <span
        className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.navCta} ${styles.mobileCta}`}
      >
        {children}
      </span>
    );
  }

  return (
    <PrimaryCtaLink
      aria-label={uiContent.ctaLabel}
      className={`${styles.navCta} ${styles.mobileCta}`}
      href={ctaHref}
      title={uiContent.ctaLabel}
      data-analytics-event="cta_click"
      data-analytics-location="nav"
      data-analytics-variant="primary"
      data-analytics-target="form"
    >
      {children}
    </PrimaryCtaLink>
  );
}

function MobileMenu({
  ctaHref,
  mobileNavigation,
  mode,
  onMobileMenuLinkClick,
  onThemeToggle,
  showThemeSwitch,
  theme,
  themeSwitchCopy,
  uiContent,
}: {
  ctaHref: string;
  mobileNavigation: readonly NavigationItem[];
  mode: SiteHeaderViewMode;
  onMobileMenuLinkClick?: SiteHeaderViewProps["onMobileMenuLinkClick"];
  onThemeToggle?: SiteHeaderViewProps["onThemeToggle"];
  showThemeSwitch: boolean;
  theme?: Theme;
  themeSwitchCopy?: SiteHeaderViewProps["themeSwitchCopy"];
  uiContent: SiteHeaderViewContent;
}) {
  if (mode === "decorative") {
    return (
      <div className={styles.mobileMenu}>
        <span className={styles.mobileMenuSummary}>
          <span aria-hidden="true" className={styles.mobileMenuIcon}>
            <span className={styles.mobileMenuIconLine} />
            <span className={styles.mobileMenuIconLine} />
            <span className={styles.mobileMenuIconLine} />
          </span>
        </span>
      </div>
    );
  }

  return (
    <details className={`${styles.mobileMenu} site-header__mobile-menu`}>
      <summary
        aria-label={uiContent.mobileMenuLabel}
        className={styles.mobileMenuSummary}
      >
        <span className="sr-only">{uiContent.mobileMenuLabel}</span>
        <span aria-hidden="true" className={styles.mobileMenuIcon}>
          <span className={styles.mobileMenuIconLine} />
          <span className={styles.mobileMenuIconLine} />
          <span className={styles.mobileMenuIconLine} />
        </span>
      </summary>
      <ul className={styles.mobileMenuList}>
        {showThemeSwitch && themeSwitchCopy && theme && onThemeToggle ? (
          <li className={styles.mobileMenuListItem}>
            <ThemeSwitch
              copy={themeSwitchCopy}
              onToggle={onThemeToggle}
              theme={theme}
              variant="mobile"
            />
          </li>
        ) : null}
        {mobileNavigation.map((item) => (
          <li className={styles.mobileMenuListItem} key={item.href}>
            <a
              className={styles.mobileMenuLink}
              href={item.href}
              onClick={onMobileMenuLinkClick}
            >
              {uiContent.labelsByHref[getLabelKey(item.href)] ?? item.href}
            </a>
          </li>
        ))}
        <li className={styles.mobileMenuListItem}>
          <PrimaryCtaLink
            className={styles.mobileMenuCta}
            href={ctaHref}
            onClick={onMobileMenuLinkClick}
            data-analytics-event="cta_click"
            data-analytics-location="nav"
            data-analytics-variant="primary"
            data-analytics-target="form"
          >
            {uiContent.ctaLabel}
          </PrimaryCtaLink>
        </li>
      </ul>
    </details>
  );
}

export function SiteHeaderView({
  brandHref,
  ctaHref,
  isMinimalHeader = false,
  isScrolled = false,
  locale,
  mode = "interactive",
  navigation = [],
  onLocaleSelect,
  onMobileMenuLinkClick,
  onThemeToggle,
  readingProgressSlot,
  showThemeSwitch = true,
  theme,
  themeSwitchCopy,
  uiContent,
}: SiteHeaderViewProps) {
  const ctaLabelKey = getLabelKey(ctaHref);
  const mobileNavigation = navigation.filter(
    (item) => getLabelKey(item.href) !== ctaLabelKey,
  );
  const headerClassName = isScrolled
    ? `${styles.header} ${styles.headerScrolled} site-header is-scrolled`
    : `${styles.header} site-header`;

  return (
    <header
      className={headerClassName}
      data-hero-zoom-replica-header-bar={mode === "decorative" ? "" : undefined}
    >
      {isMinimalHeader ? null : readingProgressSlot}
      <div className={`${styles.inner} site-header__inner`}>
        <HeaderBrand brandHref={brandHref} mode={mode} uiContent={uiContent} />

        {isMinimalHeader ? null : (
          <DesktopNavigation
            mode={mode}
            navigation={navigation}
            uiContent={uiContent}
          />
        )}

        <div
          className={styles.actions}
          aria-label={isMinimalHeader ? undefined : uiContent.actionsAriaLabel}
        >
          {!isMinimalHeader &&
          showThemeSwitch &&
          themeSwitchCopy &&
          theme &&
          onThemeToggle ? (
            <ThemeSwitch
              copy={themeSwitchCopy}
              onToggle={onThemeToggle}
              theme={theme}
            />
          ) : null}
          <HeaderLocaleSwitch
            locale={locale}
            mode={mode}
            onLocaleSelect={onLocaleSelect}
            uiContent={uiContent}
          />
          {isMinimalHeader ? null : (
            <DesktopCta ctaHref={ctaHref} mode={mode} uiContent={uiContent} />
          )}
        </div>

        <div className={styles.mobileActions}>
          <HeaderLocaleSwitch
            locale={locale}
            mode={mode}
            onLocaleSelect={onLocaleSelect}
            uiContent={uiContent}
            variant="mobile"
          />
          {isMinimalHeader ? null : (
            <>
              <MobileCta ctaHref={ctaHref} mode={mode} uiContent={uiContent} />
              <MobileMenu
                ctaHref={ctaHref}
                mobileNavigation={mobileNavigation}
                mode={mode}
                onMobileMenuLinkClick={onMobileMenuLinkClick}
                onThemeToggle={onThemeToggle}
                showThemeSwitch={showThemeSwitch}
                theme={theme}
                themeSwitchCopy={themeSwitchCopy}
                uiContent={uiContent}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
