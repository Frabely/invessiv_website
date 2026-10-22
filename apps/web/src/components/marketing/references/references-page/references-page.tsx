import { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import { Breadcrumbs } from "@/components/legal/breadcrumbs/breadcrumbs";
import { SectionReachTracker } from "@/components/shared/analytics/section-reach-tracker/section-reach-tracker";
import { REFERENCES_PAGE_SECTION_IDS } from "@/config/navigation/references";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { LayoutShell } from "@/components/marketing/shared/layout-shell/layout-shell";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import {
  getLocalizedSectionHref,
  type NavigationItem,
  FOOTER_SECTION_ID,
  PRIMARY_NAVIGATION_SECTION_IDS,
} from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import type { ReferencesPageContent } from "@/i18n/dictionaries/marketing/references";
import { getHomeFooterSectionContent } from "@/lib/navigation/home-footer-section";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { ReferenceProjectCard } from "./reference-project-card/reference-project-card";
import { ReferencesClosingCta } from "./references-closing-cta/references-closing-cta";
import styles from "./references-page.module.css";

type ReferencesPageProps = {
  content: ReferencesPageContent;
  locale: Locale;
};

const CLOSING_CTA_TITLE_ID = "references-cta-title";

export function ReferencesPage({ content, locale }: ReferencesPageProps) {
  // Same entries as the home header, so the two can never drift apart.
  const navigation: NavigationItem[] = PRIMARY_NAVIGATION_SECTION_IDS.map(
    (sectionId) => ({ href: getLocalizedSectionHref(locale, sectionId) }),
  );
  const footerSection = getHomeFooterSectionContent(locale);
  const homeHref = createLocalePathname(SITE_ROUTES.HOME, locale);
  const sectionIds = [
    REFERENCES_PAGE_SECTION_IDS.hero,
    ...content.projects.map(
      (project) => REFERENCE_SECTION_IDS[project.imageKey],
    ),
    REFERENCES_PAGE_SECTION_IDS.closingCta,
    FOOTER_SECTION_ID,
  ];

  return (
    <>
      <SectionReachTracker
        page={AnalyticsPage.References}
        sectionIds={sectionIds}
      />
      <SiteHeader
        brandHref={homeHref}
        ctaHref={getLocalizedSectionHref(locale, "contact")}
        navigation={navigation}
      />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <LayoutShell className={styles.pageShell}>
          <section
            className={styles.pageHero}
            id={REFERENCES_PAGE_SECTION_IDS.hero}
          >
            <div className={styles.breadcrumbs}>
              <Breadcrumbs
                items={[
                  {
                    href: homeHref,
                    isLink: true,
                    label: content.breadcrumbs.homeLabel,
                  },
                  {
                    isLink: false,
                    label: content.breadcrumbs.currentLabel,
                  },
                ]}
                navLabel={content.breadcrumbs.navLabel}
              />
            </div>

            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <EyebrowPill>{content.hero.kicker}</EyebrowPill>
                <h1 className={styles.title}>{content.hero.title}</h1>
                <p className={styles.intro}>{content.hero.intro}</p>
                <SectionScanPoints
                  ariaLabel={content.hero.kicker}
                  className={styles.heroHighlights}
                  fallbackClassName={styles.intro}
                  fallbackText={content.hero.intro}
                  points={content.hero.highlights}
                />
              </div>

              <aside className={styles.heroAside}>
                <EyebrowPill>{content.sectionIntro.eyebrow}</EyebrowPill>
                <h2 className={styles.sectionTitle}>
                  {content.sectionIntro.title}
                </h2>
                <p className={styles.sectionDescription}>
                  {content.sectionIntro.description}
                </p>
              </aside>
            </div>

            <p className={styles.supportingNote}>
              {content.hero.supportingNote}
            </p>
          </section>

          <section className={styles.projectsSection}>
            <div className={styles.projectsGrid}>
              {content.projects.map((project, index) => (
                <ReferenceProjectCard
                  isPriorityMedia={index === 0}
                  key={project.imageKey}
                  project={project}
                  testimonialLabels={content.testimonialLabels}
                />
              ))}
            </div>

            <ReferencesClosingCta
              content={content.closingCta}
              locale={locale}
              titleId={CLOSING_CTA_TITLE_ID}
            />
          </section>
        </LayoutShell>
      </main>

      {footerSection ? (
        <FooterSection
          description={footerSection.description}
          locale={locale}
          navColumn={footerSection.navColumn}
        />
      ) : null}
    </>
  );
}
