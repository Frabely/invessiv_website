import Image from "next/image";
import Link from "next/link";
import reviewProjectConsumptionImage from "../../../../../assets/review-project-consumption.png";
import reviewProjectImage from "../../../../../assets/review-project.png";
import { Breadcrumbs } from "@/components/legal/breadcrumbs/breadcrumbs";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { LayoutShell } from "@/components/marketing/shared/layout-shell/layout-shell";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import buttonStyles from "@/components/shared/button/button.module.css";
import { getLocalizedSectionHref, type NavigationItem } from "@/config/site";
import type { Locale } from "@/config/i18n";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import type { ProjectsPageContent } from "@/i18n/dictionaries/marketing/projects";
import styles from "./projects-page.module.css";

type ProjectsPageProps = {
  content: ProjectsPageContent;
  locale: Locale;
};

const PROJECT_IMAGES = {
  broker: reviewProjectImage,
  consumption: reviewProjectConsumptionImage,
} as const;

export function ProjectsPage({ content, locale }: ProjectsPageProps) {
  const navigation: NavigationItem[] = [
    { href: getLocalizedSectionHref(locale, "included") },
    { href: getLocalizedSectionHref(locale, "services") },
    { href: getLocalizedSectionHref(locale, "process") },
    { href: getLocalizedSectionHref(locale, "faq") },
  ];
  const footerSection = getHomeSections(locale).find(
    (section) => section.id === "footer",
  );
  const localizeFooterHref = (href: string) => {
    if (href.startsWith("#")) {
      return `/${locale}${href}`;
    }

    return href;
  };
  const localizedFooterColumns =
    footerSection?.footerColumns?.map((column) => ({
      ...column,
      links: column.links.map((link) => ({
        ...link,
        href: localizeFooterHref(link.href),
      })),
    })) ?? [];
  const localizedFooterLegalLinks =
    footerSection?.footerLegalLinks?.map((link) => ({
      ...link,
      href: localizeFooterHref(link.href),
    })) ?? [];

  return (
    <>
      <SiteHeader
        brandHref={`/${locale}`}
        ctaHref={getLocalizedSectionHref(locale, "contact")}
        navigation={navigation}
      />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <LayoutShell className={styles.pageShell}>
          <section className={styles.pageHero}>
            <div className={styles.breadcrumbs}>
              <Breadcrumbs
                items={[
                  {
                    href: `/${locale}`,
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
                <p className={styles.supportingNote}>
                  {content.hero.supportingNote}
                </p>
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
          </section>

          <section className={styles.projectsSection}>
            <div className={styles.projectsGrid}>
              {content.projects.map((project, index) => (
                <article
                  className={styles.projectCard}
                  data-layout={index % 2 === 1 ? "reverse" : "default"}
                  data-project={project.imageKey}
                  key={project.title}
                >
                  <div className={styles.projectLead}>
                    <div className={styles.projectHeader}>
                      <div className={styles.projectMetaLine}>
                        <p className={styles.projectKicker}>{project.kicker}</p>
                        <span
                          aria-hidden="true"
                          className={styles.projectMetaDivider}
                        />
                        <p className={styles.projectCategory}>
                          {project.category}
                        </p>
                      </div>
                    </div>
                    <h2 className={styles.projectTitle}>{project.title}</h2>
                    <p className={styles.projectSummary}>{project.summary}</p>
                    <div className={styles.focusBlock}>
                      <p className={styles.detailLabel}>{project.focusLabel}</p>
                      <p className={styles.focusText}>{project.focus}</p>
                    </div>
                  </div>

                  {project.imageKey === "broker" ? (
                    <div className={styles.projectMediaColumn}>
                      <div className={styles.projectVisual}>
                        <div
                          className={styles.browserFrame}
                          data-device="browser"
                        >
                          <div
                            className={styles.browserChrome}
                            aria-hidden="true"
                          >
                            <span className={styles.chromeDot} />
                            <span className={styles.chromeDot} />
                            <span className={styles.chromeDot} />
                            <div className={styles.chromeBar} />
                          </div>
                          <div className={styles.browserViewport}>
                            <Image
                              alt={project.imageAlt}
                              className={styles.projectImage}
                              priority={index === 0}
                              src={PROJECT_IMAGES[project.imageKey]}
                            />
                          </div>
                        </div>
                      </div>
                      <div className={styles.projectMeta}>
                        <div className={styles.detailBlock}>
                          <p className={styles.detailLabel}>
                            {project.deliverablesLabel}
                          </p>
                          <ul className={styles.detailList}>
                            {project.deliverables.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className={styles.detailBlock}>
                          <p className={styles.detailLabel}>
                            {project.outcomesLabel}
                          </p>
                          <ul className={styles.detailList}>
                            {project.outcomes.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <a
                          className={styles.projectLink}
                          href={project.href}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className={styles.projectLinkLabel}>
                            {project.linkLabel}
                          </span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.projectVisual}>
                        <div
                          className={styles.browserFrame}
                          data-device="phone"
                        >
                          <div
                            className={styles.browserChrome}
                            aria-hidden="true"
                          >
                            <div className={styles.phoneStatusMeta}>
                              <span className={styles.phoneTime}>09:41</span>
                            </div>
                            <div className={styles.phoneIsland} />
                            <div className={styles.phoneStatusIcons}>
                              <span className={styles.phoneSignal} />
                              <span className={styles.phoneWifi} />
                              <span className={styles.phoneBattery} />
                            </div>
                          </div>
                          <div className={styles.browserViewport}>
                            <Image
                              alt={project.imageAlt}
                              className={styles.projectImage}
                              priority={index === 0}
                              src={PROJECT_IMAGES[project.imageKey]}
                            />
                          </div>
                          <div
                            aria-hidden="true"
                            className={styles.phoneHomeIndicator}
                          />
                        </div>
                      </div>

                      <div className={styles.projectMeta}>
                        <div className={styles.detailBlock}>
                          <p className={styles.detailLabel}>
                            {project.deliverablesLabel}
                          </p>
                          <ul className={styles.detailList}>
                            {project.deliverables.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className={styles.detailBlock}>
                          <p className={styles.detailLabel}>
                            {project.outcomesLabel}
                          </p>
                          <ul className={styles.detailList}>
                            {project.outcomes.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <a
                          className={styles.projectLink}
                          href={project.href}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className={styles.projectLinkLabel}>
                            {project.linkLabel}
                          </span>
                        </a>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>

            <section
              className={styles.closingCta}
              aria-labelledby="projects-cta-title"
            >
              <div className={styles.closingCopy}>
                <h2 className={styles.closingTitle} id="projects-cta-title">
                  {content.closingCta.title}
                </h2>
                <p className={styles.closingText}>
                  {content.closingCta.supportingText}
                </p>
              </div>
              <div className={styles.closingActions}>
                <PrimaryCtaLink
                  href={content.closingCta.primaryHref}
                  useNextLink
                >
                  {content.closingCta.primaryLabel}
                </PrimaryCtaLink>
                <Link
                  className={`${buttonStyles.button} ${buttonStyles.ghost}`}
                  href={content.closingCta.secondaryHref}
                >
                  {content.closingCta.secondaryLabel}
                </Link>
              </div>
            </section>
          </section>
        </LayoutShell>
      </main>

      {footerSection ? (
        <FooterSection
          bottomNote={footerSection.footerBottomNote}
          brand={footerSection.footerBrand}
          columns={localizedFooterColumns}
          copyright={footerSection.footerCopyright}
          description={footerSection.description}
          id="footer"
          legalLinks={localizedFooterLegalLinks}
          socialLinks={footerSection.footerSocialLinks}
        />
      ) : null}
    </>
  );
}
