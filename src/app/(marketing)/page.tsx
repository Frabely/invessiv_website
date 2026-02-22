"use client";

import { SiteHeader } from "@/components/marketing/site-header";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { useLanguage } from "@/components/providers/language-provider";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { getHomeSections } from "@/content/landing/home";
import { validateNavigationSections } from "@/domain/navigation/validate-navigation-sections";

export default function MarketingHomePage() {
  const { locale } = useLanguage();
  const sections = getHomeSections(locale);
  const marqueeItems =
    locale === "de"
      ? [
          "B2B Services",
          "Growth Ops",
          "Lead Funnels",
          "CRO Sprints",
          "SEO Grundlagen",
          "Paid + Organic",
          "CRM Integrationen",
          "Tracking Klarheit",
        ]
      : [
          "B2B Services",
          "Growth Ops",
          "Lead Funnels",
          "CRO Sprints",
          "SEO Foundations",
          "Paid + Organic",
          "CRM Integrations",
          "Tracking Clarity",
        ];

  const heroTag = locale === "de" ? "Individuell statt Baukasten" : "Custom instead of templates";
  const heroPrimaryCta = locale === "de" ? "Projekt anfragen" : "Request project";
  const heroSecondaryCta = locale === "de" ? "Leistungen ansehen" : "View services";
  const heroChipTags =
    locale === "de"
      ? ["Figma-Design inkl.", "Launch in Tagen", "Antwort < 24h"]
      : ["Figma design included", "Launch in days", "Reply < 24h"];

  const getSectionById = (sectionId: (typeof SECTION_IDS)[number]) =>
    sections.find((section) => section.id === sectionId);

  const validation = validateNavigationSections({
    navigationHrefs: PRIMARY_NAVIGATION.map((item) => item.href),
    sectionIds: SECTION_IDS.filter((id) => id !== "hero"),
  });

  return (
    <>
      <SiteHeader navigation={PRIMARY_NAVIGATION} />

      <main>
        <section className="hero" id="hero">
          <div className="hero__noise" />
          <div className="hero__aurora hero__aurora--left" />
          <div className="hero__aurora hero__aurora--right" />

          <div className="hero__grid">
            <div className="hero__content">
              <p className="hero__tag">{heroTag}</p>
              <h1>
                <span className="hero__title-gradient">{sections[0]?.title}</span>
              </h1>
              <p>{sections[0]?.description}</p>
              <div className="hero__cta-row">
                <a className="btn btn--primary" href="#contact">
                  {heroPrimaryCta}
                </a>
                <a className="btn btn--ghost" href="#services">
                  {heroSecondaryCta}
                </a>
              </div>

              <div className="hero__tags" aria-label="Kurzvorteile">
                {heroChipTags.map((item) => (
                  <span className="chip-tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section aria-label="Capability Marquee" className="marquee-section">
          <div className="marquee">
            <div className="marquee__track">
              {marqueeItems.concat(marqueeItems).map((item, index) => (
                <span className="marquee__item" key={`${item}-${index}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="layout-shell">
          {!validation.hasCompleteMapping ? (
            <p className="phase-zero-warning" role="status">
              {locale === "de"
                ? "Navigation/Section Mapping ist unvollstaendig."
                : "Navigation/section mapping is incomplete."}
            </p>
          ) : null}

          {SECTION_IDS.filter((id) => id !== "hero").map((id) => {
            const section = getSectionById(id);
            if (!section) {
              return null;
            }

            return (
              <section className="content-section" id={section.id} key={section.id}>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
