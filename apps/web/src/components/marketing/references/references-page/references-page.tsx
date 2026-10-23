import { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import { SectionReachTracker } from "@/components/shared/analytics/section-reach-tracker/section-reach-tracker";
import { REFERENCES_PAGE_SECTION_IDS } from "@/config/navigation/references";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { LayoutShell } from "@/components/marketing/shared/layout-shell/layout-shell";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
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
import { ReferencesHero } from "./references-hero/references-hero";
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
          <ReferencesHero
            breadcrumbs={content.breadcrumbs}
            content={content.hero}
            homeHref={homeHref}
            projects={content.projects}
          />

          <div className={styles.projectsSection}>
            <div className={styles.projectsList}>
              {content.projects.map((project) => (
                <ReferenceProjectCard
                  key={project.imageKey}
                  labels={content.labels}
                  project={project}
                />
              ))}
            </div>

            <ReferencesClosingCta
              content={content.closingCta}
              locale={locale}
              titleId={CLOSING_CTA_TITLE_ID}
            />
          </div>
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
